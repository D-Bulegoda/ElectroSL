using Microsoft.AspNetCore.Mvc;

namespace ElectroSL_Backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class JobController : ControllerBase
{
    [HttpPost("create")]
    public IActionResult CreateJob([FromBody] DTOs.Job.CreateJobDto request)
    {
        return Ok(new { message = "Job created. 10km Dispatch logic runs here." });
    }

    [HttpGet("nearby")]
    public IActionResult GetNearbyJobs([FromQuery] double lat, [FromQuery] double lng)
    {
        // Haversine formula logic goes here to find jobs within 10km
        return Ok(new { message = "Returning jobs within 10km radius" });
    }
}