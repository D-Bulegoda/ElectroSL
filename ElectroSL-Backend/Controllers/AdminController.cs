using System.Security.Claims;
using ElectroSL_Backend.DTOs.Admin;
using ElectroSL_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ElectroSL_Backend.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;
    private readonly IWebHostEnvironment _environment;

    public AdminController(IAdminService adminService, IWebHostEnvironment environment)
    {
        _adminService = adminService;
        _environment = environment;
    }

    private int? GetCurrentAdminUserId()
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (int.TryParse(idClaim, out var adminId))
        {
            return adminId;
        }

        return null;
    }

    [HttpGet("applications")]
    public async Task<IActionResult> GetApplications([FromQuery] string? status = "Pending")
    {
        var applications = await _adminService.GetApplicationsByStatusAsync(status ?? string.Empty);
        return Ok(applications);
    }

    [HttpGet("applications/{profileId}")]
    public async Task<IActionResult> GetApplicationDetail(int profileId)
    {
        var application = await _adminService.GetApplicationDetailAsync(profileId);
        if (application == null)
        {
            return NotFound(new { message = $"Application with ProfileId {profileId} not found." });
        }
        return Ok(application);
    }

    [HttpGet("applications/{profileId}/document/{docType}")]
    public async Task<IActionResult> GetDocument(int profileId, string docType)
    {
        var application = await _adminService.GetApplicationDetailAsync(profileId);
        if (application == null)
        {
            return NotFound(new { message = "Application not found." });
        }

        string relativeUrl = docType.ToLower() switch
        {
            "nic" => application.NicDocumentUrl,
            "nvq" => application.NvqCertificateUrl,
            _ => string.Empty
        };

        if (string.IsNullOrWhiteSpace(relativeUrl))
        {
            return NotFound(new { message = $"Document type '{docType}' is not available for this profile." });
        }

        var webRoot = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
        var filePath = Path.Combine(webRoot, relativeUrl.TrimStart('/', '\\'));

        if (!System.IO.File.Exists(filePath))
        {
            // If the physical file doesn't exist on disk, return the relative URL
            return Ok(new { url = relativeUrl, message = "Document record found but file is not on local disk." });
        }

        var ext = Path.GetExtension(filePath).ToLowerInvariant();
        var contentType = ext switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".pdf" => "application/pdf",
            _ => "application/octet-stream"
        };

        return PhysicalFile(filePath, contentType);
    }

    [HttpPut("applications/{profileId}/approve")]
    public async Task<IActionResult> ApproveApplication(int profileId)
    {
        var adminUserId = GetCurrentAdminUserId();

        if (adminUserId == null)
            return Unauthorized(new { message = "Invalid admin identity." });
       var success = await _adminService.ApproveApplicationAsync(profileId, adminUserId.Value);

        if (!success)
        {
            return BadRequest(new 
            { 
                message = "Cannot approve application. Verify that both NIC and NVQ documents are uploaded and the electrician has passed the simulator test." 
            });
        }

        return Ok(new { message = $"Technician {profileId} has been successfully approved.", profileId, status = "Approved" });
    }

    [HttpPut("applications/{profileId}/reject")]
    public async Task<IActionResult> RejectApplication(int profileId, [FromBody] RejectApplicationDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var adminUserId = GetCurrentAdminUserId();

        if (adminUserId == null)
            return Unauthorized(new { message = "Invalid admin identity." });
        
        var success = await _adminService.RejectApplicationAsync(profileId, dto.Reason, adminUserId.Value);

        if (!success)
        {
            return NotFound(new { message = $"Application with ProfileId {profileId} not found." });
        }

        return Ok(new 
        { 
            message = $"Technician {profileId} has been rejected.", 
            profileId, 
            status = "Rejected",
            reason = dto.Reason 
        });
    }

    [HttpGet("dashboard-stats")]
    public async Task<IActionResult> GetDashboardStats()
    {
        var stats = await _adminService.GetDashboardStatsAsync();
        return Ok(stats);
    }

    [HttpGet("catalog")]
    public async Task<IActionResult> GetCatalog([FromQuery] string? category, [FromQuery] string? search)
    {
        var items = await _adminService.GetAllCatalogItemsAsync(category, search);
        return Ok(items);
    }

    [HttpGet("catalog/{itemId}")]
    public async Task<IActionResult> GetCatalogItem(int itemId)
    {
        var item = await _adminService.GetCatalogItemAsync(itemId);
        if (item == null)
        {
            return NotFound(new { message = $"Catalog item {itemId} not found." });
        }
        return Ok(item);
    }

    [HttpPost("catalog")]
    public async Task<IActionResult> CreateCatalogItem([FromBody] CreateCatalogItemDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var created = await _adminService.CreateCatalogItemAsync(dto);
        return CreatedAtAction(nameof(GetCatalogItem), new { itemId = created.ItemId }, created);
    }

    [HttpPut("catalog/{itemId}")]
    public async Task<IActionResult> UpdateCatalogItem(int itemId, [FromBody] UpdateCatalogItemDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var success = await _adminService.UpdateCatalogItemAsync(itemId, dto);
        if (!success)
        {
            return NotFound(new { message = $"Catalog item {itemId} not found." });
        }

        return Ok(new { message = $"Catalog item {itemId} successfully updated." });
    }

    [HttpDelete("catalog/{itemId}")]
    public async Task<IActionResult> DeleteCatalogItem(int itemId)
    {
        var success = await _adminService.DeleteCatalogItemAsync(itemId);
        if (!success)
        {
            return NotFound(new { message = $"Catalog item {itemId} not found." });
        }

        return Ok(new { message = $"Catalog item {itemId} successfully removed." });
    }
}
