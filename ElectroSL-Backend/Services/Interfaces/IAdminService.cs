using ElectroSL_Backend.DTOs.Admin;

namespace ElectroSL_Backend.Services.Interfaces;

public interface IAdminService
{
    // Technician Application Management
    Task<List<ApplicationListItemDto>> GetApplicationsByStatusAsync(string status);
    Task<ApplicationDetailDto?> GetApplicationDetailAsync(int profileId);
    Task<ReviewActionResult> ApproveApplicationAsync(int profileId, int adminUserId);
    Task<ReviewActionResult> ApproveApplicationWithOverrideAsync(int profileId, string overrideReason, int adminUserId);
    Task<ReviewActionResult> RejectApplicationAsync(int profileId, string reason, int adminUserId);
    Task<ReviewActionResult> RevokeApplicationAsync(int profileId, string reason, int adminUserId);
    Task<List<TechnicianAuditLogDto>> GetApplicationAuditLogsAsync(int profileId);

    // Equipment Price Catalog
    Task<List<CatalogItemDto>> GetAllCatalogItemsAsync(string? category, string? search, bool? isActive = null);
    Task<CatalogItemDto?> GetCatalogItemAsync(int itemId);
    Task<CatalogActionResult<CatalogItemDto>> CreateCatalogItemAsync(CreateCatalogItemDto dto);
    Task<CatalogActionResult<CatalogItemDto>> UpdateCatalogItemAsync(int itemId, UpdateCatalogItemDto dto, int adminUserId);
    Task<CatalogActionResult<bool>> DeactivateCatalogItemAsync(int itemId, int? expectedVersion, int adminUserId);
    Task<CatalogActionResult<bool>> ActivateCatalogItemAsync(int itemId, int? expectedVersion, int adminUserId);
    Task<List<EquipmentPriceHistoryDto>> GetCatalogItemPriceHistoryAsync(int itemId);

    // Flagged Equipment Price Claims Review
    Task<List<FlaggedClaimItemDto>> GetEquipmentClaimsAsync(string? status, string? search, string? category);
    Task<FlaggedClaimItemDto?> GetEquipmentClaimDetailAsync(int claimId);
    Task<ClaimReviewActionResult> ApproveEquipmentClaimAsync(int claimId, string? reviewNotes, int adminUserId);
    Task<ClaimReviewActionResult> RejectEquipmentClaimAsync(int claimId, string rejectionReason, int adminUserId);

    // Dashboard
    Task<AdminDashboardStatsDto> GetDashboardStatsAsync();

    // User Management (Phase 3)
    Task<List<UserSummaryDto>> GetUsersAsync(string? role, string? search, string? status);
    Task<UserDetailDto?> GetUserDetailAsync(int userId);
    Task<UserActionResult<UserSummaryDto>> ActivateUserAsync(int userId, int? expectedVersion, int adminUserId);
    Task<UserActionResult<UserSummaryDto>> DeactivateUserAsync(int userId, int? expectedVersion, int adminUserId);
    Task<UserActionResult<UserSummaryDto>> SuspendUserAsync(int userId, string reason, int? expectedVersion, int adminUserId);
    Task<UserActionResult<UserSummaryDto>> RestoreUserAsync(int userId, int? expectedVersion, int adminUserId);

    // Job Operations & Dispatch Management (Phase 3 Task 3.3.2)
    Task<AdminJobListResponseDto> GetJobsAsync(
        string? status, 
        string? jobType, 
        bool? isEmergency, 
        string? search, 
        int? customerId, 
        int? electricianId, 
        int page = 1, 
        int pageSize = 10);

    Task<AdminJobDetailDto?> GetJobDetailAsync(int jobId);

    Task<List<EligibleElectricianDto>> GetEligibleElectriciansAsync(int jobId);

    Task<JobOperationalSummaryDto> GetJobOperationalSummaryAsync();

    // Job Operations Mutations (Phase 3 Task 3.3.3)
    Task<JobActionResult<AdminJobDetailDto>> AssignJobAsync(int jobId, AdminAssignJobDto dto, int adminUserId);
    Task<JobActionResult<AdminJobDetailDto>> ReassignJobAsync(int jobId, AdminReassignJobDto dto, int adminUserId);
    Task<JobActionResult<AdminJobDetailDto>> CancelJobAsync(int jobId, AdminCancelJobDto dto, int adminUserId);
    Task<JobActionResult<AdminJobDetailDto>> ResolveDisputeAsync(int jobId, AdminResolveDisputeDto dto, int adminUserId);
}
