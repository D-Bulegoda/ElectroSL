
using ElectroSL_Backend.Data;
using ElectroSL_Backend.DTOs.Job;
using ElectroSL_Backend.Models;
using ElectroSL_Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ElectroSL_Backend.Services.Implementations;

public class JobService : IJobService
{
    private readonly ElectroSLDbContext _context;
    private readonly IMatchingService _matchingService;

    public JobService(
        ElectroSLDbContext context,
        IMatchingService matchingService)
    {
        _context = context;
        _matchingService = matchingService;
    }

    public async Task<Job> CreateJobAsync(CreateJobDto jobDto)
    {
        if (jobDto == null)
            throw new ArgumentNullException(nameof(jobDto));

        if (jobDto.CustomerId <= 0)
            throw new ArgumentException("Invalid customer ID.");

        if (string.IsNullOrWhiteSpace(jobDto.Description))
            throw new ArgumentException("Job description is required.");

        if (jobDto.LocationLat < -90 || jobDto.LocationLat > 90)
            throw new ArgumentException("Invalid latitude.");

        if (jobDto.LocationLng < -180 || jobDto.LocationLng > 180)
            throw new ArgumentException("Invalid longitude.");

        var jobType = jobDto.JobType.Trim();

        if (!jobType.Equals("Maintenance", StringComparison.OrdinalIgnoreCase) &&
            !jobType.Equals("NewConstruction", StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException("Invalid job type.");
        }

        var customerExists = await _context.Users
            .AnyAsync(u =>
                u.UserId == jobDto.CustomerId &&
                u.Role == "Customer");

        if (!customerExists)
            throw new InvalidOperationException("Customer not found.");

        var job = new Job
        {
            CustomerId = jobDto.CustomerId,

            JobType = jobType.Equals(
                "Maintenance",
                StringComparison.OrdinalIgnoreCase)
                    ? "Maintenance"
                    : "NewConstruction",

            Description = jobDto.Description.Trim(),
            LocationLat = jobDto.LocationLat,
            LocationLng = jobDto.LocationLng,
            IsEmergency = jobDto.IsEmergency,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };

        _context.Jobs.Add(job);
        await _context.SaveChangesAsync();

        return job;
    }

    public Task<bool> ApproveEquipmentListAsync(
        int jobId,
        EquipmentListDto equipment)
    {
        // Equipment approval logic will be implemented separately.
        return Task.FromResult(true);
    }

    public async Task<List<ElectricianProfile>>
        FindMatchingElectriciansForJobAsync(int jobId)
    {
        var job = await _context.Jobs
            .FirstOrDefaultAsync(j => j.JobId == jobId);

        if (job == null)
            throw new KeyNotFoundException("Job not found.");

        if (job.JobType.Equals(
            "Maintenance",
            StringComparison.OrdinalIgnoreCase))
        {
            // Find approved, online electricians within 10 km.
            return await _matchingService.FindNearbyElectriciansAsync(
                job.LocationLat,
                job.LocationLng,
                10.0);
        }

        if (job.JobType.Equals(
            "NewConstruction",
            StringComparison.OrdinalIgnoreCase))
        {
            // Find all admin-approved electricians island-wide.
            return await _matchingService.FindApprovedElectriciansIslandWideAsync();
        }

        throw new InvalidOperationException(
            "Unsupported job type.");
    }
}
