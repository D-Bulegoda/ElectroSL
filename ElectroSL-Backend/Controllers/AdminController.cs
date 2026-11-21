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
    private readonly IDocumentStorageService _documentStorageService;

    public AdminController(IAdminService adminService, IDocumentStorageService documentStorageService)
    {
        _adminService = adminService;
        _documentStorageService = documentStorageService;
    }

    private int GetCurrentAdminUserId()
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                      ?? User.FindFirst("sub")?.Value 
                      ?? User.FindFirst("id")?.Value;

        if (int.TryParse(idClaim, out var adminId))
        {
            return adminId;
        }

        return 1; // Default fallback for local development or seed admin
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
            return NotFound(new { message = $"Application with ProfileId {profileId} not found." });
        }

        string storageKey = docType.ToLowerInvariant() switch
        {
            "nic" => application.NicDocumentUrl,
            "nvq" => application.NvqCertificateUrl,
            _ => string.Empty
        };

        if (string.IsNullOrWhiteSpace(storageKey))
        {
            return NotFound(new { message = $"Document type '{docType}' is not attached to this profile." });
        }

        var result = _documentStorageService.GetDocumentStream(storageKey);
        if (result == null)
        {
            return NotFound(new { message = $"The {docType.ToUpper()} document file could not be found in secure storage." });
        }

        return File(result.Value.Stream, result.Value.ContentType, enableRangeProcessing: true);
    }

    [HttpPut("applications/{profileId}/approve")]
    public async Task<IActionResult> ApproveApplication(int profileId)
    {
        var adminUserId = GetCurrentAdminUserId();
        var result = await _adminService.ApproveApplicationAsync(profileId, adminUserId);

        return result.Status switch
        {
            ReviewResultStatus.NotFound => NotFound(new { message = result.Message }),
            ReviewResultStatus.InvalidPrerequisites => BadRequest(new 
            { 
                message = result.Message, 
                canOverride = result.Message.Contains("simulator", StringComparison.OrdinalIgnoreCase) 
            }),
            ReviewResultStatus.Conflict => Conflict(new { message = result.Message, currentStatus = result.CurrentStatus }),
            ReviewResultStatus.Success => Ok(new { message = result.Message, profileId, status = result.CurrentStatus }),
            _ => BadRequest(new { message = result.Message })
        };
    }

    [HttpPut("applications/{profileId}/approve-override")]
    public async Task<IActionResult> ApproveApplicationWithOverride(int profileId, [FromBody] SimulatorOverrideDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var adminUserId = GetCurrentAdminUserId();
        var result = await _adminService.ApproveApplicationWithOverrideAsync(profileId, dto.Explanation, adminUserId);

        return result.Status switch
        {
            ReviewResultStatus.NotFound => NotFound(new { message = result.Message }),
            ReviewResultStatus.InvalidPrerequisites => BadRequest(new { message = result.Message }),
            ReviewResultStatus.Conflict => Conflict(new { message = result.Message, currentStatus = result.CurrentStatus }),
            ReviewResultStatus.Success => Ok(new { message = result.Message, profileId, status = result.CurrentStatus, overrideRecorded = true }),
            _ => BadRequest(new { message = result.Message })
        };
    }

    [HttpPut("applications/{profileId}/reject")]
    public async Task<IActionResult> RejectApplication(int profileId, [FromBody] RejectApplicationDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var adminUserId = GetCurrentAdminUserId();
        var result = await _adminService.RejectApplicationAsync(profileId, dto.Reason, adminUserId);

        return result.Status switch
        {
            ReviewResultStatus.NotFound => NotFound(new { message = result.Message }),
            ReviewResultStatus.InvalidPrerequisites => BadRequest(new { message = result.Message }),
            ReviewResultStatus.Conflict => Conflict(new { message = result.Message, currentStatus = result.CurrentStatus }),
            ReviewResultStatus.Success => Ok(new { message = result.Message, profileId, status = result.CurrentStatus, reason = dto.Reason }),
            _ => BadRequest(new { message = result.Message })
        };
    }

    [HttpPut("applications/{profileId}/revoke")]
    public async Task<IActionResult> RevokeApplication(int profileId, [FromBody] RevokeApplicationDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var adminUserId = GetCurrentAdminUserId();
        var result = await _adminService.RevokeApplicationAsync(profileId, dto.Reason, adminUserId);

        return result.Status switch
        {
            ReviewResultStatus.NotFound => NotFound(new { message = result.Message }),
            ReviewResultStatus.InvalidPrerequisites => BadRequest(new { message = result.Message }),
            ReviewResultStatus.Conflict => Conflict(new { message = result.Message, currentStatus = result.CurrentStatus }),
            ReviewResultStatus.Success => Ok(new { message = result.Message, profileId, status = result.CurrentStatus, reason = dto.Reason }),
            _ => BadRequest(new { message = result.Message })
        };
    }

    [HttpGet("applications/{profileId}/audit-logs")]
    public async Task<IActionResult> GetAuditLogs(int profileId)
    {
        var logs = await _adminService.GetApplicationAuditLogsAsync(profileId);
        return Ok(logs);
    }

    [HttpGet("dashboard-stats")]
    public async Task<IActionResult> GetDashboardStats()
    {
        var stats = await _adminService.GetDashboardStatsAsync();
        return Ok(stats);
    }

    [HttpGet("catalog")]
    public async Task<IActionResult> GetCatalog([FromQuery] string? category, [FromQuery] string? search, [FromQuery] bool? isActive)
    {
        var items = await _adminService.GetAllCatalogItemsAsync(category, search, isActive);
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

    [HttpGet("catalog/{itemId}/history")]
    public async Task<IActionResult> GetCatalogPriceHistory(int itemId)
    {
        var item = await _adminService.GetCatalogItemAsync(itemId);
        if (item == null)
        {
            return NotFound(new { message = $"Catalog item {itemId} not found." });
        }

        var history = await _adminService.GetCatalogItemPriceHistoryAsync(itemId);
        return Ok(history);
    }

    [HttpPost("catalog")]
    public async Task<IActionResult> CreateCatalogItem([FromBody] CreateCatalogItemDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _adminService.CreateCatalogItemAsync(dto);
        return result.Status switch
        {
            CatalogResultStatus.Invalid => BadRequest(new { message = result.Message }),
            CatalogResultStatus.Success => CreatedAtAction(nameof(GetCatalogItem), new { itemId = result.Data!.ItemId }, result.Data),
            _ => BadRequest(new { message = result.Message })
        };
    }

    [HttpPut("catalog/{itemId}")]
    public async Task<IActionResult> UpdateCatalogItem(int itemId, [FromBody] UpdateCatalogItemDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var adminUserId = GetCurrentAdminUserId();
        var result = await _adminService.UpdateCatalogItemAsync(itemId, dto, adminUserId);

        return result.Status switch
        {
            CatalogResultStatus.NotFound => NotFound(new { message = result.Message }),
            CatalogResultStatus.Invalid => BadRequest(new { message = result.Message }),
            CatalogResultStatus.Conflict => Conflict(new { message = result.Message }),
            CatalogResultStatus.Success => Ok(new { message = result.Message, item = result.Data }),
            _ => BadRequest(new { message = result.Message })
        };
    }

    [HttpDelete("catalog/{itemId}")]
    public async Task<IActionResult> DeleteCatalogItem(
        int itemId,
        [FromQuery] int? concurrencyVersion,
        [FromBody(EmptyBodyBehavior = Microsoft.AspNetCore.Mvc.ModelBinding.EmptyBodyBehavior.Allow)] CatalogStatusChangeDto? dto = null)
    {
        var expectedVersion = dto?.ConcurrencyVersion ?? concurrencyVersion;
        var adminUserId = GetCurrentAdminUserId();
        var result = await _adminService.DeactivateCatalogItemAsync(itemId, expectedVersion, adminUserId);

        return result.Status switch
        {
            CatalogResultStatus.NotFound => NotFound(new { message = result.Message }),
            CatalogResultStatus.Conflict => Conflict(new { message = result.Message }),
            CatalogResultStatus.Success => Ok(new { message = result.Message, itemId, isActive = false }),
            _ => BadRequest(new { message = result.Message })
        };
    }

    [HttpPut("catalog/{itemId}/activate")]
    public async Task<IActionResult> ActivateCatalogItem(
        int itemId,
        [FromQuery] int? concurrencyVersion,
        [FromBody(EmptyBodyBehavior = Microsoft.AspNetCore.Mvc.ModelBinding.EmptyBodyBehavior.Allow)] CatalogStatusChangeDto? dto = null)
    {
        var expectedVersion = dto?.ConcurrencyVersion ?? concurrencyVersion;
        var adminUserId = GetCurrentAdminUserId();
        var result = await _adminService.ActivateCatalogItemAsync(itemId, expectedVersion, adminUserId);

        return result.Status switch
        {
            CatalogResultStatus.NotFound => NotFound(new { message = result.Message }),
            CatalogResultStatus.Conflict => Conflict(new { message = result.Message }),
            CatalogResultStatus.Success => Ok(new { message = result.Message, itemId, isActive = true }),
            _ => BadRequest(new { message = result.Message })
        };
    }

    [HttpGet("equipment-claims")]
    public async Task<IActionResult> GetEquipmentClaims([FromQuery] string? status, [FromQuery] string? search, [FromQuery] string? category)
    {
        var claims = await _adminService.GetEquipmentClaimsAsync(status, search, category);
        return Ok(claims);
    }

    [HttpGet("equipment-claims/{claimId}")]
    public async Task<IActionResult> GetEquipmentClaimDetail(int claimId)
    {
        var claim = await _adminService.GetEquipmentClaimDetailAsync(claimId);
        if (claim == null)
        {
            return NotFound(new { message = $"Equipment claim #{claimId} not found." });
        }
        return Ok(claim);
    }

    [HttpPut("equipment-claims/{claimId}/approve")]
    public async Task<IActionResult> ApproveEquipmentClaim(int claimId, [FromBody] ReviewEquipmentClaimDto? dto)
    {
        var adminUserId = GetCurrentAdminUserId();
        var result = await _adminService.ApproveEquipmentClaimAsync(claimId, dto?.ReviewNotes, adminUserId);

        return result.Status switch
        {
            ClaimReviewStatus.NotFound => NotFound(new { message = result.Message }),
            ClaimReviewStatus.Conflict => Conflict(new { message = result.Message, currentStatus = result.CurrentStatus }),
            ClaimReviewStatus.Success => Ok(new { message = result.Message, claimId, status = result.CurrentStatus }),
            _ => BadRequest(new { message = result.Message })
        };
    }

    [HttpPut("equipment-claims/{claimId}/reject")]
    public async Task<IActionResult> RejectEquipmentClaim(int claimId, [FromBody] ReviewEquipmentClaimDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto?.ReviewNotes) || dto.ReviewNotes.Trim().Length < 10)
        {
            return BadRequest(new { message = "A meaningful rejection explanation of at least 10 characters is mandatory." });
        }

        var adminUserId = GetCurrentAdminUserId();
        var result = await _adminService.RejectEquipmentClaimAsync(claimId, dto.ReviewNotes, adminUserId);

        return result.Status switch
        {
            ClaimReviewStatus.NotFound => NotFound(new { message = result.Message }),
            ClaimReviewStatus.Conflict => Conflict(new { message = result.Message, currentStatus = result.CurrentStatus }),
            ClaimReviewStatus.Invalid => BadRequest(new { message = result.Message }),
            ClaimReviewStatus.Success => Ok(new { message = result.Message, claimId, status = result.CurrentStatus }),
            _ => BadRequest(new { message = result.Message })
        };
    }

    // ==========================================
    // Phase 3 — User Management Endpoints
    // ==========================================

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers(
        [FromQuery] string? role,
        [FromQuery] string? search,
        [FromQuery] string? status)
    {
        var users = await _adminService.GetUsersAsync(role, search, status);
        return Ok(users);
    }

    [HttpGet("users/{userId}")]
    public async Task<IActionResult> GetUserDetail(int userId)
    {
        var user = await _adminService.GetUserDetailAsync(userId);
        if (user == null)
        {
            return NotFound(new { message = $"User with ID {userId} not found." });
        }
        return Ok(user);
    }

    [HttpPut("users/{userId}/activate")]
    public async Task<IActionResult> ActivateUser(int userId, [FromBody] UserStatusChangeDto dto)
    {
        var adminUserId = GetCurrentAdminUserId();
        var result = await _adminService.ActivateUserAsync(userId, dto?.ConcurrencyVersion, adminUserId);
        return MapUserActionResult(result);
    }

    [HttpPut("users/{userId}/deactivate")]
    public async Task<IActionResult> DeactivateUser(int userId, [FromBody] UserStatusChangeDto dto)
    {
        var adminUserId = GetCurrentAdminUserId();
        var result = await _adminService.DeactivateUserAsync(userId, dto?.ConcurrencyVersion, adminUserId);
        return MapUserActionResult(result);
    }

    [HttpPut("users/{userId}/suspend")]
    public async Task<IActionResult> SuspendUser(int userId, [FromBody] UserStatusChangeDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto?.Reason) || dto.Reason.Trim().Length < 10)
        {
            return BadRequest(new { message = "A mandatory suspension explanation of at least 10 characters is required." });
        }

        var adminUserId = GetCurrentAdminUserId();
        var result = await _adminService.SuspendUserAsync(userId, dto.Reason, dto.ConcurrencyVersion, adminUserId);
        return MapUserActionResult(result);
    }

    [HttpPut("users/{userId}/restore")]
    public async Task<IActionResult> RestoreUser(int userId, [FromBody] UserStatusChangeDto dto)
    {
        var adminUserId = GetCurrentAdminUserId();
        var result = await _adminService.RestoreUserAsync(userId, dto?.ConcurrencyVersion, adminUserId);
        return MapUserActionResult(result);
    }

    private IActionResult MapUserActionResult(UserActionResult<UserSummaryDto> result)
    {
        return result.Status switch
        {
            UserResultStatus.NotFound => NotFound(new { message = result.Message }),
            UserResultStatus.Conflict => Conflict(new { message = result.Message, user = result.Data }),
            UserResultStatus.Invalid => BadRequest(new { message = result.Message }),
            UserResultStatus.Success => Ok(new 
            { 
                message = result.Message, 
                user = result.Data 
            }),
            _ => BadRequest(new { message = result.Message })
        };
    }

    // ==========================================
    // Phase 3 Task 3.3.2 — Job Management Endpoints
    // ==========================================

    [HttpGet("jobs")]
    public async Task<IActionResult> GetJobs(
        [FromQuery] string? status,
        [FromQuery] string? jobType,
        [FromQuery] bool? isEmergency,
        [FromQuery] string? search,
        [FromQuery] int? customerId,
        [FromQuery] int? electricianId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await _adminService.GetJobsAsync(status, jobType, isEmergency, search, customerId, electricianId, page, pageSize);
        return Ok(result);
    }

    [HttpGet("jobs/operational-summary")]
    public async Task<IActionResult> GetJobOperationalSummary()
    {
        var summary = await _adminService.GetJobOperationalSummaryAsync();
        return Ok(summary);
    }

    [HttpGet("jobs/{jobId}")]
    public async Task<IActionResult> GetJobDetail(int jobId)
    {
        var job = await _adminService.GetJobDetailAsync(jobId);
        if (job == null)
        {
            return NotFound(new { message = $"Job #{jobId} was not found." });
        }
        return Ok(job);
    }

    [HttpGet("jobs/{jobId}/eligible-electricians")]
    public async Task<IActionResult> GetEligibleElectricians(int jobId)
    {
        var job = await _adminService.GetJobDetailAsync(jobId);
        if (job == null)
        {
            return NotFound(new { message = $"Job #{jobId} was not found." });
        }

        var eligible = await _adminService.GetEligibleElectriciansAsync(jobId);
        return Ok(eligible);
    }

    [HttpPut("jobs/{jobId}/assign")]
    public async Task<IActionResult> AssignJob(int jobId, [FromBody] AdminAssignJobDto dto)
    {
        var adminUserId = GetCurrentAdminUserId();
        var result = await _adminService.AssignJobAsync(jobId, dto, adminUserId);
        return MapJobActionResult(result);
    }

    [HttpPut("jobs/{jobId}/reassign")]
    public async Task<IActionResult> ReassignJob(int jobId, [FromBody] AdminReassignJobDto dto)
    {
        var adminUserId = GetCurrentAdminUserId();
        var result = await _adminService.ReassignJobAsync(jobId, dto, adminUserId);
        return MapJobActionResult(result);
    }

    [HttpPut("jobs/{jobId}/cancel")]
    public async Task<IActionResult> CancelJob(int jobId, [FromBody] AdminCancelJobDto dto)
    {
        var adminUserId = GetCurrentAdminUserId();
        var result = await _adminService.CancelJobAsync(jobId, dto, adminUserId);
        return MapJobActionResult(result);
    }

    [HttpPut("jobs/{jobId}/resolve-dispute")]
    public async Task<IActionResult> ResolveDispute(int jobId, [FromBody] AdminResolveDisputeDto dto)
    {
        var adminUserId = GetCurrentAdminUserId();
        var result = await _adminService.ResolveDisputeAsync(jobId, dto, adminUserId);
        return MapJobActionResult(result);
    }

    private IActionResult MapJobActionResult<T>(JobActionResult<T> result)
    {
        return result.Status switch
        {
            JobActionStatus.NotFound => NotFound(new { message = result.Message }),
            JobActionStatus.Conflict => Conflict(new { message = result.Message, data = result.Data }),
            JobActionStatus.Invalid => BadRequest(new { message = result.Message }),
            JobActionStatus.Success => Ok(new { message = result.Message, data = result.Data }),
            _ => BadRequest(new { message = result.Message })
        };
    }
}
