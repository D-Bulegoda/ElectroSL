using System.Security.Claims;
using ElectroSL_Backend.Data;
using ElectroSL_Backend.DTOs.Job;
using ElectroSL_Backend.Models;
using ElectroSL_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ElectroSL_Backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class JobController : ControllerBase
{
    private readonly IJobService _jobService;
    private readonly IDocumentStorageService _documentStorageService;
    private readonly ElectroSLDbContext _context;

    public JobController(
        IJobService jobService,
        IDocumentStorageService documentStorageService,
        ElectroSLDbContext context)
    {
        _jobService = jobService;
        _documentStorageService = documentStorageService;
        _context = context;
    }

    // 1. Customer creates a new job (direct open dispatch, no bidding)
    [Authorize(Roles = "Customer")]
    [HttpPost("create")]
    public async Task<IActionResult> CreateJob([FromBody] CreateJobDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var tokenUserId = GetCurrentUserId();
        var customerId = tokenUserId > 0 ? tokenUserId : request.CustomerId;

        if (customerId <= 0)
        {
            return Unauthorized(new { message = "Valid customer authentication is required." });
        }

        var job = new Job
        {
            CustomerId = customerId,
            JobType = string.IsNullOrWhiteSpace(request.JobType) ? "Maintenance" : request.JobType,
            Description = request.Description,
            LocationLat = request.LocationLat,
            LocationLng = request.LocationLng,
            IsEmergency = request.IsEmergency,
            Status = "Open",
            CreatedAt = DateTime.UtcNow
        };

        _context.Jobs.Add(job);
        await _context.SaveChangesAsync();

        return StatusCode(201, new
        {
            message = "Job created and dispatched to nearby electricians.",
            jobId = job.JobId,
            job
        });
    }

    // 2. Electricians view all open jobs (or filter within 10 km when lat/lng are provided)
    [Authorize(Roles = "Electrician")]
    [HttpGet("open")]
    [HttpGet("nearby")]
    public async Task<IActionResult> GetNearbyOrOpenJobs(
        [FromQuery] double? lat,
        [FromQuery] double? lng,
        [FromQuery] double radiusKm = 10.0)
    {
        var openJobs = await _context.Jobs
            .Where(j => j.Status == "Open" || j.Status == "Pending")
            .OrderByDescending(j => j.IsEmergency)
            .ThenByDescending(j => j.CreatedAt)
            .ToListAsync();

        if (lat.HasValue && lng.HasValue && (lat.Value != 0 || lng.Value != 0))
        {
            var nearby = openJobs
                .Select(j => new
                {
                    job = j,
                    distanceKm = Math.Round(CalculateDistanceKm(lat.Value, lng.Value, j.LocationLat, j.LocationLng), 2)
                })
                .Where(x => x.distanceKm <= radiusKm)
                .OrderByDescending(x => x.job.IsEmergency)
                .ThenBy(x => x.distanceKm)
                .Select(x => new
                {
                    x.job.JobId,
                    x.job.CustomerId,
                    x.job.JobType,
                    x.job.Description,
                    x.job.LocationLat,
                    x.job.LocationLng,
                    x.job.IsEmergency,
                    x.job.Status,
                    x.job.CreatedAt,
                    x.distanceKm
                })
                .ToList();

            return Ok(nearby);
        }

        return Ok(openJobs);
    }

    // 3. Electrician directly accepts an open job (first-come, first-served lock)
    [Authorize(Roles = "Electrician")]
    [HttpPost("{jobId}/accept")]
    public async Task<IActionResult> AcceptJob(int jobId, [FromBody] AcceptJobDto? dto = null)
    {
        var tokenUserId = GetCurrentUserId();
        var electricianId = tokenUserId > 0 ? tokenUserId : (dto?.ElectricianId ?? 0);

        if (electricianId <= 0)
        {
            return Unauthorized(new { message = "Valid electrician authentication is required." });
        }

        var job = await _context.Jobs.FindAsync(jobId);
        if (job == null)
        {
            return NotFound(new { message = "Job not found." });
        }

        if (job.Status != "Open" && job.Status != "Pending")
        {
            return Conflict(new { message = "This job has already been accepted by another electrician." });
        }

        job.ElectricianId = electricianId;
        job.Status = "Accepted";
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Job accepted successfully. Proceed to job location.",
            jobId = job.JobId,
            job
        });
    }

    // 4. Live job status & details (for Customer LiveJobTracking & Electrician ActiveJobExecution)
    [Authorize]
    [HttpGet("{jobId}")]
    public async Task<IActionResult> GetJobById(int jobId)
    {
        var job = await _context.Jobs
            .Where(j => j.JobId == jobId)
            .Select(j => new
            {
                j.JobId,
                j.CustomerId,
                j.ElectricianId,
                j.JobType,
                j.Description,
                j.LocationLat,
                j.LocationLng,
                j.IsEmergency,
                j.Status,
                j.CreatedAt,
                CustomerName = _context.Users
                    .Where(u => u.UserId == j.CustomerId)
                    .Select(u => u.Name)
                    .FirstOrDefault(),
                ElectricianName = j.ElectricianId.HasValue
                    ? _context.Users
                        .Where(u => u.UserId == j.ElectricianId.Value)
                        .Select(u => u.Name)
                        .FirstOrDefault()
                    : null
            })
            .FirstOrDefaultAsync();

        if (job == null)
        {
            return NotFound(new { message = "Job not found." });
        }

        return Ok(job);
    }

    // 5. Fetch jobs belonging to the logged-in Customer or Electrician
    [Authorize]
    [HttpGet("my-jobs")]
    public async Task<IActionResult> GetMyJobs([FromQuery] int? customerId = null)
    {
        var tokenUserId = GetCurrentUserId();
        var role = GetCurrentUserRole();
        var resolvedUserId = tokenUserId > 0 ? tokenUserId : (customerId ?? 0);

        if (resolvedUserId <= 0)
        {
            return Unauthorized(new { message = "Invalid user session." });
        }

        var query = _context.Jobs.AsQueryable();

        if (role == "Electrician")
        {
            query = query.Where(j => j.ElectricianId == resolvedUserId);
        }
        else if (role == "Customer" || customerId.HasValue)
        {
            query = query.Where(j => j.CustomerId == resolvedUserId);
        }
        else
        {
            query = query.Where(j => j.CustomerId == resolvedUserId || j.ElectricianId == resolvedUserId);
        }

        var jobs = await query
            .OrderByDescending(j => j.CreatedAt)
            .Select(j => new
            {
                j.JobId,
                j.CustomerId,
                j.ElectricianId,
                j.JobType,
                j.Description,
                Title = j.IsEmergency ? $"🚨 {j.JobType} (Emergency)" : j.JobType,
                Category = j.JobType,
                Address = !string.IsNullOrWhiteSpace(j.Description)
                    ? j.Description
                    : $"GPS ({j.LocationLat:F4}, {j.LocationLng:F4})",
                j.LocationLat,
                j.LocationLng,
                j.IsEmergency,
                j.Status,
                j.CreatedAt,
                CustomerName = _context.Users
                    .Where(u => u.UserId == j.CustomerId)
                    .Select(u => u.Name)
                    .FirstOrDefault(),
                ElectricianName = j.ElectricianId.HasValue
                    ? _context.Users
                        .Where(u => u.UserId == j.ElectricianId.Value)
                        .Select(u => u.Name)
                        .FirstOrDefault()
                    : null
            })
            .ToListAsync();

        return Ok(jobs);
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
            ?? User.FindFirst("sub")?.Value
            ?? User.FindFirst("userId")?.Value;
        return int.TryParse(idClaim, out int userId) ? userId : 0;
    }

    private string GetCurrentUserRole()
    {
        return User.FindFirst(ClaimTypes.Role)?.Value
            ?? User.FindFirst("role")?.Value
            ?? string.Empty;
    }

    private static double CalculateDistanceKm(double lat1, double lng1, double lat2, double lng2)
    {
        const double EarthRadiusKm = 6371.0;
        var dLat = (lat2 - lat1) * Math.PI / 180.0;
        var dLng = (lng2 - lng1) * Math.PI / 180.0;

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(lat1 * Math.PI / 180.0) * Math.Cos(lat2 * Math.PI / 180.0) *
                Math.Sin(dLng / 2) * Math.Sin(dLng / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return EarthRadiusKm * c;
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