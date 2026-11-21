using System.Security.Claims;
using ElectroSL_Backend.DTOs.Job;
using ElectroSL_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ElectroSL_Backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class JobController : ControllerBase
{
    private readonly IJobService _jobService;
    private readonly IDocumentStorageService _documentStorageService;

    public JobController(IJobService jobService, IDocumentStorageService documentStorageService)
    {
        _jobService = jobService;
        _documentStorageService = documentStorageService;
    }

    [HttpPost("create")]
    public IActionResult CreateJob([FromBody] CreateJobDto request)
    {
        return Ok(new { message = "Job created. 10km Dispatch logic runs here." });
    }

    [HttpGet("nearby")]
    public IActionResult GetNearbyJobs([FromQuery] double lat, [FromQuery] double lng)
    {
        // Haversine formula logic goes here to find jobs within 10km
        return Ok(new { message = "Returning jobs within 10km radius" });
    }

    [Authorize]
    [HttpPost("{jobId}/equipment-claims")]
    public async Task<IActionResult> SubmitEquipmentClaims(int jobId, [FromBody] List<EquipmentItemDto> items)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var electricianUserId = GetCurrentUserId();
        var result = await _jobService.SubmitEquipmentClaimsAsync(jobId, items, electricianUserId);

        return MapSubmissionResult(result);
    }

    [Authorize]
    [HttpPost("equipment-list")]
    public async Task<IActionResult> SubmitEquipmentList([FromBody] EquipmentListDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var electricianUserId = GetCurrentUserId();
        var result = await _jobService.SubmitEquipmentClaimsAsync(dto.JobId, dto.Items, electricianUserId);

        return MapSubmissionResult(result);
    }

    [Authorize]
    [HttpPost("{jobId}/equipment-claims/with-receipt")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> SubmitSingleClaimWithReceipt(int jobId, [FromForm] SubmitSingleClaimFormDto formDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var electricianUserId = GetCurrentUserId();
        var result = await _jobService.SubmitSingleClaimWithReceiptAsync(jobId, formDto, electricianUserId);

        return MapSubmissionResult(result);
    }

    [Authorize]
    [HttpGet("{jobId}/equipment")]
    public async Task<IActionResult> GetJobEquipment(int jobId)
    {
        var currentUserId = GetCurrentUserId();
        var userRole = GetCurrentUserRole();
        var result = await _jobService.GetJobEquipmentClaimsAsync(jobId, currentUserId, userRole);

        return result.Status switch
        {
            QueryResultStatus.Success => Ok(result.Claims),
            QueryResultStatus.NotFound => NotFound(new { message = result.Message }),
            QueryResultStatus.Forbidden => StatusCode(403, new { message = result.Message }),
            _ => BadRequest(new { message = result.Message })
        };
    }

    [Authorize]
    [HttpGet("receipts/{fileName}")]
    public async Task<IActionResult> GetReceiptImage(string fileName)
    {
        var currentUserId = GetCurrentUserId();
        var userRole = GetCurrentUserRole();
        var result = await _jobService.GetAuthorizedReceiptStreamAsync(fileName, currentUserId, userRole);

        return result.Status switch
        {
            ReceiptAuthStatus.Success => File(result.Stream!, result.ContentType, result.FileName),
            ReceiptAuthStatus.NotFound => NotFound(new { message = result.Message }),
            ReceiptAuthStatus.Forbidden => StatusCode(403, new { message = result.Message }),
            _ => BadRequest(new { message = result.Message })
        };
    }

    private int GetCurrentUserId()
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;
        return int.TryParse(idClaim, out int userId) ? userId : 0;
    }

    private string GetCurrentUserRole()
    {
        return User.FindFirst(ClaimTypes.Role)?.Value
            ?? User.FindFirst("role")?.Value
            ?? string.Empty;
    }

    private IActionResult MapSubmissionResult(EquipmentClaimSubmissionResult result)
    {
        return result.Status switch
        {
            ClaimSubmissionStatus.Success => StatusCode(201, new
            {
                message = result.Message,
                claims = result.Claims,
                autoApprovedCount = result.AutoApprovedCount,
                flaggedCount = result.FlaggedCount
            }),
            ClaimSubmissionStatus.NotFound => NotFound(new { message = result.Message }),
            ClaimSubmissionStatus.Forbidden => StatusCode(403, new { message = result.Message }),
            ClaimSubmissionStatus.Invalid => BadRequest(new { message = result.Message }),
            ClaimSubmissionStatus.Duplicate => Conflict(new { message = result.Message }),
            _ => BadRequest(new { message = result.Message })
        };
    }
}
