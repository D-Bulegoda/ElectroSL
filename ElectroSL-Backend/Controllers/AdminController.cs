using Microsoft.AspNetCore.Mvc;

namespace ElectroSL_Backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AdminController : ControllerBase
{
    [HttpPost("approve-technician/{profileId}")]
    public IActionResult ApproveTechnician(int profileId)
    {
        // Logic to verify NVQ certificate and Simulator score before setting IsApprovedByAdmin = true
        return Ok(new { message = $"Technician {profileId} has been approved." });
    }

    [HttpGet("dashboard-stats")]
    public IActionResult GetPlatformStats()
    {
        // Return total commissions, active jobs, and pending approvals
        return Ok(new 
        { 
            ActiveJobs = 12, 
            PendingApprovals = 5, 
            TotalCommissionCollected = 45000.00m 
        });
    }
}