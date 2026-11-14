using ElectroSL_Backend.DTOs.Admin;

namespace ElectroSL_Backend.Services.Interfaces;

public interface IAdminService
{
    // Technician Application Management
    Task<List<ApplicationListItemDto>> GetApplicationsByStatusAsync(string status);
    Task<ApplicationDetailDto?> GetApplicationDetailAsync(int profileId);
    Task<bool> ApproveApplicationAsync(int profileId, int adminUserId);
    Task<bool> RejectApplicationAsync(int profileId, string reason, int adminUserId);

    // Equipment Price Catalog
    Task<List<CatalogItemDto>> GetAllCatalogItemsAsync(string? category, string? search);
    Task<CatalogItemDto?> GetCatalogItemAsync(int itemId);
    Task<CatalogItemDto> CreateCatalogItemAsync(CreateCatalogItemDto dto);
    Task<bool> UpdateCatalogItemAsync(int itemId, UpdateCatalogItemDto dto);
    Task<bool> DeleteCatalogItemAsync(int itemId);

    // Dashboard
    Task<AdminDashboardStatsDto> GetDashboardStatsAsync();
}
