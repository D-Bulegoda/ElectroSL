using ElectroSL_Backend.DTOs.Job;
using ElectroSL_Backend.Models;

namespace ElectroSL_Backend.Services.Interfaces;

public interface IJobService
{
    Task<Job> CreateJobAsync(CreateJobDto jobDto);
    Task<bool> ApproveEquipmentListAsync(int jobId, EquipmentListDto equipment);
    Task<EquipmentClaimSubmissionResult> SubmitEquipmentClaimsAsync(int jobId, List<EquipmentItemDto> items, int electricianUserId);
    Task<EquipmentClaimSubmissionResult> SubmitSingleClaimWithReceiptAsync(int jobId, SubmitSingleClaimFormDto formDto, int electricianUserId);
    Task<EquipmentClaimQueryResult> GetJobEquipmentClaimsAsync(int jobId, int currentUserId, string userRole);
    Task<ReceiptAuthorizationResult> GetAuthorizedReceiptStreamAsync(string fileName, int currentUserId, string userRole);
}
