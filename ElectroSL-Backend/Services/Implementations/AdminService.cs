using ElectroSL_Backend.Data;
using ElectroSL_Backend.DTOs.Admin;
using ElectroSL_Backend.Models;
using ElectroSL_Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ElectroSL_Backend.Services.Implementations;

public class AdminService : IAdminService
{
    private readonly ElectroSLDbContext _context;
    private readonly IDocumentStorageService _documentStorage;
    private readonly DistanceCalculationService _distanceService;

    public AdminService(
        ElectroSLDbContext context, 
        IDocumentStorageService documentStorage,
        DistanceCalculationService distanceService)
    {
        _context = context;
        _documentStorage = documentStorage;
        _distanceService = distanceService;
    }

    public async Task<List<ApplicationListItemDto>> GetApplicationsByStatusAsync(string status)
    {
        var query = _context.ElectricianProfiles.AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(p => p.VerificationStatus.ToLower() == status.ToLower());
        }

        var results = await (
            from profile in query
            join user in _context.Users on profile.UserId equals user.UserId
            select new
            {
                profile,
                user,
                LatestSimulatorResult = _context.SimulatorResults
                    .Where(s => s.ElectricianId == profile.UserId)
                    .OrderByDescending(s => s.AttemptDate)
                    .FirstOrDefault()
            }
        ).ToListAsync();

        return results.Select(x => new ApplicationListItemDto
        {
            ProfileId = x.profile.ProfileId,
            UserId = x.user.UserId,
            Name = x.user.Name,
            Email = x.user.Email,
            Specialization = x.profile.Specialization ?? string.Empty,
            VerificationStatus = x.profile.VerificationStatus,
            NvqCertificateUrl = x.profile.NvqCertificateUrl ?? string.Empty,
            NicDocumentUrl = x.profile.NicDocumentUrl ?? string.Empty,
            SimulatorPassed = x.LatestSimulatorResult != null && x.LatestSimulatorResult.IsPassed,
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
            .OrderByDescending(s => s.AttemptDate)
            .FirstOrDefaultAsync(s => s.ElectricianId == profile.UserId);

        var auditLogs = await (
            from log in _context.TechnicianAuditLogs
            where log.ElectricianProfileId == profile.ProfileId
            join admin in _context.Users on log.AdminId equals admin.UserId into adminGroup
            from adminUser in adminGroup.DefaultIfEmpty()
            orderby log.TimestampUtc descending
            select new TechnicianAuditLogDto
            {
                Id = log.Id,
                ElectricianProfileId = log.ElectricianProfileId,
                AdminId = log.AdminId,
                AdminName = adminUser != null ? adminUser.Name : $"Admin #{log.AdminId}",
                AdminEmail = adminUser != null ? adminUser.Email : string.Empty,
                Action = log.Action,
                PreviousStatus = log.PreviousStatus,
                NewStatus = log.NewStatus,
                Reason = log.Reason,
                TimestampUtc = log.TimestampUtc
            }
        ).ToListAsync();

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
            SimulatorScore = simResult != null ? simResult.TotalScore : 0, 
            SimulatorTimeTaken = simResult?.TimeTakenSeconds ?? 0,
            SafetyMistakesCount = simResult?.SafetyMistakesCount ?? 0,
            SimulatorDate = simResult?.AttemptDate,

            RejectionReason = profile.RejectionReason,
            ReviewedByAdminId = profile.ReviewedByAdminId,
            ReviewedAt = profile.ReviewedAt,

            WalletBalance = profile.AppWalletBalance,
            AuditLogs = auditLogs
        };
    }

    public async Task<ReviewActionResult> ApproveApplicationAsync(int profileId, int adminUserId)
    {
        var profile = await _context.ElectricianProfiles.FirstOrDefaultAsync(p => p.ProfileId == profileId);
        if (profile == null)
        {
            return ReviewActionResult.NotFound($"Application with ProfileId #{profileId} was not found.");
        }

        // Concurrency / Duplicate check
        if (profile.VerificationStatus == "Approved")
        {
            return ReviewActionResult.Conflict("Duplicate action: This technician is already approved.", profile.VerificationStatus);
        }

        if (profile.VerificationStatus != "Pending")
        {
            return ReviewActionResult.Conflict($"Conflict: Application is currently in '{profile.VerificationStatus}' status and cannot be approved directly.", profile.VerificationStatus);
        }

        // Check verification prerequisites: NVQ and NIC uploaded, physical files exist, and simulator passed
        var simResult = await _context.SimulatorResults
            .OrderByDescending(s => s.AttemptDate)
            .FirstOrDefaultAsync(s => s.ElectricianId == profile.UserId);

        bool hasNvq = !string.IsNullOrWhiteSpace(profile.NvqCertificateUrl) && _documentStorage.DocumentExists(profile.NvqCertificateUrl);
        bool hasNic = !string.IsNullOrWhiteSpace(profile.NicDocumentUrl) && _documentStorage.DocumentExists(profile.NicDocumentUrl);
        bool hasPassedSimulator = simResult != null && simResult.IsPassed;

        if (!hasNvq || !hasNic)
        {
            return ReviewActionResult.Invalid("Cannot approve: Both valid physical NIC and NVQ Level 4 documents must be uploaded and stored.");
        }

        if (!hasPassedSimulator)
        {
            return ReviewActionResult.Invalid("Cannot approve: The technician has not passed the circuit simulator assessment. To authorize this technician regardless, an administrator must provide a mandatory override explanation.");
        }

        var previousStatus = profile.VerificationStatus;
        profile.VerificationStatus = "Approved";
        profile.IsApprovedByAdmin = true;
        profile.RejectionReason = null;
        profile.ReviewedByAdminId = adminUserId;
        profile.ReviewedAt = DateTime.UtcNow;

        var auditLog = new TechnicianAuditLog
        {
            ElectricianProfileId = profile.ProfileId,
            AdminId = adminUserId,
            Action = "Approved",
            PreviousStatus = previousStatus,
            NewStatus = "Approved",
            Reason = "Standard accreditation approved. Verified physical NVQ Level 4 certificate, NIC identity document, and passed circuit simulator assessment.",
            TimestampUtc = DateTime.UtcNow
        };
        _context.TechnicianAuditLogs.Add(auditLog);

        try
        {
            await _context.SaveChangesAsync();
            return ReviewActionResult.Ok($"Technician #{profileId} has been successfully approved.", "Approved");
        }
        catch (DbUpdateConcurrencyException)
        {
            return ReviewActionResult.Conflict("Concurrency conflict: This application was updated by another administrator simultaneously. Please reload to review the latest state.", profile.VerificationStatus);
        }
    }

    public async Task<ReviewActionResult> ApproveApplicationWithOverrideAsync(int profileId, string overrideReason, int adminUserId)
    {
        var profile = await _context.ElectricianProfiles.FirstOrDefaultAsync(p => p.ProfileId == profileId);
        if (profile == null)
        {
            return ReviewActionResult.NotFound($"Application with ProfileId #{profileId} was not found.");
        }

        // Concurrency / Duplicate check
        if (profile.VerificationStatus == "Approved")
        {
            return ReviewActionResult.Conflict("Duplicate action: This technician is already approved.", profile.VerificationStatus);
        }

        if (profile.VerificationStatus != "Pending")
        {
            return ReviewActionResult.Conflict($"Conflict: Application is currently in '{profile.VerificationStatus}' status and cannot be approved directly.", profile.VerificationStatus);
        }

        if (string.IsNullOrWhiteSpace(overrideReason) || overrideReason.Trim().Length < 10)
        {
            return ReviewActionResult.Invalid("Override explanation is mandatory and must be at least 10 characters long.");
        }

        // Must still have physical NIC and NVQ documents
        bool hasNvq = !string.IsNullOrWhiteSpace(profile.NvqCertificateUrl) && _documentStorage.DocumentExists(profile.NvqCertificateUrl);
        bool hasNic = !string.IsNullOrWhiteSpace(profile.NicDocumentUrl) && _documentStorage.DocumentExists(profile.NicDocumentUrl);

        if (!hasNvq || !hasNic)
        {
            return ReviewActionResult.Invalid("Cannot override: Both valid physical NIC and NVQ Level 4 documents must be uploaded and stored.");
        }

        var previousStatus = profile.VerificationStatus;
        profile.VerificationStatus = "Approved";
        profile.IsApprovedByAdmin = true;
        profile.RejectionReason = null;
        profile.ReviewedByAdminId = adminUserId;
        profile.ReviewedAt = DateTime.UtcNow;

        var auditLog = new TechnicianAuditLog
        {
            ElectricianProfileId = profile.ProfileId,
            AdminId = adminUserId,
            Action = "SimulatorOverrideApproved",
            PreviousStatus = previousStatus,
            NewStatus = "Approved",
            Reason = $"[SIMULATOR OVERRIDE] {overrideReason.Trim()}",
            TimestampUtc = DateTime.UtcNow
        };
        _context.TechnicianAuditLogs.Add(auditLog);

        try
        {
            await _context.SaveChangesAsync();
            return ReviewActionResult.Ok($"Technician #{profileId} has been approved via Administrator Simulator Override.", "Approved");
        }
        catch (DbUpdateConcurrencyException)
        {
            return ReviewActionResult.Conflict("Concurrency conflict: This application was updated by another administrator simultaneously. Please reload to review the latest state.", profile.VerificationStatus);
        }
    }

