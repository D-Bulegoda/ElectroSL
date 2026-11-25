using System.Security.Claims;
using System.Threading.Tasks;
using ElectroSL_Backend.Data;
using ElectroSL_Backend.DTOs.Electrician;
using ElectroSL_Backend.Models;
using ElectroSL_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ElectroSL_Backend.Controllers;

[Route("api/[controller]")]
[Route("api/ElectricianProfile")]
[ApiController]
public class ElectricianController : ControllerBase
{
    private readonly ElectroSLDbContext _context;
    private readonly IDocumentStorageService _documentStorageService;

    public ElectricianController(ElectroSLDbContext context, IDocumentStorageService documentStorageService)
    {
        _context = context;
        _documentStorageService = documentStorageService;
    }

    [HttpGet("{id}/status")]
    public async Task<IActionResult> GetStatus(int id)
    {
        var profile = await _context.ElectricianProfiles
            .FirstOrDefaultAsync(p => p.UserId == id || p.ProfileId == id);

        if (profile == null)
        {
            return NotFound(new { message = $"Electrician profile not found for ID {id}." });
        }

        var latestSimulatorResult = await _context.SimulatorResults
            .Where(s => s.ElectricianId == profile.UserId)
            .OrderByDescending(s => s.AttemptDate)
            .FirstOrDefaultAsync();

        return Ok(new
        {
            profileId = profile.ProfileId,
            userId = profile.UserId,
            specialization = profile.Specialization,
            verificationStatus = profile.VerificationStatus,
            isApproved = profile.IsApprovedByAdmin,
            rejectionReason = profile.RejectionReason,
            hasNic = !string.IsNullOrWhiteSpace(profile.NicDocumentUrl) && _documentStorageService.DocumentExists(profile.NicDocumentUrl),
            hasNvq = !string.IsNullOrWhiteSpace(profile.NvqCertificateUrl) && _documentStorageService.DocumentExists(profile.NvqCertificateUrl),
            simulatorPassed = latestSimulatorResult?.IsPassed ?? false,
            simulatorScore = latestSimulatorResult?.TotalScore ?? 0,
            isOnline = profile.IsOnline,
            currentLat = profile.CurrentLat,
            currentLng = profile.CurrentLng,
            technicalSkillRating = profile.TechnicalSkillRating,
            technicalSkillAssessmentNote = profile.TechnicalSkillAssessmentNote,
            technicalSkillRatedAt = profile.TechnicalSkillRatedAtUtc
        });
    }

    [HttpGet("{id}/public-profile")]
    public async Task<IActionResult> GetPublicProfile(int id)
    {
        var profile = await _context.ElectricianProfiles
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.UserId == id || p.ProfileId == id);

        if (profile == null)
        {
            return NotFound(new { message = $"Electrician profile not found for ID {id}." });
        }

        var completedJobsCount = await _context.Jobs
            .CountAsync(j => j.ElectricianId == profile.UserId && j.Status == "Completed");

        var reviews = await _context.Reviews
            .Where(r => r.ElectricianId == profile.UserId)
            .ToListAsync();

        double averageCustomerRating = reviews.Any() ? Math.Round(reviews.Average(r => (double)r.Rating), 1) : 0.0;

