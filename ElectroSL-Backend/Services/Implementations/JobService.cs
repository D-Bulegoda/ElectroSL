using ElectroSL_Backend.DTOs.Job;
using ElectroSL_Backend.Models;
using ElectroSL_Backend.Services.Interfaces;

namespace ElectroSL_Backend.Services.Implementations;

public class JobService : IJobService
{
    public async Task<Job> CreateJobAsync(CreateJobDto jobDto)
    {
        return await Task.FromResult(new Job { JobType = jobDto.JobType });
    }

    public async Task<bool> ApproveEquipmentListAsync(int jobId, EquipmentListDto equipment)
    {
        // Placeholder: Logic to verify ±5% variance against EquipmentCatalog
        return await Task.FromResult(true);
    }
}