    public async Task<ReviewActionResult> RejectApplicationAsync(int profileId, string reason, int adminUserId)
    {
        var profile = await _context.ElectricianProfiles.FirstOrDefaultAsync(p => p.ProfileId == profileId);
        if (profile == null)
        {
            return ReviewActionResult.NotFound($"Application with ProfileId #{profileId} was not found.");
        }

        if (string.IsNullOrWhiteSpace(reason) || reason.Trim().Length < 10)
        {
            return ReviewActionResult.Invalid("Rejection reason is mandatory and must be at least 10 characters long.");
        }

        // Concurrency / Duplicate check
        if (profile.VerificationStatus == "Approved")
        {
            return ReviewActionResult.Conflict("Conflict: This technician application has already been approved by another administrator.", profile.VerificationStatus);
        }

        if (profile.VerificationStatus == "Rejected" && profile.RejectionReason == reason.Trim())
        {
            return ReviewActionResult.Conflict("Duplicate action: This application has already been rejected with the specified reason.", profile.VerificationStatus);
        }

        var previousStatus = profile.VerificationStatus;
        profile.VerificationStatus = "Rejected";
        profile.IsApprovedByAdmin = false;
        profile.RejectionReason = reason.Trim();
        profile.ReviewedByAdminId = adminUserId;
        profile.ReviewedAt = DateTime.UtcNow;

        var auditLog = new TechnicianAuditLog
        {
            ElectricianProfileId = profile.ProfileId,
            AdminId = adminUserId,
            Action = "Rejected",
            PreviousStatus = previousStatus,
            NewStatus = "Rejected",
            Reason = reason.Trim(),
            TimestampUtc = DateTime.UtcNow
        };
        _context.TechnicianAuditLogs.Add(auditLog);

        try
        {
            await _context.SaveChangesAsync();
            return ReviewActionResult.Ok($"Technician #{profileId} has been rejected.", "Rejected");
        }
        catch (DbUpdateConcurrencyException)
        {
            return ReviewActionResult.Conflict("Concurrency conflict: This application was updated by another administrator simultaneously. Please reload to review the latest state.", profile.VerificationStatus);
        }
    }

    public async Task<ReviewActionResult> RevokeApplicationAsync(int profileId, string reason, int adminUserId)
    {
        var profile = await _context.ElectricianProfiles.FirstOrDefaultAsync(p => p.ProfileId == profileId);
        if (profile == null)
        {
            return ReviewActionResult.NotFound($"Application with ProfileId #{profileId} was not found.");
        }

        // Concurrency / State check: Can only revoke an Approved application
        if (profile.VerificationStatus == "Revoked")
        {
            return ReviewActionResult.Conflict("Duplicate action: This technician's accreditation is already revoked.", profile.VerificationStatus);
        }

        if (profile.VerificationStatus != "Approved")
        {
            return ReviewActionResult.Conflict($"Conflict: Cannot revoke technician application in '{profile.VerificationStatus}' status. Only currently approved technicians can be revoked.", profile.VerificationStatus);
        }

        if (string.IsNullOrWhiteSpace(reason) || reason.Trim().Length < 10)
        {
            return ReviewActionResult.Invalid("Revocation reason is mandatory and must be at least 10 characters long.");
        }

        var previousStatus = profile.VerificationStatus;
        profile.VerificationStatus = "Revoked";
        profile.IsApprovedByAdmin = false;
        profile.IsOnline = false;
        profile.RejectionReason = reason.Trim();
        profile.ReviewedByAdminId = adminUserId;
        profile.ReviewedAt = DateTime.UtcNow;

        var auditLog = new TechnicianAuditLog
        {
            ElectricianProfileId = profile.ProfileId,
            AdminId = adminUserId,
            Action = "Revoked",
            PreviousStatus = previousStatus,
            NewStatus = "Revoked",
            Reason = reason.Trim(),
            TimestampUtc = DateTime.UtcNow
        };
        _context.TechnicianAuditLogs.Add(auditLog);

        try
        {
            await _context.SaveChangesAsync();
            return ReviewActionResult.Ok($"Technician #{profileId} accreditation has been revoked.", "Revoked");
        }
        catch (DbUpdateConcurrencyException)
        {
            return ReviewActionResult.Conflict("Concurrency conflict: This application was updated by another administrator simultaneously. Please reload to review the latest state.", profile.VerificationStatus);
        }
    }

    public async Task<List<TechnicianAuditLogDto>> GetApplicationAuditLogsAsync(int profileId)
    {
        return await (
            from log in _context.TechnicianAuditLogs
            where log.ElectricianProfileId == profileId
            join admin in _context.Users on log.AdminId equals admin.UserId into adminGroup
            from adminUser in adminGroup.DefaultIfEmpty()
            orderby log.TimestampUtc descending
            select new TechnicianAuditLogDto
            {
                Id = log.Id,
                ElectricianProfileId = log.ElectricianProfileId,
                AdminId = log.AdminId,
                AdminName = adminUser != null ? adminUser.Name : $"Admin #{log.AdminId}",
                AdminEmail = adminUser != null ? adminUser.Email : string.Empty,
                Action = log.Action,
                PreviousStatus = log.PreviousStatus,
                NewStatus = log.NewStatus,
                Reason = log.Reason,
                TimestampUtc = log.TimestampUtc
            }
        ).ToListAsync();
    }

    public async Task<List<CatalogItemDto>> GetAllCatalogItemsAsync(string? category, string? search, bool? isActive = null)
    {
        var query = _context.EquipmentCatalog.AsQueryable();

        if (isActive.HasValue)
        {
            query = query.Where(c => c.IsActive == isActive.Value);
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(c => c.Category.ToLower() == category.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(c => 
                c.ItemName.ToLower().Contains(s) || 
                c.BrandName.ToLower().Contains(s) || 
                c.Specification.ToLower().Contains(s) ||
                (c.Description != null && c.Description.ToLower().Contains(s)));
        }

        return await query
            .OrderBy(c => c.Category)
            .ThenBy(c => c.ItemName)
            .Select(c => new CatalogItemDto
            {
                ItemId = c.ItemId,
                ItemName = !string.IsNullOrWhiteSpace(c.ItemName) ? c.ItemName : (c.BrandName + " " + c.Specification).Trim(),
                Description = c.Description,
                Category = c.Category,
                BrandName = c.BrandName,
                Specification = c.Specification,
                Unit = c.Unit,
                StandardMarketPrice = c.StandardMarketPrice,
                PriceVarianceThreshold = c.PriceVarianceThreshold,
                IsActive = c.IsActive,
                ConcurrencyVersion = c.ConcurrencyVersion,
                LastUpdated = c.LastUpdated
            }).ToListAsync();
    }

    public async Task<CatalogItemDto?> GetCatalogItemAsync(int itemId)
    {
        var item = await _context.EquipmentCatalog.FirstOrDefaultAsync(c => c.ItemId == itemId);
        if (item == null) return null;

        return MapToCatalogItemDto(item);
    }

    public async Task<CatalogActionResult<CatalogItemDto>> CreateCatalogItemAsync(CreateCatalogItemDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Category))
            return CatalogActionResult<CatalogItemDto>.Invalid("Category is required.");

        if (string.IsNullOrWhiteSpace(dto.BrandName))
            return CatalogActionResult<CatalogItemDto>.Invalid("Brand name is required.");

        if (string.IsNullOrWhiteSpace(dto.Specification))
            return CatalogActionResult<CatalogItemDto>.Invalid("Specification is required.");

        if (dto.StandardMarketPrice <= 0)
            return CatalogActionResult<CatalogItemDto>.Invalid("Standard market price must be greater than zero.");

        decimal threshold = dto.PriceVarianceThreshold > 0 && dto.PriceVarianceThreshold <= 100.0m 
            ? Math.Round(dto.PriceVarianceThreshold, 2) 
            : 5.00m;

        var itemName = !string.IsNullOrWhiteSpace(dto.ItemName)
            ? dto.ItemName.Trim()
            : $"{dto.BrandName.Trim()} {dto.Specification.Trim()}".Trim();

        var item = new EquipmentCatalog
        {
            ItemName = itemName,
            Description = dto.Description?.Trim(),
            Category = dto.Category.Trim(),
            BrandName = dto.BrandName.Trim(),
            Specification = dto.Specification.Trim(),
            Unit = !string.IsNullOrWhiteSpace(dto.Unit) ? dto.Unit.Trim() : "Unit",
            StandardMarketPrice = dto.StandardMarketPrice,
            PriceVarianceThreshold = threshold,
            IsActive = true,
            ConcurrencyVersion = 1,
            LastUpdated = DateTime.UtcNow
        };

        _context.EquipmentCatalog.Add(item);
        await _context.SaveChangesAsync();

