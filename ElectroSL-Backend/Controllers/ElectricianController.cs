using System.Threading.Tasks;
using ElectroSL_Backend.Data;
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
            isOnline = profile.IsOnline
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

    [HttpPost("{id}/documents")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadDocuments(
        int id,
        [FromForm] IFormFile? nicDocument,
        [FromForm] IFormFile? nvqCertificate)
    {
        var profile = await _context.ElectricianProfiles
            .FirstOrDefaultAsync(p => p.UserId == id || p.ProfileId == id);

        if (profile == null)
        {
            return NotFound(new { message = $"Electrician profile not found for ID {id}." });
        }

        if (nicDocument == null && nvqCertificate == null)
        {
            return BadRequest(new { message = "At least one document (NIC or NVQ certificate) must be provided." });
        }

        try
        {
            if (nicDocument != null && nicDocument.Length > 0)
            {
                var nicFileName = await _documentStorageService.SaveDocumentAsync(nicDocument, "nic");
                profile.NicDocumentUrl = nicFileName;
            }

            if (nvqCertificate != null && nvqCertificate.Length > 0)
            {
                var nvqFileName = await _documentStorageService.SaveDocumentAsync(nvqCertificate, "nvq");
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
}