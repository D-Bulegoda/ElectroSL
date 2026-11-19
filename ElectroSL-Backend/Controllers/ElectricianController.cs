using System.Threading.Tasks;
using ElectroSL_Backend.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ElectroSL_Backend.Controllers;

[Route("api/[controller]")]
[Route("api/ElectricianProfile")]
[ApiController]
public class ElectricianController : ControllerBase
{
    private readonly ElectroSLDbContext _context;

    public ElectricianController(ElectroSLDbContext context)
    {
        _context = context;
    }

    [HttpGet("status/{id}")]
    public async Task<IActionResult> GetStatus(int id)
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

    [HttpPost("{id}/toggle-status")]
    public IActionResult ToggleOnlineStatus(int id, [FromBody] bool isOnline)
    {
        return Ok(new { message = $"Electrician {id} is now {(isOnline ? "Online" : "Offline")}" });
    }
}