        return Ok(new
        {
            profileId = profile.ProfileId,
            userId = profile.UserId,
            name = profile.User?.Name ?? "Technician",
            email = profile.User?.Email ?? string.Empty,
            phone = profile.User?.Phone ?? string.Empty,
            specialization = profile.Specialization,
            verificationStatus = profile.VerificationStatus,
            isApproved = profile.IsApprovedByAdmin,
            isOnline = profile.IsOnline,
            currentLat = profile.CurrentLat,
            currentLng = profile.CurrentLng,
            // Admin Technical Skill Level (1-5, or null if not yet assessed)
            technicalSkillRating = profile.TechnicalSkillRating,
            technicalSkillAssessmentNote = profile.TechnicalSkillAssessmentNote,
            technicalSkillRatedAt = profile.TechnicalSkillRatedAtUtc,
            // Separate customer ratings
            averageCustomerRating = averageCustomerRating,
            customerReviewsCount = reviews.Count,
            completedJobsCount = completedJobsCount
        });
    }

    [HttpGet("status/{id}")]
    public async Task<IActionResult> GetCertificateStatus(int id)
    {
        var profile = await _context.ElectricianProfiles
            .FirstOrDefaultAsync(p => p.UserId == id || p.ProfileId == id);

        if (profile == null)
        {
            return Ok(new
            {
                hasUploadedCertificates = false,
                verificationStatus = "None"
            });
        }

        return Ok(new
        {
            hasUploadedCertificates = !string.IsNullOrWhiteSpace(profile.NvqCertificateUrl) && !string.IsNullOrWhiteSpace(profile.NicDocumentUrl),
            verificationStatus = profile.VerificationStatus
        });
    }

    // Update electrician's live GPS location (used on signup, login, and manual refresh)
    [HttpPut("location")]
    [HttpPut("{id}/location")]
    public async Task<IActionResult> UpdateCurrentLocation(int? id, [FromBody] UpdateLocationDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var tokenUserId = GetCurrentUserId();
        var targetId = id ?? (dto.UserId > 0 ? dto.UserId : tokenUserId);

        if (targetId <= 0)
        {
            return BadRequest(new { message = "A valid electrician userId or profileId is required." });
        }

        var profile = await _context.ElectricianProfiles
            .FirstOrDefaultAsync(p => p.UserId == targetId || p.ProfileId == targetId);

        if (profile == null)
        {
            return NotFound(new { message = $"Electrician profile not found for ID {targetId}." });
        }

        profile.CurrentLat = dto.Lat;
        profile.CurrentLng = dto.Lng;
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Current location updated successfully.",
            userId = profile.UserId,
            profileId = profile.ProfileId,
            lat = profile.CurrentLat,
            lng = profile.CurrentLng
        });
    }

    [HttpPost("{id}/documents")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadDocuments(
        int id,
        [FromForm] UploadDocumentsFormDto dto)
    {
        var profile = await _context.ElectricianProfiles
            .FirstOrDefaultAsync(p => p.UserId == id || p.ProfileId == id);

        if (profile == null)
        {
            return NotFound(new { message = $"Electrician profile not found for ID {id}." });
        }

        if (dto?.NicDocument == null && dto?.NvqCertificate == null)
        {
            return BadRequest(new { message = "At least one document (NIC or NVQ certificate) must be provided." });
        }

        try
        {
            if (dto.NicDocument != null && dto.NicDocument.Length > 0)
            {
                var nicFileName = await _documentStorageService.SaveDocumentAsync(dto.NicDocument, "nic");
                profile.NicDocumentUrl = nicFileName;
            }

            if (dto.NvqCertificate != null && dto.NvqCertificate.Length > 0)
            {
                var nvqFileName = await _documentStorageService.SaveDocumentAsync(dto.NvqCertificate, "nvq");
                profile.NvqCertificateUrl = nvqFileName;
            }

            if (profile.VerificationStatus == "Rejected")
            {
                profile.VerificationStatus = "Pending";
                profile.RejectionReason = null;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Documents uploaded and secured successfully.",
                nicUploaded = !string.IsNullOrWhiteSpace(profile.NicDocumentUrl),
                nvqUploaded = !string.IsNullOrWhiteSpace(profile.NvqCertificateUrl),
                verificationStatus = profile.VerificationStatus
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Failed to upload documents: {ex.Message}" });
        }
    }

    [HttpPost("{id}/toggle-status")]
    public async Task<IActionResult> ToggleOnlineStatus(int id, [FromBody] bool isOnline)
    {
        var profile = await _context.ElectricianProfiles
            .FirstOrDefaultAsync(p => p.UserId == id || p.ProfileId == id);

        if (profile == null)
        {
            return NotFound(new { message = $"Electrician profile not found for ID {id}." });
        }

        if (isOnline && (profile.VerificationStatus != "Approved" || !profile.IsApprovedByAdmin))
        {
            return BadRequest(new
            {
                message = profile.VerificationStatus == "Revoked"
                    ? "Cannot go online: Your electrician accreditation has been revoked. Revoked technicians cannot become active or receive job assignments."
                    : "Cannot go online: Only accredited and approved electricians can become active and receive job assignments.",
                verificationStatus = profile.VerificationStatus,
                isApproved = profile.IsApprovedByAdmin
            });
        }

        var electricianUser = await _context.Users.FirstOrDefaultAsync(u => u.UserId == profile.UserId);
        if (isOnline && (electricianUser == null || !electricianUser.IsActive || electricianUser.AccountStatus != "Active"))
        {
            return BadRequest(new
            {
                message = $"Cannot go online: Your account is {electricianUser?.AccountStatus?.ToLowerInvariant() ?? "inactive"}. Inactive or suspended technicians cannot become active or receive job assignments.",
                accountStatus = electricianUser?.AccountStatus ?? "Inactive"
            });
        }

        profile.IsOnline = isOnline;
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = $"Electrician {id} is now {(isOnline ? "Online" : "Offline")}",
            isOnline = profile.IsOnline,
            verificationStatus = profile.VerificationStatus
        });
    }

    [HttpGet("{id}/wallet")]
    public async Task<IActionResult> GetWallet(int id)
    {
        var profile = await _context.ElectricianProfiles
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.UserId == id || p.ProfileId == id);

        if (profile == null)
        {
            return NotFound(new { message = $"Electrician profile not found for ID {id}." });
        }

        var transactions = await _context.WalletTransactions
            .Where(wt => wt.ElectricianProfileId == profile.ProfileId)
            .OrderByDescending(wt => wt.CreatedAtUtc)
            .Take(50)
            .Select(wt => new
            {
                wt.TransactionId,
                wt.JobId,
                wt.Amount,
                wt.BalanceBefore,
                wt.BalanceAfter,
                wt.CommissionDebtBefore,
                wt.CommissionDebtAfter,
                wt.CommissionDebtRecovered,
                TransactionType = wt.TransactionType.ToString(),
                wt.Description,
                wt.CreatedAtUtc
            })
            .ToListAsync();

        decimal availablePayoutBalance = profile.OutstandingCommissionDebt > 0
            ? 0m
            : Math.Max(0m, profile.AppWalletBalance);

        return Ok(new
        {
            profileId = profile.ProfileId,
            userId = profile.UserId,
            technicianName = profile.User.Name,
            currentWalletBalance = profile.AppWalletBalance,
            outstandingCommissionDebt = profile.OutstandingCommissionDebt,
            availablePayoutBalance = availablePayoutBalance,
            isPayoutLocked = profile.OutstandingCommissionDebt > 0,
            transactions
        });
    }

    private int GetCurrentUserId()
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;
        return int.TryParse(idClaim, out int userId) ? userId : 0;
    }
}