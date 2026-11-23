
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

    public JobController(IJobService jobService)
    {
        _jobService = jobService;
    }

    [Authorize(Roles = "Customer")]
    [HttpPost("create")]
    public async Task<IActionResult> CreateJob(
        [FromBody] CreateJobDto request)
    {
        try
        {
            var userIdClaim = User.FindFirstValue(
                ClaimTypes.NameIdentifier);

            if (!int.TryParse(userIdClaim, out int customerId))
                return Unauthorized(new { message = "Invalid user token." });

            // Get customer ID from JWT, not from the request body.
            request.CustomerId = customerId;

            var job = await _jobService.CreateJobAsync(request);

            return Ok(new
            {
                message = "Job created successfully.",
                job
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{jobId:int}/matching-electricians")]
    public async Task<IActionResult> GetMatchingElectricians(int jobId)
    {
        try
        {
            var electricians =
                await _jobService.FindMatchingElectriciansForJobAsync(jobId);

            return Ok(new
            {
                jobId,
                count = electricians.Count,
                electricians
            });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("nearby")]
    public IActionResult GetNearbyJobs(
        [FromQuery] double lat,
        [FromQuery] double lng)
    {
        return Ok(new
        {
            message = "Nearby job listing is not implemented yet."
        });
    }
}