        return CatalogActionResult<CatalogItemDto>.Ok(MapToCatalogItemDto(item), $"Catalog item '{item.ItemName}' created successfully.");
    }

    public async Task<CatalogActionResult<CatalogItemDto>> UpdateCatalogItemAsync(int itemId, UpdateCatalogItemDto dto, int adminUserId)
    {
        var item = await _context.EquipmentCatalog.FirstOrDefaultAsync(c => c.ItemId == itemId);
        if (item == null)
        {
            return CatalogActionResult<CatalogItemDto>.NotFound($"Catalog item #{itemId} not found.");
        }

        // Concurrency token check: Compare submitted ConcurrencyVersion with current database item's ConcurrencyVersion
        if (!dto.ConcurrencyVersion.HasValue || dto.ConcurrencyVersion.Value != item.ConcurrencyVersion)
        {
            return CatalogActionResult<CatalogItemDto>.Conflict(
                $"Concurrency conflict: The submitted version ({dto.ConcurrencyVersion?.ToString() ?? "missing"}) does not match current version ({item.ConcurrencyVersion}). This catalog item has been modified by another administrator. Please reload to review the latest data.");
        }

        if (!string.IsNullOrWhiteSpace(dto.ItemName))
            item.ItemName = dto.ItemName.Trim();

        if (dto.Description != null)
            item.Description = dto.Description.Trim();

        if (!string.IsNullOrWhiteSpace(dto.Category))
            item.Category = dto.Category.Trim();

        if (!string.IsNullOrWhiteSpace(dto.BrandName))
            item.BrandName = dto.BrandName.Trim();

        if (!string.IsNullOrWhiteSpace(dto.Specification))
            item.Specification = dto.Specification.Trim();

        if (!string.IsNullOrWhiteSpace(dto.Unit))
            item.Unit = dto.Unit.Trim();

        if (dto.IsActive.HasValue)
            item.IsActive = dto.IsActive.Value;

        if (dto.PriceVarianceThreshold.HasValue)
        {
            if (dto.PriceVarianceThreshold.Value <= 0 || dto.PriceVarianceThreshold.Value > 100.0m)
            {
                return CatalogActionResult<CatalogItemDto>.Invalid("Price variance threshold must be between 0.01% and 100.00%.");
            }
            item.PriceVarianceThreshold = Math.Round(dto.PriceVarianceThreshold.Value, 2);
        }

        // Price change & historical tracking
        if (dto.StandardMarketPrice.HasValue)
        {
            decimal newPrice = dto.StandardMarketPrice.Value;
            if (newPrice <= 0)
            {
                return CatalogActionResult<CatalogItemDto>.Invalid("Standard market price must be greater than zero.");
            }

            decimal oldPrice = item.StandardMarketPrice;
            if (newPrice != oldPrice)
            {
                decimal percentageChange = Math.Round(((newPrice - oldPrice) / oldPrice) * 100m, 2);
                decimal absChange = Math.Abs(percentageChange);

                // Significant price change guard: >= 25% requires mandatory reason (>= 10 chars)
                if (absChange >= 25.0m)
                {
                    if (string.IsNullOrWhiteSpace(dto.Reason) || dto.Reason.Trim().Length < 10)
                    {
                        return CatalogActionResult<CatalogItemDto>.Invalid(
                            $"Price change of {absChange:F1}% is a significant modification (>= 25%). A meaningful explanation of at least 10 characters is mandatory.");
                    }
                }

                // Add immutable price history record
                var historyRecord = new EquipmentPriceHistory
                {
                    CatalogItemId = item.ItemId,
                    OldPrice = oldPrice,
                    NewPrice = newPrice,
                    ChangePercentage = percentageChange,
                    Reason = dto.Reason?.Trim(),
                    ChangedByAdminId = adminUserId,
                    EffectiveDateUtc = DateTime.UtcNow
                };
                _context.EquipmentPriceHistories.Add(historyRecord);

                item.StandardMarketPrice = newPrice;
            }
        }

        // Increment numeric concurrency version and update timestamp
        item.ConcurrencyVersion++;
        item.LastUpdated = DateTime.UtcNow;

        try
        {
            await _context.SaveChangesAsync();
            return CatalogActionResult<CatalogItemDto>.Ok(MapToCatalogItemDto(item), $"Catalog item #{itemId} successfully updated.");
        }
        catch (DbUpdateConcurrencyException)
        {
            return CatalogActionResult<CatalogItemDto>.Conflict("Concurrency conflict: This equipment item was modified by another administrator simultaneously. Please reload the latest item data.");
        }
    }

    public async Task<CatalogActionResult<bool>> DeactivateCatalogItemAsync(int itemId, int? expectedVersion, int adminUserId)
    {
        var item = await _context.EquipmentCatalog.FirstOrDefaultAsync(c => c.ItemId == itemId);
        if (item == null)
        {
            return CatalogActionResult<bool>.NotFound($"Catalog item #{itemId} not found.");
        }

        // Concurrency check against stale requests before changing IsActive
        if (!expectedVersion.HasValue || expectedVersion.Value != item.ConcurrencyVersion)
        {
            return CatalogActionResult<bool>.Conflict(
                $"Concurrency conflict: The submitted version ({expectedVersion?.ToString() ?? "missing"}) does not match the current catalog version ({item.ConcurrencyVersion}). Please reload to review current status.");
        }

        if (!item.IsActive)
        {
            return CatalogActionResult<bool>.Conflict($"Catalog item #{itemId} ('{item.ItemName}') is already deactivated.");
        }

        // Soft deactivation: preserve all historical relationships in JobUsedEquipment
        item.IsActive = false;
        item.ConcurrencyVersion++;
        item.LastUpdated = DateTime.UtcNow;

        try
        {
            await _context.SaveChangesAsync();
            return CatalogActionResult<bool>.Ok(true, $"Catalog item #{itemId} ('{item.ItemName}') has been deactivated.");
        }
        catch (DbUpdateConcurrencyException)
        {
            return CatalogActionResult<bool>.Conflict("Concurrency conflict: This item was modified concurrently by another transaction. Please reload to review current status.");
        }
    }

    public async Task<CatalogActionResult<bool>> ActivateCatalogItemAsync(int itemId, int? expectedVersion, int adminUserId)
    {
        var item = await _context.EquipmentCatalog.FirstOrDefaultAsync(c => c.ItemId == itemId);
        if (item == null)
        {
            return CatalogActionResult<bool>.NotFound($"Catalog item #{itemId} not found.");
        }

        // Concurrency check against stale requests before changing IsActive
        if (!expectedVersion.HasValue || expectedVersion.Value != item.ConcurrencyVersion)
        {
            return CatalogActionResult<bool>.Conflict(
                $"Concurrency conflict: The submitted version ({expectedVersion?.ToString() ?? "missing"}) does not match the current catalog version ({item.ConcurrencyVersion}). Please reload to review current status.");
        }

        if (item.IsActive)
        {
            return CatalogActionResult<bool>.Conflict($"Catalog item #{itemId} ('{item.ItemName}') is already active.");
        }

        item.IsActive = true;
        item.ConcurrencyVersion++;
        item.LastUpdated = DateTime.UtcNow;

        try
        {
            await _context.SaveChangesAsync();
            return CatalogActionResult<bool>.Ok(true, $"Catalog item #{itemId} ('{item.ItemName}') has been activated.");
        }
        catch (DbUpdateConcurrencyException)
        {
            return CatalogActionResult<bool>.Conflict("Concurrency conflict: This item was modified concurrently by another transaction. Please reload to review current status.");
        }
    }

    public async Task<List<EquipmentPriceHistoryDto>> GetCatalogItemPriceHistoryAsync(int itemId)
    {
        return await (
            from h in _context.EquipmentPriceHistories
            where h.CatalogItemId == itemId
            join admin in _context.Users on h.ChangedByAdminId equals admin.UserId into adminGroup
            from adminUser in adminGroup.DefaultIfEmpty()
            orderby h.EffectiveDateUtc descending
            select new EquipmentPriceHistoryDto
            {
                Id = h.Id,
                CatalogItemId = h.CatalogItemId,
                OldPrice = h.OldPrice,
                NewPrice = h.NewPrice,
                ChangePercentage = h.ChangePercentage,
                Reason = h.Reason,
                ChangedByAdminId = h.ChangedByAdminId,
                AdminName = adminUser != null ? adminUser.Name : $"Admin #{h.ChangedByAdminId}",
                AdminEmail = adminUser != null ? adminUser.Email : string.Empty,
                EffectiveDateUtc = h.EffectiveDateUtc
            }
        ).ToListAsync();
    }

    private static CatalogItemDto MapToCatalogItemDto(EquipmentCatalog c) => new()
    {
        ItemId = c.ItemId,
        ItemName = !string.IsNullOrWhiteSpace(c.ItemName) ? c.ItemName : (c.BrandName + " " + c.Specification).Trim(),
        Description = c.Description,
        Category = c.Category,
        BrandName = c.BrandName,
        Specification = c.Specification,
        Unit = c.Unit,
        StandardMarketPrice = c.StandardMarketPrice,
        PriceVarianceThreshold = c.PriceVarianceThreshold,
        IsActive = c.IsActive,
        ConcurrencyVersion = c.ConcurrencyVersion,
        LastUpdated = c.LastUpdated
    };

    public async Task<AdminDashboardStatsDto> GetDashboardStatsAsync()
    {
        var totalElectricians = await _context.ElectricianProfiles.CountAsync();
        var pendingApprovals = await _context.ElectricianProfiles.CountAsync(p => p.VerificationStatus == "Pending");
        var approvedCount = await _context.ElectricianProfiles.CountAsync(p => p.VerificationStatus == "Approved");
        var rejectedCount = await _context.ElectricianProfiles.CountAsync(p => p.VerificationStatus == "Rejected");
        var activeJobs = await _context.Jobs.CountAsync(j => j.Status == "InProgress" || j.Status == "Pending");
        var totalCommission = await _context.PaymentTransactions.SumAsync(t => (decimal?)t.PlatformCommission) ?? 0m;
        var totalCustomers = await _context.Users.CountAsync(u => u.Role == "Customer");
        var totalActive = await _context.Users.CountAsync(u => u.IsActive && u.AccountStatus == "Active");
        var totalSuspended = await _context.Users.CountAsync(u => u.AccountStatus == "Suspended");
        var totalInactive = await _context.Users.CountAsync(u => !u.IsActive && u.AccountStatus == "Inactive");

        return new AdminDashboardStatsDto
        {
            TotalElectricians = totalElectricians,
            PendingApprovals = pendingApprovals,
            ApprovedCount = approvedCount,
            RejectedCount = rejectedCount,
            ActiveJobs = activeJobs,
            TotalCommissionCollected = totalCommission,
            FlaggedEquipmentClaims = await _context.JobUsedEquipments.CountAsync(jue => jue.Status == "FlaggedForReview"),
            TotalCustomers = totalCustomers,
            TotalActiveAccounts = totalActive,
            TotalSuspendedAccounts = totalSuspended,
            TotalInactiveAccounts = totalInactive
        };
    }

    // Flagged Equipment Price Claims Review
    public async Task<List<FlaggedClaimItemDto>> GetEquipmentClaimsAsync(string? status, string? search, string? category)
    {
        var query = _context.JobUsedEquipments
            .Include(e => e.Job)
                .ThenInclude(j => j.Customer)
            .Include(e => e.Job)
                .ThenInclude(j => j.Electrician)
            .Include(e => e.EquipmentCatalog)
            .Include(e => e.ReviewedByAdmin)
            .AsQueryable();

        // Status filter: defaults to "FlaggedForReview" if empty
        if (string.IsNullOrWhiteSpace(status) || status.Equals("FlaggedForReview", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(e => e.Status == "FlaggedForReview");
        }
        else if (!status.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(e => e.Status == status);
        }

        // Search filter
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            query = query.Where(e => 
                e.ItemName.Contains(s) ||
                (e.EquipmentCatalog != null && e.EquipmentCatalog.BrandName.Contains(s)) ||
                (e.EquipmentCatalog != null && e.EquipmentCatalog.Specification.Contains(s)) ||
                (e.Job.Electrician != null && e.Job.Electrician.Name.Contains(s)) ||
                e.JobId.ToString() == s);
        }

        // Category filter
        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(e => e.EquipmentCatalog != null && e.EquipmentCatalog.Category == category.Trim());
        }

        return await query
            .OrderByDescending(e => e.Id)
            .Select(e => new FlaggedClaimItemDto
            {
                Id = e.Id,
                JobId = e.JobId,
                JobType = e.Job.JobType,
                JobDescription = e.Job.Description,
                JobCreatedAt = e.Job.CreatedAt,
                ElectricianId = e.Job.ElectricianId,
                ElectricianName = e.Job.Electrician != null ? e.Job.Electrician.Name : "Unassigned",
                ElectricianEmail = e.Job.Electrician != null ? e.Job.Electrician.Email : string.Empty,
                CustomerId = e.Job.CustomerId,
                CustomerName = e.Job.Customer != null ? e.Job.Customer.Name : $"Customer #{e.Job.CustomerId}",
                CatalogItemId = e.CatalogItemId,
                ItemName = e.ItemName,
                Category = e.EquipmentCatalog != null ? e.EquipmentCatalog.Category : "General",
                Unit = e.EquipmentCatalog != null ? e.EquipmentCatalog.Unit : "Unit",
                Quantity = e.Quantity,
                ClaimedPrice = e.ClaimedPrice,
                StandardMarketPrice = e.EquipmentCatalog != null ? e.EquipmentCatalog.StandardMarketPrice : 0m,
                PriceVarianceThreshold = e.EquipmentCatalog != null ? e.EquipmentCatalog.PriceVarianceThreshold : 5.00m,
                VariancePercentage = e.VariancePercentage,
                ReceiptImageUrl = e.ReceiptImageUrl,
                Status = e.Status,
                AdminReviewNotes = e.AdminReviewNotes,
                ReviewedByAdminId = e.ReviewedByAdminId,
                ReviewedByAdminName = e.ReviewedByAdmin != null ? e.ReviewedByAdmin.Name : null,
                ReviewedAt = e.ReviewedAt
            })
            .ToListAsync();
    }

    public async Task<FlaggedClaimItemDto?> GetEquipmentClaimDetailAsync(int claimId)
    {
        return await _context.JobUsedEquipments
            .Include(e => e.Job)
                .ThenInclude(j => j.Customer)
            .Include(e => e.Job)
                .ThenInclude(j => j.Electrician)
            .Include(e => e.EquipmentCatalog)
            .Include(e => e.ReviewedByAdmin)
            .Where(e => e.Id == claimId)
            .Select(e => new FlaggedClaimItemDto
            {
                Id = e.Id,
                JobId = e.JobId,
                JobType = e.Job.JobType,
                JobDescription = e.Job.Description,
                JobCreatedAt = e.Job.CreatedAt,
                ElectricianId = e.Job.ElectricianId,
                ElectricianName = e.Job.Electrician != null ? e.Job.Electrician.Name : "Unassigned",
                ElectricianEmail = e.Job.Electrician != null ? e.Job.Electrician.Email : string.Empty,
                CustomerId = e.Job.CustomerId,
                CustomerName = e.Job.Customer != null ? e.Job.Customer.Name : $"Customer #{e.Job.CustomerId}",
                CatalogItemId = e.CatalogItemId,
                ItemName = e.ItemName,
                Category = e.EquipmentCatalog != null ? e.EquipmentCatalog.Category : "General",
                Unit = e.EquipmentCatalog != null ? e.EquipmentCatalog.Unit : "Unit",
                Quantity = e.Quantity,
                ClaimedPrice = e.ClaimedPrice,
                StandardMarketPrice = e.EquipmentCatalog != null ? e.EquipmentCatalog.StandardMarketPrice : 0m,
                PriceVarianceThreshold = e.EquipmentCatalog != null ? e.EquipmentCatalog.PriceVarianceThreshold : 5.00m,
                VariancePercentage = e.VariancePercentage,
                ReceiptImageUrl = e.ReceiptImageUrl,
                Status = e.Status,
                AdminReviewNotes = e.AdminReviewNotes,
                ReviewedByAdminId = e.ReviewedByAdminId,
                ReviewedByAdminName = e.ReviewedByAdmin != null ? e.ReviewedByAdmin.Name : null,
                ReviewedAt = e.ReviewedAt
            })
            .FirstOrDefaultAsync();
    }

    public async Task<ClaimReviewActionResult> ApproveEquipmentClaimAsync(int claimId, string? reviewNotes, int adminUserId)
    {
        var claim = await _context.JobUsedEquipments.FirstOrDefaultAsync(c => c.Id == claimId);
        if (claim == null)
        {
            return ClaimReviewActionResult.NotFound($"Equipment claim #{claimId} was not found.");
        }

        // Concurrency / Duplicate check: Can only approve claims currently in FlaggedForReview status
        if (claim.Status != "FlaggedForReview")
        {
            return ClaimReviewActionResult.Conflict(
                $"Conflict: Equipment claim #{claimId} has already been reviewed (current status: '{claim.Status}').",
                claim.Status);
        }

        claim.Status = "AdminApproved";
        claim.AdminReviewNotes = reviewNotes?.Trim();
        claim.ReviewedByAdminId = adminUserId;
        claim.ReviewedAt = DateTime.UtcNow;

        try
        {
            await _context.SaveChangesAsync();
            return ClaimReviewActionResult.Ok(
                claimId, 
                "AdminApproved", 
                $"Equipment claim #{claimId} ('{claim.ItemName}') has been approved.");
        }
        catch (DbUpdateConcurrencyException)
        {
            return ClaimReviewActionResult.Conflict(
                "Concurrency conflict: This equipment claim was reviewed by another administrator simultaneously. Please reload to review the latest state.",
                claim.Status);
        }
    }

    public async Task<ClaimReviewActionResult> RejectEquipmentClaimAsync(int claimId, string rejectionReason, int adminUserId)
    {
        if (string.IsNullOrWhiteSpace(rejectionReason) || rejectionReason.Trim().Length < 10)
        {
            return ClaimReviewActionResult.Invalid(
                "A meaningful administrative rejection explanation of at least 10 characters is mandatory.");
        }

        var claim = await _context.JobUsedEquipments.FirstOrDefaultAsync(c => c.Id == claimId);
        if (claim == null)
        {
            return ClaimReviewActionResult.NotFound($"Equipment claim #{claimId} was not found.");
        }

        // Concurrency / Duplicate check: Can only reject claims currently in FlaggedForReview status
        if (claim.Status != "FlaggedForReview")
        {
            return ClaimReviewActionResult.Conflict(
                $"Conflict: Equipment claim #{claimId} has already been reviewed (current status: '{claim.Status}').",
                claim.Status);
        }

        claim.Status = "AdminRejected";
        claim.AdminReviewNotes = rejectionReason.Trim();
        claim.ReviewedByAdminId = adminUserId;
        claim.ReviewedAt = DateTime.UtcNow;

        try
        {
            await _context.SaveChangesAsync();
            return ClaimReviewActionResult.Ok(
                claimId, 
                "AdminRejected", 
                $"Equipment claim #{claimId} ('{claim.ItemName}') has been rejected.");
        }
        catch (DbUpdateConcurrencyException)
        {
            return ClaimReviewActionResult.Conflict(
                "Concurrency conflict: This equipment claim was reviewed by another administrator simultaneously. Please reload to review the latest state.",
                claim.Status);
        }
    }

    // ==========================================
    // Phase 3: User Management Implementation
    // ==========================================

    public async Task<List<UserSummaryDto>> GetUsersAsync(string? role, string? search, string? status)
    {
        var query = _context.Users
            .Include(u => u.ElectricianProfile)
            .AsNoTracking()
            .AsQueryable();

        // Role filter
        if (!string.IsNullOrWhiteSpace(role) && !role.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            var r = role.Trim();
            query = query.Where(u => u.Role == r);
        }

        // Status filter: Active, Inactive, Suspended
        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            var s = status.Trim();
            if (s.Equals("Active", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(u => u.IsActive && u.AccountStatus == "Active");
            }
            else if (s.Equals("Inactive", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(u => !u.IsActive && u.AccountStatus == "Inactive");
            }
            else if (s.Equals("Suspended", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(u => u.AccountStatus == "Suspended");
            }
            else
            {
                query = query.Where(u => u.AccountStatus == s);
            }
        }

        // Search query: name, email, phone
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(u =>
                u.Name.ToLower().Contains(term) ||
                u.Email.ToLower().Contains(term) ||
                u.Phone.ToLower().Contains(term));
        }

        return await query
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new UserSummaryDto
            {
                UserId = u.UserId,
                Name = u.Name,
                Email = u.Email,
                Phone = u.Phone,
                Role = u.Role,
                IsActive = u.IsActive,
                AccountStatus = u.AccountStatus,
                SuspensionReason = u.SuspensionReason,
                CreatedAt = u.CreatedAt,
                DeactivatedAt = u.DeactivatedAt,
                SuspendedAt = u.SuspendedAt,
                ConcurrencyVersion = u.ConcurrencyVersion,
                ElectricianProfileId = u.ElectricianProfile != null ? u.ElectricianProfile.ProfileId : null,
                VerificationStatus = u.ElectricianProfile != null ? u.ElectricianProfile.VerificationStatus : null,
                IsApprovedByAdmin = u.ElectricianProfile != null ? u.ElectricianProfile.IsApprovedByAdmin : null,
                IsOnline = u.ElectricianProfile != null ? u.ElectricianProfile.IsOnline : null,
                Specialization = u.ElectricianProfile != null ? u.ElectricianProfile.Specialization : null,
                AppWalletBalance = u.ElectricianProfile != null ? u.ElectricianProfile.AppWalletBalance : null
            })
            .ToListAsync();
    }

    public async Task<UserDetailDto?> GetUserDetailAsync(int userId)
    {
        var user = await _context.Users
            .Include(u => u.ElectricianProfile)
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null)
        {
            return null;
        }

        var dto = new UserDetailDto
        {
            UserId = user.UserId,
            Name = user.Name,
            Email = user.Email,
            Phone = user.Phone,
            Role = user.Role,
            IsActive = user.IsActive,
            AccountStatus = user.AccountStatus,
            SuspensionReason = user.SuspensionReason,
            CreatedAt = user.CreatedAt,
            DeactivatedAt = user.DeactivatedAt,
            SuspendedAt = user.SuspendedAt,
            ConcurrencyVersion = user.ConcurrencyVersion,
            ElectricianProfileId = user.ElectricianProfile?.ProfileId,
            VerificationStatus = user.ElectricianProfile?.VerificationStatus,
            IsApprovedByAdmin = user.ElectricianProfile?.IsApprovedByAdmin,
            IsOnline = user.ElectricianProfile?.IsOnline,
            Specialization = user.ElectricianProfile?.Specialization,
            AppWalletBalance = user.ElectricianProfile?.AppWalletBalance,
            NicDocumentUrl = user.ElectricianProfile?.NicDocumentUrl,
            NvqCertificateUrl = user.ElectricianProfile?.NvqCertificateUrl
        };

        if (user.Role == "Customer")
        {
            var customerJobs = await _context.Jobs
                .Include(j => j.Electrician)
                .Where(j => j.CustomerId == userId)
                .OrderByDescending(j => j.CreatedAt)
                .ToListAsync();

            dto.TotalCustomerJobs = customerJobs.Count;
            dto.ActiveCustomerJobs = customerJobs.Count(j => j.Status == "InProgress" || j.Status == "Assigned" || j.Status == "Pending");
            dto.CompletedCustomerJobs = customerJobs.Count(j => j.Status == "Completed");

            var jobIds = customerJobs.Select(j => j.JobId).ToList();
            dto.TotalCustomerSpend = await _context.PaymentTransactions
                .Where(pt => jobIds.Contains(pt.JobId))
                .SumAsync(pt => (decimal?)pt.TotalAmount) ?? 0m;

            dto.RecentCustomerJobs = customerJobs.Take(5).Select(j => new CustomerJobSummaryDto
            {
                JobId = j.JobId,
                JobType = j.JobType,
                Description = j.Description,
                Status = j.Status,
                CreatedAt = j.CreatedAt,
                ElectricianId = j.ElectricianId,
                ElectricianName = j.Electrician != null ? j.Electrician.Name : "Unassigned"
            }).ToList();
        }
        else if (user.Role == "Electrician")
        {
            var bidsCount = await _context.JobBids.CountAsync(b => b.ElectricianId == userId);
            var assignedJobs = await _context.Jobs
                .Include(j => j.Customer)
                .Where(j => j.ElectricianId == userId)
                .OrderByDescending(j => j.CreatedAt)
                .ToListAsync();

            var reviews = await _context.Reviews
                .Where(r => r.ElectricianId == userId)
                .ToListAsync();

            dto.TotalElectricianBids = bidsCount;
            dto.AssignedJobsCount = assignedJobs.Count;
            dto.CompletedElectricianJobs = assignedJobs.Count(j => j.Status == "Completed");
            dto.TotalReviewsCount = reviews.Count;
            dto.AverageRating = reviews.Count > 0 ? (double)Math.Round(reviews.Average(r => r.Rating), 1) : 0.0;

            dto.RecentAssignedJobs = assignedJobs.Take(5).Select(j => new ElectricianJobSummaryDto
            {
                JobId = j.JobId,
                JobType = j.JobType,
                Description = j.Description,
                Status = j.Status,
                CreatedAt = j.CreatedAt,
                CustomerId = j.CustomerId,
                CustomerName = j.Customer != null ? j.Customer.Name : $"Customer #{j.CustomerId}"
            }).ToList();
        }

        return dto;
    }

    public async Task<UserActionResult<UserSummaryDto>> ActivateUserAsync(int userId, int? expectedVersion, int adminUserId)
    {
        var user = await _context.Users
            .Include(u => u.ElectricianProfile)
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null)
        {
            return UserActionResult<UserSummaryDto>.NotFound($"User #{userId} was not found.");
        }

        // Concurrency token check
        if (expectedVersion.HasValue && expectedVersion.Value != user.ConcurrencyVersion)
        {
            return UserActionResult<UserSummaryDto>.Conflict(
                $"Concurrency conflict: The submitted version ({expectedVersion.Value}) does not match current version ({user.ConcurrencyVersion}). Another administrator has modified this user account. Please reload the latest details.");
        }

        // State transition check
        if (user.IsActive && user.AccountStatus == "Active")
        {
            return UserActionResult<UserSummaryDto>.Invalid($"Account for '{user.Name}' is already active.");
        }

        user.IsActive = true;
        user.AccountStatus = "Active";
        user.SuspensionReason = null;
        user.DeactivatedAt = null;
        user.SuspendedAt = null;
        user.ConcurrencyVersion++;

        try
        {
            await _context.SaveChangesAsync();
            var summary = MapToUserSummaryDto(user);
            return UserActionResult<UserSummaryDto>.Ok(summary, $"Account for '{user.Name}' ({user.Email}) has been successfully activated.");
        }
        catch (DbUpdateConcurrencyException)
        {
            return UserActionResult<UserSummaryDto>.Conflict("Concurrency conflict: The user account was updated by another administrator. Please reload to review current status.");
        }
    }

    public async Task<UserActionResult<UserSummaryDto>> DeactivateUserAsync(int userId, int? expectedVersion, int adminUserId)
    {
        var user = await _context.Users
            .Include(u => u.ElectricianProfile)
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null)
        {
            return UserActionResult<UserSummaryDto>.NotFound($"User #{userId} was not found.");
        }

        if (user.UserId == adminUserId)
        {
            return UserActionResult<UserSummaryDto>.Invalid("You cannot deactivate your own administrator account.");
        }

        // Concurrency token check
        if (expectedVersion.HasValue && expectedVersion.Value != user.ConcurrencyVersion)
        {
            return UserActionResult<UserSummaryDto>.Conflict(
                $"Concurrency conflict: The submitted version ({expectedVersion.Value}) does not match current version ({user.ConcurrencyVersion}). Another administrator has modified this user account. Please reload the latest details.");
        }

        // State transition check
        if (!user.IsActive && user.AccountStatus == "Inactive")
        {
            return UserActionResult<UserSummaryDto>.Invalid($"Account for '{user.Name}' is already deactivated.");
        }

        user.IsActive = false;
        user.AccountStatus = "Inactive";
        user.DeactivatedAt = DateTime.UtcNow;
        user.ConcurrencyVersion++;

        // If user is electrician, force offline immediately
        if (user.ElectricianProfile != null)
        {
            user.ElectricianProfile.IsOnline = false;
        }

        try
        {
            await _context.SaveChangesAsync();
            var summary = MapToUserSummaryDto(user);
            return UserActionResult<UserSummaryDto>.Ok(summary, $"Account for '{user.Name}' ({user.Email}) has been deactivated.");
        }
        catch (DbUpdateConcurrencyException)
        {
            return UserActionResult<UserSummaryDto>.Conflict("Concurrency conflict: The user account was updated by another administrator. Please reload to review current status.");
        }
    }

    public async Task<UserActionResult<UserSummaryDto>> SuspendUserAsync(int userId, string reason, int? expectedVersion, int adminUserId)
    {
        if (string.IsNullOrWhiteSpace(reason) || reason.Trim().Length < 10)
        {
            return UserActionResult<UserSummaryDto>.Invalid("A meaningful suspension explanation of at least 10 characters is mandatory.");
        }

        var user = await _context.Users
            .Include(u => u.ElectricianProfile)
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null)
        {
            return UserActionResult<UserSummaryDto>.NotFound($"User #{userId} was not found.");
        }

        if (user.UserId == adminUserId)
        {
            return UserActionResult<UserSummaryDto>.Invalid("You cannot suspend your own administrator account.");
        }

        // Concurrency token check
        if (expectedVersion.HasValue && expectedVersion.Value != user.ConcurrencyVersion)
        {
            return UserActionResult<UserSummaryDto>.Conflict(
                $"Concurrency conflict: The submitted version ({expectedVersion.Value}) does not match current version ({user.ConcurrencyVersion}). Another administrator has modified this user account. Please reload the latest details.");
        }

        // State transition check
        if (user.AccountStatus == "Suspended")
        {
            return UserActionResult<UserSummaryDto>.Invalid($"Account for '{user.Name}' is already suspended.");
        }

        user.IsActive = false;
        user.AccountStatus = "Suspended";
        user.SuspensionReason = reason.Trim();
        user.SuspendedAt = DateTime.UtcNow;
        user.ConcurrencyVersion++;

        // If user is electrician, force offline immediately
        if (user.ElectricianProfile != null)
        {
            user.ElectricianProfile.IsOnline = false;
        }

        try
        {
            await _context.SaveChangesAsync();
            var summary = MapToUserSummaryDto(user);
            return UserActionResult<UserSummaryDto>.Ok(summary, $"Account for '{user.Name}' ({user.Email}) has been suspended. Reason: {user.SuspensionReason}");
        }
        catch (DbUpdateConcurrencyException)
        {
            return UserActionResult<UserSummaryDto>.Conflict("Concurrency conflict: The user account was updated by another administrator. Please reload to review current status.");
        }
    }

    public async Task<UserActionResult<UserSummaryDto>> RestoreUserAsync(int userId, int? expectedVersion, int adminUserId)
    {
        var user = await _context.Users
            .Include(u => u.ElectricianProfile)
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null)
        {
            return UserActionResult<UserSummaryDto>.NotFound($"User #{userId} was not found.");
        }

        // Concurrency token check
        if (expectedVersion.HasValue && expectedVersion.Value != user.ConcurrencyVersion)
        {
            return UserActionResult<UserSummaryDto>.Conflict(
                $"Concurrency conflict: The submitted version ({expectedVersion.Value}) does not match current version ({user.ConcurrencyVersion}). Another administrator has modified this user account. Please reload the latest details.");
        }

        // State transition check: can only restore suspended accounts
        if (user.AccountStatus != "Suspended")
        {
            return UserActionResult<UserSummaryDto>.Invalid($"Only suspended accounts can be restored. Current account status for '{user.Name}' is '{user.AccountStatus}'.");
        }

        user.IsActive = true;
        user.AccountStatus = "Active";
        user.SuspensionReason = null;
        user.SuspendedAt = null;
        user.ConcurrencyVersion++;

        try
        {
            await _context.SaveChangesAsync();
            var summary = MapToUserSummaryDto(user);
            return UserActionResult<UserSummaryDto>.Ok(summary, $"Suspended account for '{user.Name}' ({user.Email}) has been restored to active status.");
        }
        catch (DbUpdateConcurrencyException)
        {
            return UserActionResult<UserSummaryDto>.Conflict("Concurrency conflict: The user account was updated by another administrator. Please reload to review current status.");
        }
    }

    private static UserSummaryDto MapToUserSummaryDto(User user)
    {
        return new UserSummaryDto
        {
            UserId = user.UserId,
            Name = user.Name,
            Email = user.Email,
            Phone = user.Phone,
            Role = user.Role,
            IsActive = user.IsActive,
            AccountStatus = user.AccountStatus,
            SuspensionReason = user.SuspensionReason,
            CreatedAt = user.CreatedAt,
            DeactivatedAt = user.DeactivatedAt,
            SuspendedAt = user.SuspendedAt,
            ConcurrencyVersion = user.ConcurrencyVersion,
            ElectricianProfileId = user.ElectricianProfile?.ProfileId,
            VerificationStatus = user.ElectricianProfile?.VerificationStatus,
            IsApprovedByAdmin = user.ElectricianProfile?.IsApprovedByAdmin,
            IsOnline = user.ElectricianProfile?.IsOnline,
            Specialization = user.ElectricianProfile?.Specialization,
            AppWalletBalance = user.ElectricianProfile?.AppWalletBalance
        };
    }

    // ==========================================
    // Phase 3 Task 3.3.2: Job Management Endpoints
    // ==========================================

    public async Task<AdminJobListResponseDto> GetJobsAsync(
        string? status,
        string? jobType,
        bool? isEmergency,
        string? search,
        int? customerId,
        int? electricianId,
        int page = 1,
        int pageSize = 10)
    {
        // Safe pagination boundaries
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var query = _context.Jobs
            .AsNoTracking()
            .Include(j => j.Customer)
            .Include(j => j.Electrician)
                .ThenInclude(e => e!.ElectricianProfile)
            .Include(j => j.JobBids)
            .Include(j => j.JobUsedEquipments)
            .Include(j => j.PaymentTransaction)
            .AsQueryable();

        // 1. Status Filter
        if (!string.IsNullOrWhiteSpace(status))
        {
            var trimmedStatus = status.Trim().ToLowerInvariant();
            query = query.Where(j => j.Status.ToLower() == trimmedStatus);
        }

        // 2. Job Type Filter
        if (!string.IsNullOrWhiteSpace(jobType))
        {
            var trimmedJobType = jobType.Trim().ToLowerInvariant();
            query = query.Where(j => j.JobType.ToLower() == trimmedJobType);
        }

        // 3. Emergency Filter
        if (isEmergency.HasValue)
        {
            query = query.Where(j => j.IsEmergency == isEmergency.Value);
        }

        // 4. Customer Filter
        if (customerId.HasValue && customerId.Value > 0)
        {
            query = query.Where(j => j.CustomerId == customerId.Value);
        }

        // 5. Electrician Filter
        if (electricianId.HasValue && electricianId.Value > 0)
        {
            query = query.Where(j => j.ElectricianId == electricianId.Value);
        }

        // 6. Search Filter (JobId, Description, Customer Name/Email/Phone, Electrician Name/Email/Phone)
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLowerInvariant();
            query = query.Where(j =>
                j.JobId.ToString().Contains(term) ||
                (j.Description != null && j.Description.ToLower().Contains(term)) ||
                (j.Customer != null && (
                    j.Customer.Name.ToLower().Contains(term) ||
                    j.Customer.Email.ToLower().Contains(term) ||
                    (j.Customer.Phone != null && j.Customer.Phone.ToLower().Contains(term))
                )) ||
                (j.Electrician != null && (
                    j.Electrician.Name.ToLower().Contains(term) ||
                    j.Electrician.Email.ToLower().Contains(term) ||
                    (j.Electrician.Phone != null && j.Electrician.Phone.ToLower().Contains(term))
                ))
            );
        }

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

        var items = await query
            .OrderByDescending(j => j.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(j => new AdminJobListItemDto
            {
                JobId = j.JobId,
                JobType = j.JobType,
                Description = j.Description,
                Status = j.Status,
                IsEmergency = j.IsEmergency,
                CreatedAt = j.CreatedAt,
                CompletedAt = j.CompletedAt,
                LocationLat = j.LocationLat,
                LocationLng = j.LocationLng,
                ConcurrencyVersion = j.ConcurrencyVersion,

                CustomerId = j.CustomerId,
                CustomerName = j.Customer != null ? j.Customer.Name : $"Customer #{j.CustomerId}",
                CustomerEmail = j.Customer != null ? j.Customer.Email : string.Empty,
                CustomerPhone = j.Customer != null ? j.Customer.Phone : string.Empty,

                ElectricianId = j.ElectricianId,
                ElectricianName = j.Electrician != null ? j.Electrician.Name : null,
                ElectricianEmail = j.Electrician != null ? j.Electrician.Email : null,
                ElectricianPhone = j.Electrician != null ? j.Electrician.Phone : null,
                ElectricianSpecialization = j.Electrician != null && j.Electrician.ElectricianProfile != null
                    ? j.Electrician.ElectricianProfile.Specialization
                    : null,

                BidsCount = j.JobBids.Count,
                EquipmentClaimsCount = j.JobUsedEquipments.Count,
                TotalAmount = j.PaymentTransaction != null ? (decimal?)j.PaymentTransaction.TotalAmount : null
            })
            .ToListAsync();

        return new AdminJobListResponseDto
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = totalPages
        };
    }

    public async Task<AdminJobDetailDto?> GetJobDetailAsync(int jobId)
    {
        var job = await _context.Jobs
            .AsNoTracking()
            .Include(j => j.Customer)
            .Include(j => j.Electrician)
                .ThenInclude(e => e!.ElectricianProfile)
            .Include(j => j.AssignedByAdmin)
            .Include(j => j.CancelledByUser)
            .Include(j => j.JobBids)
                .ThenInclude(b => b.Electrician)
            .Include(j => j.JobUsedEquipments)
                .ThenInclude(e => e.EquipmentCatalog)
            .Include(j => j.PaymentTransaction)
            .Include(j => j.Review)
            .FirstOrDefaultAsync(j => j.JobId == jobId);

        if (job == null)
        {
            return null;
        }

        // Compute Electrician rating if assigned
        double avgRating = 0.0;
        if (job.ElectricianId.HasValue)
        {
            var elecReviews = await _context.Reviews
                .Where(r => r.ElectricianId == job.ElectricianId.Value)
                .Select(r => r.Rating)
                .ToListAsync();

            if (elecReviews.Count > 0)
            {
                avgRating = (double)Math.Round(elecReviews.Average(), 1);
            }
        }

        return new AdminJobDetailDto
        {
            JobId = job.JobId,
            JobType = job.JobType,
            Description = job.Description,
            VoiceNoteUrl = job.VoiceNoteUrl,
            Status = job.Status,
            IsEmergency = job.IsEmergency,
            LocationLat = job.LocationLat,
            LocationLng = job.LocationLng,
            CreatedAt = job.CreatedAt,
            CompletedAt = job.CompletedAt,
            ConcurrencyVersion = job.ConcurrencyVersion,

            AssignedByAdminId = job.AssignedByAdminId,
            AssignedByAdminName = job.AssignedByAdmin?.Name,
            AssignedAt = job.AssignedAt,

            CancelledByUserId = job.CancelledByUserId,
            CancelledByUserName = job.CancelledByUser?.Name,
            CancelledAt = job.CancelledAt,
            CancellationReason = job.CancellationReason,

            DisputeReason = job.DisputeReason,
            DisputeResolvedAt = job.DisputeResolvedAt,
            DisputeResolutionNotes = job.DisputeResolutionNotes,

            Customer = new JobCustomerInfoDto
            {
                CustomerId = job.CustomerId,
                Name = job.Customer != null ? job.Customer.Name : $"Customer #{job.CustomerId}",
                Email = job.Customer != null ? job.Customer.Email : string.Empty,
                Phone = job.Customer != null ? job.Customer.Phone : string.Empty,
                Address = string.Empty,
                AccountStatus = job.Customer != null ? job.Customer.AccountStatus : "Unknown"
            },

            Electrician = job.Electrician != null ? new JobElectricianInfoDto
            {
                ElectricianId = job.Electrician.UserId,
                Name = job.Electrician.Name,
                Email = job.Electrician.Email,
                Phone = job.Electrician.Phone,
                Specialization = job.Electrician.ElectricianProfile?.Specialization ?? "General Electrician",
                VerificationStatus = job.Electrician.ElectricianProfile?.VerificationStatus ?? "Unknown",
                IsApprovedByAdmin = job.Electrician.ElectricianProfile?.IsApprovedByAdmin ?? false,
                IsOnline = job.Electrician.ElectricianProfile?.IsOnline ?? false,
                AverageRating = avgRating
            } : null,

            Bids = job.JobBids
                .OrderByDescending(b => b.SubmittedAt)
                .Select(b => new JobBidItemDto
                {
                    BidId = b.BidId,
                    ElectricianId = b.ElectricianId,
                    ElectricianName = b.Electrician != null ? b.Electrician.Name : $"Electrician #{b.ElectricianId}",
                    ElectricianPhone = b.Electrician != null ? b.Electrician.Phone : string.Empty,
                    EstimatedAmount = b.EstimatedAmount,
                    Remarks = b.Remarks,
                    SubmittedAt = b.SubmittedAt
                }).ToList(),

            EquipmentClaims = job.JobUsedEquipments
                .OrderBy(e => e.Id)
                .Select(e => new JobEquipmentClaimDto
                {
                    Id = e.Id,
                    CatalogItemId = e.CatalogItemId,
                    ItemName = e.ItemName ?? (e.EquipmentCatalog != null ? e.EquipmentCatalog.ItemName : $"Item #{e.Id}"),
                    Quantity = e.Quantity,
                    ClaimedPrice = e.ClaimedPrice,
                    StandardMarketPrice = e.EquipmentCatalog != null ? e.EquipmentCatalog.StandardMarketPrice : (decimal?)null,
                    VariancePercentage = e.VariancePercentage,
                    Status = e.Status,
                    AdminReviewNotes = e.AdminReviewNotes,
                    ReceiptAttachmentUrl = !string.IsNullOrWhiteSpace(e.ReceiptImageUrl)
                        ? $"/api/job/receipts/{e.ReceiptImageUrl}"
                        : null
                }).ToList(),

            Payment = job.PaymentTransaction != null ? new JobPaymentInfoDto
            {
                TransactionId = job.PaymentTransaction.TransactionId,
                TotalAmount = job.PaymentTransaction.TotalAmount,
                PlatformCommission = job.PaymentTransaction.PlatformCommission,
                ElectricianEarning = job.PaymentTransaction.ElectricianEarning,
                PaymentMethod = job.PaymentTransaction.PaymentMethod,
                CreatedAtUtc = job.PaymentTransaction.CreatedAtUtc
            } : null,

            Review = job.Review != null ? new JobReviewInfoDto
            {
                ReviewId = job.Review.ReviewId,
                Rating = job.Review.Rating,
                Comment = job.Review.Comment
            } : null
        };
    }

    public async Task<List<EligibleElectricianDto>> GetEligibleElectriciansAsync(int jobId)
    {
        var job = await _context.Jobs.AsNoTracking().FirstOrDefaultAsync(j => j.JobId == jobId);
        if (job == null)
        {
            return new List<EligibleElectricianDto>();
        }

        // Platform dispatch eligibility rules:
        // 1. VerificationStatus == "Approved"
        // 2. IsApprovedByAdmin == true
        // 3. IsOnline == true
        // 4. User.IsActive == true
        // 5. User.AccountStatus == "Active"
        var query = _context.ElectricianProfiles
            .AsNoTracking()
            .Include(p => p.User)
            .Where(p => p.VerificationStatus == "Approved" &&
                        p.IsApprovedByAdmin &&
                        p.IsOnline &&
                        p.User.IsActive &&
                        p.User.AccountStatus == "Active");

        var candidates = await query.ToListAsync();
        var candidateUserIds = candidates.Select(c => c.UserId).ToList();

        // Query completed jobs counts in batch
        var completedCounts = await _context.Jobs
            .Where(j => j.ElectricianId.HasValue && candidateUserIds.Contains(j.ElectricianId.Value) && j.Status == "Completed")
            .GroupBy(j => j.ElectricianId!.Value)
            .Select(g => new { ElectricianId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.ElectricianId, x => x.Count);

        // Query average ratings in batch
        var reviewsGrouped = await _context.Reviews
            .Where(r => candidateUserIds.Contains(r.ElectricianId))
            .GroupBy(r => r.ElectricianId)
            .Select(g => new { ElectricianId = g.Key, Avg = g.Average(r => r.Rating) })
            .ToDictionaryAsync(x => x.ElectricianId, x => x.Avg);

        var result = candidates.Select(c =>
        {
            double? distance = null;
            if (job.LocationLat != 0 && job.LocationLng != 0 && c.CurrentLat != 0 && c.CurrentLng != 0)
            {
                distance = Math.Round(_distanceService.CalculateDistance(
                    job.LocationLat, job.LocationLng, c.CurrentLat, c.CurrentLng), 2);
            }

            double avgRating = 0.0;
            if (reviewsGrouped.TryGetValue(c.UserId, out var ratingVal))
            {
                avgRating = (double)Math.Round(ratingVal, 1);
            }

            int completed = completedCounts.TryGetValue(c.UserId, out var countVal) ? countVal : 0;

            return new EligibleElectricianDto
            {
                UserId = c.UserId,
                ProfileId = c.ProfileId,
                Name = c.User.Name,
                Email = c.User.Email,
                Phone = c.User.Phone,
                Specialization = c.Specialization,
                VerificationStatus = c.VerificationStatus,
                IsApprovedByAdmin = c.IsApprovedByAdmin,
                IsOnline = c.IsOnline,
                CurrentLat = c.CurrentLat,
                CurrentLng = c.CurrentLng,
                DistanceKm = distance,
                AverageRating = avgRating,
                CompletedJobsCount = completed,
                AppWalletBalance = c.AppWalletBalance
            };
        })
        .OrderBy(c => c.DistanceKm ?? double.MaxValue)
        .ThenByDescending(c => c.AverageRating)
        .ToList();

        return result;
    }

    public async Task<JobOperationalSummaryDto> GetJobOperationalSummaryAsync()
    {
        var now = DateTime.UtcNow;
        var twentyFourHoursAgo = now.AddHours(-24);
        var sevenDaysAgo = now.AddDays(-7);

        var totalJobs = await _context.Jobs.CountAsync();
        var pendingJobs = await _context.Jobs.CountAsync(j => j.Status == "Pending");
        var assignedJobs = await _context.Jobs.CountAsync(j => j.Status == "Assigned");
        var inProgressJobs = await _context.Jobs.CountAsync(j => j.Status == "InProgress");
        var completedJobs = await _context.Jobs.CountAsync(j => j.Status == "Completed");
        var cancelledJobs = await _context.Jobs.CountAsync(j => j.Status == "Cancelled");
        var disputedJobs = await _context.Jobs.CountAsync(j => j.Status == "Disputed");
        var emergencyJobs = await _context.Jobs.CountAsync(j => j.IsEmergency);

        var unassignedJobs = await _context.Jobs.CountAsync(j => j.ElectricianId == null && j.Status != "Completed" && j.Status != "Cancelled");
        var unassignedEmergencyJobs = await _context.Jobs.CountAsync(j => j.IsEmergency && j.ElectricianId == null && j.Status != "Cancelled");

        // Stuck in Assigned state for > 24 hours without starting work
        var stuckAssignedJobs = await _context.Jobs.CountAsync(j =>
            j.Status == "Assigned" &&
            ((j.AssignedAt.HasValue && j.AssignedAt.Value < twentyFourHoursAgo) ||
             (!j.AssignedAt.HasValue && j.CreatedAt < twentyFourHoursAgo)));

        // In progress for > 7 days without completion
        var overdueInProgressJobs = await _context.Jobs.CountAsync(j =>
            j.Status == "InProgress" && j.CreatedAt < sevenDaysAgo);

        return new JobOperationalSummaryDto
        {
            TotalJobs = totalJobs,
            PendingJobs = pendingJobs,
            AssignedJobs = assignedJobs,
            InProgressJobs = inProgressJobs,
            CompletedJobs = completedJobs,
            CancelledJobs = cancelledJobs,
            DisputedJobs = disputedJobs,
            EmergencyJobs = emergencyJobs,
            UnassignedJobs = unassignedJobs,
            UnassignedEmergencyJobs = unassignedEmergencyJobs,
            StuckAssignedJobs = stuckAssignedJobs,
            OverdueInProgressJobs = overdueInProgressJobs
        };
    }

    // ==========================================
    // Phase 3 Task 3.3.3: Job Lifecycle Mutations
    // ==========================================

    public async Task<JobActionResult<AdminJobDetailDto>> AssignJobAsync(int jobId, AdminAssignJobDto dto, int adminUserId)
    {
        if (dto == null || dto.ElectricianId <= 0)
        {
            return JobActionResult<AdminJobDetailDto>.Invalid("Valid ElectricianId is required.");
        }

        if (dto.ConcurrencyVersion <= 0)
        {
            return JobActionResult<AdminJobDetailDto>.Invalid("ConcurrencyVersion must be specified.");
        }

        var job = await _context.Jobs.FirstOrDefaultAsync(j => j.JobId == jobId);
        if (job == null)
        {
            return JobActionResult<AdminJobDetailDto>.NotFound($"Job #{jobId} was not found.");
        }

        // State Check: Allow assignment only when the job is Pending and currently unassigned
        if (job.Status != "Pending")
        {
            return JobActionResult<AdminJobDetailDto>.Conflict($"Cannot assign Job #{jobId}: Job is currently in '{job.Status}' status. Manual assignment is only allowed for 'Pending' jobs.");
        }

        if (job.ElectricianId.HasValue)
        {
            return JobActionResult<AdminJobDetailDto>.Conflict($"Cannot assign Job #{jobId}: Job is already assigned to Electrician #{job.ElectricianId.Value}.");
        }

        // Concurrency Check
        if (job.ConcurrencyVersion != dto.ConcurrencyVersion)
        {
            return JobActionResult<AdminJobDetailDto>.Conflict($"Concurrency conflict: Job #{jobId} has been modified by another process. Current version is v{job.ConcurrencyVersion}. Please reload.");
        }

        // Electrician Eligibility Check
        var profile = await _context.ElectricianProfiles
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.UserId == dto.ElectricianId);

        if (profile == null)
        {
            return JobActionResult<AdminJobDetailDto>.Invalid($"Electrician with User ID {dto.ElectricianId} was not found.");
        }

        if (profile.VerificationStatus != "Approved")
        {
            return JobActionResult<AdminJobDetailDto>.Invalid($"Cannot assign Job #{jobId}: Electrician accreditation is '{profile.VerificationStatus}'. Only 'Approved' electricians can be assigned.");
        }

        if (!profile.IsApprovedByAdmin)
        {
            return JobActionResult<AdminJobDetailDto>.Invalid($"Cannot assign Job #{jobId}: Electrician has not been approved by administration.");
        }

        if (!profile.IsOnline)
        {
            return JobActionResult<AdminJobDetailDto>.Invalid($"Cannot assign Job #{jobId}: Electrician {profile.User.Name} is currently offline and unavailable for dispatch.");
        }

        if (!profile.User.IsActive || profile.User.AccountStatus != "Active")
        {
            return JobActionResult<AdminJobDetailDto>.Invalid($"Cannot assign Job #{jobId}: Electrician account is {profile.User.AccountStatus.ToLowerInvariant()}. Inactive or suspended technicians cannot receive assignments.");
        }

        job.ElectricianId = dto.ElectricianId;
        job.Status = "Assigned";
        job.AssignedByAdminId = adminUserId;
        job.AssignedAt = DateTime.UtcNow;
        job.ConcurrencyVersion++;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            return JobActionResult<AdminJobDetailDto>.Conflict($"Concurrency conflict: Job #{jobId} was updated simultaneously by another process. Please reload.");
        }

        var updatedDetail = await GetJobDetailAsync(jobId);
        return JobActionResult<AdminJobDetailDto>.Ok(updatedDetail!, $"Job #{jobId} successfully assigned to Electrician {profile.User.Name}.");
    }

    public async Task<JobActionResult<AdminJobDetailDto>> ReassignJobAsync(int jobId, AdminReassignJobDto dto, int adminUserId)
    {
        if (dto == null || dto.NewElectricianId <= 0)
        {
            return JobActionResult<AdminJobDetailDto>.Invalid("Valid NewElectricianId is required.");
        }

        if (string.IsNullOrWhiteSpace(dto.Reason) || dto.Reason.Trim().Length < 10)
        {
            return JobActionResult<AdminJobDetailDto>.Invalid("A mandatory reassignment reason of at least 10 characters is required.");
        }

        if (dto.ConcurrencyVersion <= 0)
        {
            return JobActionResult<AdminJobDetailDto>.Invalid("ConcurrencyVersion must be specified.");
        }

        var job = await _context.Jobs.FirstOrDefaultAsync(j => j.JobId == jobId);
        if (job == null)
        {
            return JobActionResult<AdminJobDetailDto>.NotFound($"Job #{jobId} was not found.");
        }

        // State Check: Allow reassignment only when the job is Assigned and work has not started
        if (job.Status == "InProgress")
        {
            return JobActionResult<AdminJobDetailDto>.Conflict($"Cannot reassign Job #{jobId}: Work is already in progress. Reassignment is restricted to jobs where work has not started.");
        }

        if (job.Status == "Completed" || job.Status == "Cancelled" || job.Status == "Disputed")
        {
            return JobActionResult<AdminJobDetailDto>.Conflict($"Cannot reassign Job #{jobId}: Job is in '{job.Status}' status. Reassignment is not permitted for completed, cancelled or disputed jobs.");
        }

        if (job.Status != "Assigned")
        {
            return JobActionResult<AdminJobDetailDto>.Conflict($"Cannot reassign Job #{jobId}: Job is currently in '{job.Status}' status. Reassignment is only allowed for 'Assigned' jobs.");
        }

        // Require a different eligible electrician
        if (job.ElectricianId == dto.NewElectricianId)
        {
            return JobActionResult<AdminJobDetailDto>.Invalid($"Cannot reassign Job #{jobId}: New electrician ID ({dto.NewElectricianId}) is identical to currently assigned electrician.");
        }

        // Concurrency Check
        if (job.ConcurrencyVersion != dto.ConcurrencyVersion)
        {
            return JobActionResult<AdminJobDetailDto>.Conflict($"Concurrency conflict: Job #{jobId} has been modified by another process. Current version is v{job.ConcurrencyVersion}. Please reload.");
        }

        // New Electrician Eligibility Check
        var newProfile = await _context.ElectricianProfiles
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.UserId == dto.NewElectricianId);

        if (newProfile == null)
        {
            return JobActionResult<AdminJobDetailDto>.Invalid($"Electrician with User ID {dto.NewElectricianId} was not found.");
        }

        if (newProfile.VerificationStatus != "Approved")
        {
            return JobActionResult<AdminJobDetailDto>.Invalid($"Cannot reassign Job #{jobId}: Electrician accreditation is '{newProfile.VerificationStatus}'. Only 'Approved' electricians can be assigned.");
        }

        if (!newProfile.IsApprovedByAdmin)
        {
            return JobActionResult<AdminJobDetailDto>.Invalid($"Cannot reassign Job #{jobId}: Electrician has not been approved by administration.");
        }

        if (!newProfile.IsOnline)
        {
            return JobActionResult<AdminJobDetailDto>.Invalid($"Cannot reassign Job #{jobId}: Electrician {newProfile.User.Name} is currently offline and unavailable for dispatch.");
        }

        if (!newProfile.User.IsActive || newProfile.User.AccountStatus != "Active")
        {
            return JobActionResult<AdminJobDetailDto>.Invalid($"Cannot reassign Job #{jobId}: Electrician account is {newProfile.User.AccountStatus.ToLowerInvariant()}. Inactive or suspended technicians cannot receive assignments.");
        }

        job.ElectricianId = dto.NewElectricianId;
        job.AssignedByAdminId = adminUserId;
        job.AssignedAt = DateTime.UtcNow;
        job.ConcurrencyVersion++;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            return JobActionResult<AdminJobDetailDto>.Conflict($"Concurrency conflict: Job #{jobId} was updated simultaneously by another process. Please reload.");
        }

        var updatedDetail = await GetJobDetailAsync(jobId);
        return JobActionResult<AdminJobDetailDto>.Ok(updatedDetail!, $"Job #{jobId} successfully reassigned to Electrician {newProfile.User.Name}.");
    }

    public async Task<JobActionResult<AdminJobDetailDto>> CancelJobAsync(int jobId, AdminCancelJobDto dto, int adminUserId)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.Reason) || dto.Reason.Trim().Length < 10)
        {
            return JobActionResult<AdminJobDetailDto>.Invalid("A mandatory cancellation reason of at least 10 characters is required.");
        }

        if (dto.ConcurrencyVersion <= 0)
        {
            return JobActionResult<AdminJobDetailDto>.Invalid("ConcurrencyVersion must be specified.");
        }

        var job = await _context.Jobs.FirstOrDefaultAsync(j => j.JobId == jobId);
        if (job == null)
        {
            return JobActionResult<AdminJobDetailDto>.NotFound($"Job #{jobId} was not found.");
        }

        // Duplicate action check
        if (job.Status == "Cancelled")
        {
            return JobActionResult<AdminJobDetailDto>.Conflict($"Duplicate action: Job #{jobId} is already cancelled.");
        }

        if (job.Status == "Completed")
        {
            return JobActionResult<AdminJobDetailDto>.Conflict($"Cannot cancel Job #{jobId}: Job is already marked as 'Completed'. Completed jobs cannot be cancelled.");
        }

        // Restrict cancellation to safe lifecycle states, initially Pending and Assigned
        if (job.Status != "Pending" && job.Status != "Assigned")
        {
            return JobActionResult<AdminJobDetailDto>.Conflict($"Cannot cancel Job #{jobId}: Job is currently in '{job.Status}' status. Administrative cancellation is restricted to 'Pending' or 'Assigned' lifecycle states.");
        }

        // Financial safety check: Never automatically refund, settle, reverse commission, modify wallet balances or delete payment records.
        // If an existing payment state makes cancellation unsafe or ambiguous, reject the operation.
        var payment = await _context.PaymentTransactions.FirstOrDefaultAsync(pt => pt.JobId == jobId);
        if (payment != null)
        {
            return JobActionResult<AdminJobDetailDto>.Invalid($"Cannot cancel Job #{jobId}: A payment transaction (#{payment.TransactionId}) has already been recorded for this job. Administrative cancellation cannot modify or reverse financial transactions automatically. Please resolve through formal financial audit.");
        }

        // Concurrency Check
        if (job.ConcurrencyVersion != dto.ConcurrencyVersion)
        {
            return JobActionResult<AdminJobDetailDto>.Conflict($"Concurrency conflict: Job #{jobId} has been modified by another process. Current version is v{job.ConcurrencyVersion}. Please reload.");
        }

        job.Status = "Cancelled";
        job.CancelledAt = DateTime.UtcNow;
        job.CancelledByUserId = adminUserId;
        job.CancellationReason = dto.Reason.Trim();
        job.ConcurrencyVersion++;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            return JobActionResult<AdminJobDetailDto>.Conflict($"Concurrency conflict: Job #{jobId} was updated simultaneously by another process. Please reload.");
        }

        var updatedDetail = await GetJobDetailAsync(jobId);
        return JobActionResult<AdminJobDetailDto>.Ok(updatedDetail!, $"Job #{jobId} successfully cancelled.");
    }

    public async Task<JobActionResult<AdminJobDetailDto>> ResolveDisputeAsync(int jobId, AdminResolveDisputeDto dto, int adminUserId)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.ResolutionNotes) || dto.ResolutionNotes.Trim().Length < 10)
        {
            return JobActionResult<AdminJobDetailDto>.Invalid("A mandatory resolution explanation of at least 10 characters is required.");
        }

        if (dto.ConcurrencyVersion <= 0)
        {
            return JobActionResult<AdminJobDetailDto>.Invalid("ConcurrencyVersion must be specified.");
        }

        var job = await _context.Jobs.FirstOrDefaultAsync(j => j.JobId == jobId);
        if (job == null)
        {
            return JobActionResult<AdminJobDetailDto>.NotFound($"Job #{jobId} was not found.");
        }

        // Require an existing Disputed job
        if (job.Status != "Disputed")
        {
            return JobActionResult<AdminJobDetailDto>.Conflict($"Cannot resolve dispute for Job #{jobId}: Job is currently in '{job.Status}' status. Dispute resolution requires a job in 'Disputed' status.");
        }

        // Prevent resolving an already-resolved dispute
        if (job.DisputeResolvedAt.HasValue)
        {
            return JobActionResult<AdminJobDetailDto>.Conflict($"Duplicate action: Dispute for Job #{jobId} has already been resolved on {job.DisputeResolvedAt.Value:u}.");
        }

        // Concurrency Check
        if (job.ConcurrencyVersion != dto.ConcurrencyVersion)
        {
            return JobActionResult<AdminJobDetailDto>.Conflict($"Concurrency conflict: Job #{jobId} has been modified by another process. Current version is v{job.ConcurrencyVersion}. Please reload.");
        }

        // Preserve Status = Disputed as the historical indication that the job entered dispute;
        // use DisputeResolvedAt to indicate that the dispute was resolved.
        job.DisputeResolvedAt = DateTime.UtcNow;
        job.DisputeResolutionNotes = dto.ResolutionNotes.Trim();
        job.ConcurrencyVersion++;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            return JobActionResult<AdminJobDetailDto>.Conflict($"Concurrency conflict: Job #{jobId} was updated simultaneously by another process. Please reload.");
        }

        var updatedDetail = await GetJobDetailAsync(jobId);
        return JobActionResult<AdminJobDetailDto>.Ok(updatedDetail!, $"Dispute for Job #{jobId} successfully resolved and recorded.");
    }
}