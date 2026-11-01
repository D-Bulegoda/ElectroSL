using ElectroSL_Backend.DTOs.Job;
using ElectroSL_Backend.Models;

namespace ElectroSL_Backend.Services.Interfaces;

public interface IJobService
{
    Task<Job> CreateJobAsync(CreateJobDto jobDto);
    Task<bool> ApproveEquipmentListAsync(int jobId, EquipmentListDto equipment);
}