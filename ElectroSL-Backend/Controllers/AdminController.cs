using System.Security.Claims;
using System.Text;
using ElectroSL_Backend.DTOs.Admin;
using ElectroSL_Backend.Services.Implementations;
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
    private readonly IAdminFinancialService _financialService;
    private readonly IAdminAuditService _auditService;

    public AdminController(
        IAdminService adminService, 
        IDocumentStorageService documentStorageService,
        IAdminFinancialService financialService,
        IAdminAuditService auditService)
    {
        _adminService = adminService;
        _documentStorageService = documentStorageService;
        _financialService = financialService;
        _auditService = auditService;
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
    public async Task<IActionResult> ApproveApplication(int profileId, [FromBody] ApproveTechnicianDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var adminUserId = GetCurrentAdminUserId();
        var result = await _adminService.ApproveApplicationAsync(profileId, adminUserId, dto.TechnicalSkillRating, dto.AssessmentNote);

        return result.Status switch
        {
            ReviewResultStatus.NotFound => NotFound(new { message = result.Message }),
            ReviewResultStatus.InvalidPrerequisites => BadRequest(new 
            { 
                message = result.Message, 
                canOverride = result.Message.Contains("simulator", StringComparison.OrdinalIgnoreCase) 
            }),
            ReviewResultStatus.Conflict => Conflict(new { message = result.Message, currentStatus = result.CurrentStatus }),
            ReviewResultStatus.Success => Ok(new { message = result.Message, profileId, status = result.CurrentStatus, technicalSkillRating = dto.TechnicalSkillRating }),
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
        var result = await _adminService.ApproveApplicationWithOverrideAsync(profileId, dto.Explanation, adminUserId, dto.TechnicalSkillRating, dto.AssessmentNote);

        return result.Status switch
        {
            ReviewResultStatus.NotFound => NotFound(new { message = result.Message }),
            ReviewResultStatus.InvalidPrerequisites => BadRequest(new { message = result.Message }),
            ReviewResultStatus.Conflict => Conflict(new { message = result.Message, currentStatus = result.CurrentStatus }),
            ReviewResultStatus.Success => Ok(new { message = result.Message, profileId, status = result.CurrentStatus, overrideRecorded = true, technicalSkillRating = dto.TechnicalSkillRating }),
            _ => BadRequest(new { message = result.Message })
        };
    }

    [HttpPut("applications/{profileId}/skill-rating")]
    public async Task<IActionResult> UpdateSkillRating(int profileId, [FromBody] UpdateTechnicalSkillRatingDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var adminUserId = GetCurrentAdminUserId();
        var result = await _adminService.UpdateTechnicalSkillRatingAsync(profileId, dto.TechnicalSkillRating, dto.AssessmentNote, adminUserId);

        return result.Status switch
        {
            ReviewResultStatus.NotFound => NotFound(new { message = result.Message }),
            ReviewResultStatus.InvalidPrerequisites => BadRequest(new { message = result.Message }),
            ReviewResultStatus.Conflict => Conflict(new { message = result.Message, currentStatus = result.CurrentStatus }),
            ReviewResultStatus.Success => Ok(new 
            { 
                message = result.Message, 
                profileId, 
                technicalSkillRating = dto.TechnicalSkillRating, 
                assessmentNote = dto.AssessmentNote,
                status = result.CurrentStatus 
            }),
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

    [HttpGet("dashboard-analytics")]
    public async Task<IActionResult> GetDashboardAnalytics([FromQuery] string? range = "30d", [FromQuery] DateTime? customFrom = null, [FromQuery] DateTime? customTo = null)
    {
        if (customFrom.HasValue && customTo.HasValue && customFrom.Value > customTo.Value)
        {
            return BadRequest(new { message = "Invalid date range: 'customFrom' cannot be later than 'customTo'." });
        }
        var analytics = await _adminService.GetDashboardAnalyticsAsync(range, customFrom, customTo);
        return Ok(analytics);
    }

    [HttpGet("advanced-analytics")]
    public async Task<IActionResult> GetAdvancedAnalytics([FromQuery] string? range = "30d", [FromQuery] DateTime? customFrom = null, [FromQuery] DateTime? customTo = null)
    {
        if (customFrom.HasValue && customTo.HasValue && customFrom.Value > customTo.Value)
        {
            return BadRequest(new { message = "Invalid date range: 'customFrom' cannot be later than 'customTo'." });
        }
        var bi = await _adminService.GetAdvancedAnalyticsAsync(range, customFrom, customTo);
        return Ok(bi);
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

        var adminUserId = GetCurrentAdminUserId();
        var result = await _adminService.CreateCatalogItemAsync(dto, adminUserId);
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

    [HttpPut("jobs/{jobId}/agreed-labour")]
    public async Task<IActionResult> SetAgreedLabourAmount(int jobId, [FromBody] SetAgreedLabourAmountDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var adminUserId = GetCurrentAdminUserId();
        var result = await _adminService.SetAgreedLabourAmountAsync(jobId, dto, adminUserId);
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

    // =========================================================================
    // Financial & Wallet Operations Management (Phase 3 Task 3.4.5)
    // =========================================================================

    [HttpGet("financial/summary")]
    public async Task<IActionResult> GetFinancialSummary()
    {
        var summary = await _financialService.GetFinancialSummaryAsync();
        return Ok(summary);
    }

    [HttpGet("financial/transactions")]
    public async Task<IActionResult> GetFinancialTransactions([FromQuery] FinancialLedgerFilterDto filter)
    {
        var result = await _financialService.GetTransactionsAsync(filter);
        return Ok(result);
    }

    [HttpGet("financial/technicians/{profileId}/wallet")]
    public async Task<IActionResult> GetTechnicianWallet(int profileId)
    {
        var detail = await _financialService.GetTechnicianWalletAsync(profileId);
        if (detail == null)
        {
            return NotFound(new { message = $"Technician profile #{profileId} was not found." });
        }
        return Ok(detail);
    }

    [HttpPost("financial/payouts")]
    public async Task<IActionResult> RecordPayout([FromBody] RecordPayoutRequestDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var adminUserId = GetCurrentAdminUserId();
        var result = await _financialService.RecordPayoutAsync(dto, adminUserId);

        if (!result.Success)
        {
            return BadRequest(new { message = result.Message });
        }

        return Ok(result);
    }

    [HttpPost("financial/payouts/{payoutId}/reverse")]
    public async Task<IActionResult> ReversePayout(int payoutId, [FromBody] ReversePayoutRequestDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var adminUserId = GetCurrentAdminUserId();
        var result = await _financialService.ReversePayoutAsync(payoutId, dto, adminUserId);

        if (!result.Success)
        {
            if (result.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(new { message = result.Message });
            }
            if (result.Message.Contains("already been reversed", StringComparison.OrdinalIgnoreCase))
            {
                return Conflict(new { message = result.Message });
            }
            return BadRequest(new { message = result.Message });
        }

        return Ok(result);
    }

    [HttpPost("financial/technicians/{profileId}/adjust")]
    public async Task<IActionResult> AdjustWallet(int profileId, [FromBody] WalletAdjustmentRequestDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var adminUserId = GetCurrentAdminUserId();
        var result = await _financialService.AdjustWalletAsync(profileId, dto, adminUserId);

        if (!result.Success)
        {
            if (result.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(new { message = result.Message });
            }
            return BadRequest(new { message = result.Message });
        }

        return Ok(result);
    }

    // =========================================================================
    // Unified Administrative Audit Logging (Task 3.5)
    // =========================================================================

    [HttpGet("audit-logs")]
    public async Task<IActionResult> GetAuditLogs([FromQuery] AdminAuditLogFilterDto filter)
    {
        var result = await _auditService.GetAuditLogsAsync(filter);
        return Ok(result);
    }

    [HttpGet("audit-logs/{id}")]
    public async Task<IActionResult> GetAuditLogDetail(long id)
    {
        var detail = await _auditService.GetAuditLogDetailAsync(id);
        if (detail == null)
        {
            return NotFound(new { message = $"Administrative audit log entry #{id} was not found." });
        }
        return Ok(detail);
    }

    // =========================================================================
    // Reporting & Data Export (Phase 4 Task 4.1)
    // =========================================================================

    [HttpGet("reports/export")]
    public async Task<IActionResult> ExportReport(
        [FromQuery] string reportType = "financial", 
        [FromQuery] string range = "30d",
        [FromQuery] string format = "csv",
        [FromQuery] DateTime? customFrom = null,
        [FromQuery] DateTime? customTo = null)
    {
        // 1. Format validation
        string fmt = string.IsNullOrWhiteSpace(format) ? "csv" : format.Trim().ToLowerInvariant();
        if (fmt != "csv" && fmt != "xlsx" && fmt != "pdf")
        {
            return BadRequest(new { message = $"Unsupported export format '{format}'. Supported formats: csv, xlsx, pdf." });
        }

        // 2. Report type validation
        string type = string.IsNullOrWhiteSpace(reportType) ? "financial" : reportType.Trim().ToLowerInvariant();
        if (type == "activity") type = "audits";
        if (type != "financial" && type != "jobs" && type != "technicians" && type != "equipment" && type != "audits")
        {
            return BadRequest(new { message = $"Unsupported report type '{reportType}'. Supported: financial, jobs, technicians, equipment, audits." });
        }

        // 3. Date range validation
        if (customFrom.HasValue && customTo.HasValue && customFrom.Value > customTo.Value)
        {
            return BadRequest(new { message = "Invalid date range: 'customFrom' cannot be later than 'customTo'." });
        }
        if (range.Equals("custom", StringComparison.OrdinalIgnoreCase) && !customFrom.HasValue && !customTo.HasValue)
        {
            return BadRequest(new { message = "Custom date range requires at least 'customFrom' or 'customTo'." });
        }

        string rangeLabel = ReportExportGenerator.GetRangeLabel(range, customFrom, customTo);
        string timestamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmss");
        string filename = $"ElectroSL_{type}_Report_{timestamp}.{fmt}";

        byte[] fileBytes;
        string contentType;

        switch (type)
        {
            case "financial":
            {
                var analytics = await _adminService.GetDashboardAnalyticsAsync(range, customFrom, customTo);
                fileBytes = fmt switch
                {
                    "xlsx" => ReportExportGenerator.GenerateFinancialXlsx(analytics, rangeLabel),
                    "pdf" => ReportExportGenerator.GenerateFinancialPdf(analytics, rangeLabel),
                    _ => ReportExportGenerator.GenerateFinancialCsv(analytics, rangeLabel)
                };
                break;
            }
            case "jobs":
            {
                var analytics = await _adminService.GetDashboardAnalyticsAsync(range, customFrom, customTo);
                fileBytes = fmt switch
                {
                    "xlsx" => ReportExportGenerator.GenerateJobsXlsx(analytics, rangeLabel),
                    "pdf" => ReportExportGenerator.GenerateJobsPdf(analytics, rangeLabel),
                    _ => ReportExportGenerator.GenerateJobsCsv(analytics, rangeLabel)
                };
                break;
            }
            case "technicians":
            {
                var analytics = await _adminService.GetDashboardAnalyticsAsync(range, customFrom, customTo);
                fileBytes = fmt switch
                {
                    "xlsx" => ReportExportGenerator.GenerateTechniciansXlsx(analytics, rangeLabel),
                    "pdf" => ReportExportGenerator.GenerateTechniciansPdf(analytics, rangeLabel),
                    _ => ReportExportGenerator.GenerateTechniciansCsv(analytics, rangeLabel)
                };
                break;
            }
            case "equipment":
            {
                var catalog = await _adminService.GetAllCatalogItemsAsync(null, null, null);
                var claims = await _adminService.GetEquipmentClaimsAsync(null, null, null);
                fileBytes = fmt switch
                {
                    "xlsx" => ReportExportGenerator.GenerateEquipmentXlsx(catalog, claims),
                    "pdf" => ReportExportGenerator.GenerateEquipmentPdf(catalog, claims),
                    _ => ReportExportGenerator.GenerateEquipmentCsv(catalog, claims)
                };
                break;
            }
            case "audits":
            {
                DateTime? startDate = customFrom;
                DateTime? endDate = customTo;
                if (!customFrom.HasValue && !customTo.HasValue && range != "all")
                {
                    var analytics = await _adminService.GetDashboardAnalyticsAsync(range);
                    startDate = analytics.FromDateUtc;
                    endDate = analytics.ToDateUtc;
                }

                var auditLogResult = await _auditService.GetAuditLogsAsync(new AdminAuditLogFilterDto 
                { 
                    Page = 1, 
                    PageSize = 200,
                    StartDateUtc = startDate,
                    EndDateUtc = endDate
                });

                fileBytes = fmt switch
                {
                    "xlsx" => ReportExportGenerator.GenerateAuditsXlsx(auditLogResult.Items, rangeLabel),
                    "pdf" => ReportExportGenerator.GenerateAuditsPdf(auditLogResult.Items, rangeLabel),
                    _ => ReportExportGenerator.GenerateAuditsCsv(auditLogResult.Items, rangeLabel)
                };
                break;
            }
            default:
                return BadRequest(new { message = $"Unsupported report type '{reportType}'." });
        }

        contentType = fmt switch
        {
            "xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "pdf" => "application/pdf",
            _ => "text/csv; charset=utf-8"
        };

        return File(fileBytes, contentType, filename);
    }
}
