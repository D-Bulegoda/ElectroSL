using ElectroSL_Backend.Data;
using ElectroSL_Backend.DTOs.Admin;
using ElectroSL_Backend.Models;
using ElectroSL_Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ElectroSL_Backend.Services.Implementations;

public class AdminService : IAdminService
{
    private readonly ElectroSLDbContext _context;

    public AdminService(ElectroSLDbContext context)
    {
        _context = context;
    }

    public async Task<List<ApplicationListItemDto>> GetApplicationsByStatusAsync(string status)
    {
        var query = from profile in _context.ElectricianProfiles
                    join user in _context.Users on profile.UserId equals user.UserId
                    join sim in _context.SimulatorResults on profile.UserId equals sim.ElectricianId into simGroup
                    from simResult in simGroup.DefaultIfEmpty()
                    select new
                    {
                        profile,
                        user,
                        simResult
                    };

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(x => x.profile.VerificationStatus.ToLower() == status.ToLower());
        }

        var results = await query.ToListAsync();

        return results.Select(x => new ApplicationListItemDto
        {
            ProfileId = x.profile.ProfileId,
            UserId = x.user.UserId,
            Name = x.user.Name,
            Email = x.user.Email,
            Specialization = x.profile.Specialization,
            VerificationStatus = x.profile.VerificationStatus,
            NvqCertificateUrl = x.profile.NvqCertificateUrl,
            NicDocumentUrl = x.profile.NicDocumentUrl,
            SimulatorPassed = x.simResult != null && x.simResult.IsPassed,
            CreatedAt = x.user.CreatedAt
        }).ToList();
    }

    public async Task<ApplicationDetailDto?> GetApplicationDetailAsync(int profileId)
    {
        var profile = await _context.ElectricianProfiles
            .FirstOrDefaultAsync(p => p.ProfileId == profileId);

        if (profile == null) return null;

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.UserId == profile.UserId);

        if (user == null) return null;

        var simResult = await _context.SimulatorResults
            .OrderByDescending(s => s.CompletedAtUtc)
            .FirstOrDefaultAsync(s => s.ElectricianId == profile.UserId);

        return new ApplicationDetailDto
        {
            ProfileId = profile.ProfileId,
            UserId = user.UserId,
            Name = user.Name,
            Email = user.Email,
            Specialization = profile.Specialization,
            VerificationStatus = profile.VerificationStatus,
            NvqCertificateUrl = profile.NvqCertificateUrl,
            NicDocumentUrl = profile.NicDocumentUrl,
            CreatedAt = user.CreatedAt,

            SimulatorPassed = simResult?.IsPassed ?? false,
            // Cast to int if your DTO expects an integer, since Score is a decimal in the DB
            SimulatorScore = simResult != null ? (int)simResult.Score : 0, 
            SimulatorTimeTaken = simResult?.TimeTakenSeconds ?? 0,
            SafetyMistakesCount = simResult?.SafetyMistakesCount ?? 0,
            SimulatorDate = simResult?.CompletedAtUtc,

            RejectionReason = profile.RejectionReason,
            ReviewedByAdminId = profile.ReviewedByAdminId,
            ReviewedAt = profile.ReviewedAt,

            WalletBalance = profile.AppWalletBalance
        };
    }

    public async Task<bool> ApproveApplicationAsync(int profileId, int adminUserId)
    {
        var profile = await _context.ElectricianProfiles.FirstOrDefaultAsync(p => p.ProfileId == profileId);
        if (profile == null) return false;

        // Check verification prerequisites: NVQ and NIC uploaded, simulator passed
        var simResult = await _context.SimulatorResults
            .OrderByDescending(s => s.CompletedAtUtc)
            .FirstOrDefaultAsync(s => s.ElectricianId == profile.UserId);

        bool hasNvq = !string.IsNullOrWhiteSpace(profile.NvqCertificateUrl);
        bool hasNic = !string.IsNullOrWhiteSpace(profile.NicDocumentUrl);
        bool hasPassedSimulator = simResult != null && simResult.IsPassed;

        if (!hasNvq || !hasNic || !hasPassedSimulator)
        {
            return false;
        }

        profile.VerificationStatus = "Approved";
        profile.IsApprovedByAdmin = true;
        profile.RejectionReason = null;
        profile.ReviewedByAdminId = adminUserId;
        profile.ReviewedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RejectApplicationAsync(int profileId, string reason, int adminUserId)
    {
        var profile = await _context.ElectricianProfiles.FirstOrDefaultAsync(p => p.ProfileId == profileId);
        if (profile == null) return false;

        profile.VerificationStatus = "Rejected";
        profile.IsApprovedByAdmin = false;
        profile.RejectionReason = reason;
        profile.ReviewedByAdminId = adminUserId;
        profile.ReviewedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<CatalogItemDto>> GetAllCatalogItemsAsync(string? category, string? search)
    {
        var query = _context.EquipmentCatalog.AsQueryable();

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(c => c.Category.ToLower() == category.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(c => c.BrandName.ToLower().Contains(s) || c.Specification.ToLower().Contains(s));
        }

        return await query.Select(c => new CatalogItemDto
        {
            ItemId = c.ItemId,
            Category = c.Category,
            BrandName = c.BrandName,
            Specification = c.Specification,
            StandardMarketPrice = c.StandardMarketPrice,
            LastUpdated = c.LastUpdated
        }).ToListAsync();
    }

    public async Task<CatalogItemDto?> GetCatalogItemAsync(int itemId)
    {
        var item = await _context.EquipmentCatalog.FirstOrDefaultAsync(c => c.ItemId == itemId);
        if (item == null) return null;

        return new CatalogItemDto
        {
            ItemId = item.ItemId,
            Category = item.Category,
            BrandName = item.BrandName,
            Specification = item.Specification,
            StandardMarketPrice = item.StandardMarketPrice,
            LastUpdated = item.LastUpdated
        };
    }

    public async Task<CatalogItemDto> CreateCatalogItemAsync(CreateCatalogItemDto dto)
    {
        var item = new EquipmentCatalog
        {
            Category = dto.Category,
            BrandName = dto.BrandName,
            Specification = dto.Specification,
            StandardMarketPrice = dto.StandardMarketPrice,
            LastUpdated = DateTime.UtcNow
        };

        _context.EquipmentCatalog.Add(item);
        await _context.SaveChangesAsync();

        return new CatalogItemDto
        {
            ItemId = item.ItemId,
            Category = item.Category,
            BrandName = item.BrandName,
            Specification = item.Specification,
            StandardMarketPrice = item.StandardMarketPrice,
            LastUpdated = item.LastUpdated
        };
    }

    public async Task<bool> UpdateCatalogItemAsync(int itemId, UpdateCatalogItemDto dto)
    {
        var item = await _context.EquipmentCatalog.FirstOrDefaultAsync(c => c.ItemId == itemId);
        if (item == null) return false;

        if (!string.IsNullOrWhiteSpace(dto.Category))
            item.Category = dto.Category;

        if (!string.IsNullOrWhiteSpace(dto.BrandName))
            item.BrandName = dto.BrandName;

        if (!string.IsNullOrWhiteSpace(dto.Specification))
            item.Specification = dto.Specification;

        if (dto.StandardMarketPrice.HasValue)
            item.StandardMarketPrice = dto.StandardMarketPrice.Value;

        item.LastUpdated = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteCatalogItemAsync(int itemId)
    {
        var item = await _context.EquipmentCatalog.FirstOrDefaultAsync(c => c.ItemId == itemId);
        if (item == null) return false;

        _context.EquipmentCatalog.Remove(item);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<AdminDashboardStatsDto> GetDashboardStatsAsync()
    {
        var totalElectricians = await _context.ElectricianProfiles.CountAsync();
        var pendingApprovals = await _context.ElectricianProfiles.CountAsync(p => p.VerificationStatus == "Pending");
        var approvedCount = await _context.ElectricianProfiles.CountAsync(p => p.VerificationStatus == "Approved");
        var rejectedCount = await _context.ElectricianProfiles.CountAsync(p => p.VerificationStatus == "Rejected");
        var activeJobs = await _context.Jobs.CountAsync(j => j.Status == "InProgress" || j.Status == "Pending");
        var totalCommission = await _context.PaymentTransactions.SumAsync(t => (decimal?)t.PlatformCommission) ?? 0m;

        return new AdminDashboardStatsDto
        {
            TotalElectricians = totalElectricians,
            PendingApprovals = pendingApprovals,
            ApprovedCount = approvedCount,
            RejectedCount = rejectedCount,
            ActiveJobs = activeJobs,
            TotalCommissionCollected = totalCommission
        };
    }
}