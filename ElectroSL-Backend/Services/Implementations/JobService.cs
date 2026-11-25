using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using ElectroSL_Backend.Data;
using ElectroSL_Backend.DTOs.Job;
using ElectroSL_Backend.Models;
using ElectroSL_Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ElectroSL_Backend.Services.Implementations;

public class JobService : IJobService
{
    private readonly ElectroSLDbContext _context;
    private readonly IDocumentStorageService _documentStorageService;

    public JobService(ElectroSLDbContext context, IDocumentStorageService documentStorageService)
    {
        _context = context;
        _documentStorageService = documentStorageService;
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

    public async Task<bool> ApproveEquipmentListAsync(
        int jobId,
        EquipmentListDto equipment)
    {
        if (equipment?.Items == null || equipment.Items.Count == 0)
        {
            return true;
        }

        foreach (var item in equipment.Items)
        {
            var catalogItem = await _context.EquipmentCatalog.FirstOrDefaultAsync(c => c.ItemId == item.CatalogItemId);
            if (catalogItem != null)
            {
                var (isFlagged, variance, threshold) = EvaluatePriceVariance(
                    catalogItem.StandardMarketPrice, 
                    item.ClaimedPrice, 
                    catalogItem.PriceVarianceThreshold);
            }
        }

        return true;
    }

    public async Task<EquipmentClaimSubmissionResult> SubmitEquipmentClaimsAsync(
        int jobId, 
        List<EquipmentItemDto> items, 
        int electricianUserId)
    {
        if (items == null || items.Count == 0)
        {
            return EquipmentClaimSubmissionResult.Invalid("No equipment items were provided in the claim submission.");
        }

        // 1. Basic validation of item fields
        foreach (var item in items)
        {
            if (item.Quantity <= 0)
            {
                return EquipmentClaimSubmissionResult.Invalid($"Quantity for catalog item #{item.CatalogItemId} must be at least 1.");
            }

            if (item.ClaimedPrice <= 0)
            {
                return EquipmentClaimSubmissionResult.Invalid($"Claimed price for catalog item #{item.CatalogItemId} must be greater than zero.");
            }
        }

        // 2. Prevent duplicate catalog items within the same submission payload
        var duplicatesInPayload = items
            .GroupBy(i => i.CatalogItemId)
            .Where(g => g.Count() > 1)
            .Select(g => g.Key)
            .ToList();

        if (duplicatesInPayload.Count > 0)
        {
            return EquipmentClaimSubmissionResult.Duplicate(
                $"Duplicate catalog item #{duplicatesInPayload[0]} found in submission. Please combine quantities into a single claim line.");
        }

        // 3. Verify Job exists
        var job = await _context.Jobs.FirstOrDefaultAsync(j => j.JobId == jobId);
        if (job == null)
        {
            return EquipmentClaimSubmissionResult.NotFound($"Job #{jobId} was not found.");
        }

        // 4. Verify job assignment and electrician ownership from claims
        if (!job.ElectricianId.HasValue || job.ElectricianId.Value != electricianUserId)
        {
            return EquipmentClaimSubmissionResult.Forbidden(
                $"You are not authorized to submit equipment claims for Job #{jobId}. Only the assigned electrician can submit equipment claims.");
        }

        // 5. Verify electrician is approved and not revoked, and user account is active
        var electricianProfile = await _context.ElectricianProfiles
            .FirstOrDefaultAsync(p => p.UserId == electricianUserId);

        if (electricianProfile == null || electricianProfile.VerificationStatus != "Approved" || !electricianProfile.IsApprovedByAdmin)
        {
            return EquipmentClaimSubmissionResult.Forbidden(
                "Your electrician profile is not verified or your accreditation has been revoked. Revoked or unverified electricians cannot submit equipment claims.");
        }

        var electricianUser = await _context.Users.FirstOrDefaultAsync(u => u.UserId == electricianUserId);
        if (electricianUser == null || !electricianUser.IsActive || electricianUser.AccountStatus != "Active")
        {
            return EquipmentClaimSubmissionResult.Forbidden(
                $"Your account is {electricianUser?.AccountStatus?.ToLowerInvariant() ?? "inactive"}. Suspended or inactive electricians cannot submit equipment claims.");
        }

        // 6. Application-level check: Prevent duplicate claims for the same catalog item on this job
        var existingClaimedItemIds = await _context.JobUsedEquipments
            .Where(e => e.JobId == jobId && e.CatalogItemId.HasValue)
            .Select(e => e.CatalogItemId!.Value)
            .ToListAsync();

        var existingConflict = items.FirstOrDefault(i => existingClaimedItemIds.Contains(i.CatalogItemId));
        if (existingConflict != null)
        {
            return EquipmentClaimSubmissionResult.Duplicate(
                $"An equipment claim for catalog item #{existingConflict.CatalogItemId} has already been submitted for Job #{jobId}. Duplicate claims are not permitted.");
        }

        // 7. Verify all catalog items exist and are active
        var catalogItemIds = items.Select(i => i.CatalogItemId).Distinct().ToList();
        var catalogItems = await _context.EquipmentCatalog
            .Where(c => catalogItemIds.Contains(c.ItemId))
            .ToDictionaryAsync(c => c.ItemId);

        foreach (var item in items)
        {
            if (!catalogItems.TryGetValue(item.CatalogItemId, out var catalogItem))
            {
                return EquipmentClaimSubmissionResult.Invalid(
                    $"Catalog item #{item.CatalogItemId} does not exist in the equipment baseline catalog.");
            }

            if (!catalogItem.IsActive)
            {
                return EquipmentClaimSubmissionResult.Invalid(
                    $"Catalog item '{catalogItem.ItemName}' (#{catalogItem.ItemId}) is currently inactive and cannot be selected for jobs.");
            }
        }

        // 8. Automatic Price Verification against item-configured threshold
        var newClaims = new List<JobUsedEquipment>();
        foreach (var item in items)
        {
            var catalogItem = catalogItems[item.CatalogItemId];
            var (isFlagged, variancePercentage, _) = EvaluatePriceVariance(
                catalogItem.StandardMarketPrice,
                item.ClaimedPrice,
                catalogItem.PriceVarianceThreshold);

            // AutoApproved if within threshold; FlaggedForReview if exceeding threshold
            string status = isFlagged ? "FlaggedForReview" : "AutoApproved";

            var claim = new JobUsedEquipment
            {
                JobId = jobId,
                CatalogItemId = catalogItem.ItemId,
                ItemName = catalogItem.ItemName,
                ClaimedPrice = item.ClaimedPrice,
                Quantity = item.Quantity,
                VariancePercentage = variancePercentage,
                ReceiptImageUrl = item.ReceiptImageUrl?.Trim() ?? string.Empty,
                Status = status,
                AdminReviewNotes = null,
                ReviewedByAdminId = null,
                ReviewedAt = null
            };

            newClaims.Add(claim);
        }

        // 9. Atomic Transaction Save with Database-Level Duplicate Handling
        using var tx = await _context.Database.BeginTransactionAsync();
        try
        {
            _context.JobUsedEquipments.AddRange(newClaims);
            await _context.SaveChangesAsync();
            await tx.CommitAsync();
        }
        catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
        {
            await tx.RollbackAsync();
            return EquipmentClaimSubmissionResult.Duplicate(
                "A duplicate equipment claim for this catalog item was submitted simultaneously for this job. The database rejected the duplicate record.");
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }

        // 10. Map response DTOs
        var responseDtos = newClaims.Select(c =>
        {
            var cat = catalogItems[c.CatalogItemId!.Value];
            return new EquipmentClaimResponseDto
            {
                Id = c.Id,
                JobId = c.JobId,
                CatalogItemId = c.CatalogItemId,
                ItemName = c.ItemName,
                Quantity = c.Quantity,
                ClaimedPrice = c.ClaimedPrice,
                StandardMarketPrice = cat.StandardMarketPrice,
                PriceVarianceThreshold = cat.PriceVarianceThreshold,
                VariancePercentage = c.VariancePercentage,
                Status = c.Status,
                ReceiptImageUrl = c.ReceiptImageUrl
            };
        }).ToList();

        int autoApprovedCount = responseDtos.Count(r => r.Status == "AutoApproved");
        int flaggedCount = responseDtos.Count(r => r.Status == "FlaggedForReview");

        return EquipmentClaimSubmissionResult.Ok(
            responseDtos, 
            $"Successfully submitted {responseDtos.Count} equipment claim(s): {autoApprovedCount} AutoApproved, {flaggedCount} FlaggedForReview.");
    }

    public async Task<EquipmentClaimSubmissionResult> SubmitSingleClaimWithReceiptAsync(
        int jobId, 
        SubmitSingleClaimFormDto formDto, 
        int electricianUserId)
    {
        string? savedReceiptFileName = null;

        if (formDto.ReceiptImage != null && formDto.ReceiptImage.Length > 0)
        {
            try
            {
                savedReceiptFileName = await _documentStorageService.SaveDocumentAsync(formDto.ReceiptImage, "receipt");
            }
            catch (Exception ex)
            {
                return EquipmentClaimSubmissionResult.Invalid($"Receipt upload validation failed: {ex.Message}");
            }
        }

        var itemDto = new EquipmentItemDto
        {
            CatalogItemId = formDto.CatalogItemId,
            Quantity = formDto.Quantity,
            ClaimedPrice = formDto.ClaimedPrice,
            ReceiptImageUrl = savedReceiptFileName
        };

        var result = await SubmitEquipmentClaimsAsync(jobId, new List<EquipmentItemDto> { itemDto }, electricianUserId);

        // If claim submission failed, delete uploaded receipt file to avoid orphaned storage files
        if (result.Status != ClaimSubmissionStatus.Success && !string.IsNullOrWhiteSpace(savedReceiptFileName))
        {
            _documentStorageService.DeleteDocument(savedReceiptFileName);
        }

        return result;
    }

    public async Task<EquipmentClaimQueryResult> GetJobEquipmentClaimsAsync(int jobId, int currentUserId, string userRole)
    {
        var job = await _context.Jobs.FirstOrDefaultAsync(j => j.JobId == jobId);
        if (job == null)
        {
            return EquipmentClaimQueryResult.NotFound($"Job #{jobId} was not found.");
        }

        // Authorization:
        // Admin: permitted
        // Electrician: permitted only if assigned to this job
        // Customer: permitted only if they own this job
        bool isAdmin = string.Equals(userRole, "Admin", StringComparison.OrdinalIgnoreCase);
        bool isAssignedElectrician = job.ElectricianId.HasValue && job.ElectricianId.Value == currentUserId;
        bool isJobCustomer = job.CustomerId == currentUserId;

        if (!isAdmin && !isAssignedElectrician && !isJobCustomer)
        {
            return EquipmentClaimQueryResult.Forbidden(
                "You are not authorized to view equipment claims for this job. Access is restricted to the assigned electrician, the job customer, and administrators.");
        }

        var claims = await _context.JobUsedEquipments
            .Include(e => e.EquipmentCatalog)
            .Where(e => e.JobId == jobId)
            .OrderBy(e => e.Id)
            .ToListAsync();

        var responseDtos = claims.Select(c => new EquipmentClaimResponseDto
        {
            Id = c.Id,
            JobId = c.JobId,
            CatalogItemId = c.CatalogItemId,
            ItemName = c.ItemName,
            Quantity = c.Quantity,
            ClaimedPrice = c.ClaimedPrice,
            StandardMarketPrice = c.EquipmentCatalog?.StandardMarketPrice ?? 0m,
            PriceVarianceThreshold = c.EquipmentCatalog?.PriceVarianceThreshold ?? 5.00m,
            VariancePercentage = c.VariancePercentage,
            Status = c.Status,
            ReceiptImageUrl = c.ReceiptImageUrl
        }).ToList();

        return EquipmentClaimQueryResult.Ok(responseDtos);
    }

    public async Task<ReceiptAuthorizationResult> GetAuthorizedReceiptStreamAsync(string fileName, int currentUserId, string userRole)
    {
        if (string.IsNullOrWhiteSpace(fileName))
        {
            return ReceiptAuthorizationResult.NotFound("Receipt file name must be provided.");
        }

        var cleanFileName = Path.GetFileName(fileName.Trim());

        // Verify the requested receipt belongs to an actual equipment claim and load the associated job
        var claim = await _context.JobUsedEquipments
            .Include(e => e.Job)
            .FirstOrDefaultAsync(e => e.ReceiptImageUrl == cleanFileName);

        if (claim == null || claim.Job == null)
        {
            return ReceiptAuthorizationResult.NotFound(
                $"Receipt file '{cleanFileName}' is not associated with any recorded equipment claim.");
        }

        // Authorization check: Admin, assigned Electrician, or Customer
        bool isAdmin = string.Equals(userRole, "Admin", StringComparison.OrdinalIgnoreCase);
        bool isAssignedElectrician = claim.Job.ElectricianId.HasValue && claim.Job.ElectricianId.Value == currentUserId;
        bool isJobCustomer = claim.Job.CustomerId == currentUserId;

        if (!isAdmin && !isAssignedElectrician && !isJobCustomer)
        {
            return ReceiptAuthorizationResult.Forbidden(
                "You are not authorized to view or download this receipt file. Access is restricted to the assigned electrician, customer, and administrators.");
        }

        var doc = _documentStorageService.GetDocumentStream(cleanFileName);
        if (doc == null)
        {
            return ReceiptAuthorizationResult.NotFound($"Receipt file '{cleanFileName}' was not found in secure storage.");
        }

        return ReceiptAuthorizationResult.Ok(doc.Value.Stream, doc.Value.ContentType, doc.Value.FileName);
    }

    public static (bool IsFlagged, decimal VariancePercentage, decimal Threshold) EvaluatePriceVariance(
        decimal standardMarketPrice, 
        decimal claimedPrice, 
        decimal itemThreshold)
    {
        if (standardMarketPrice <= 0)
        {
            return (false, 0m, itemThreshold > 0 ? itemThreshold : 5.00m);
        }

        decimal threshold = itemThreshold > 0 ? itemThreshold : 5.00m;
        decimal variancePercentage = Math.Round(((claimedPrice - standardMarketPrice) / standardMarketPrice) * 100m, 2);
        bool isFlagged = Math.Abs(variancePercentage) > threshold;

        return (isFlagged, variancePercentage, threshold);
    }

    private static bool IsUniqueConstraintViolation(DbUpdateException ex)
    {
        var message = ex.InnerException?.Message ?? ex.Message;
        return message.Contains("Duplicate", StringComparison.OrdinalIgnoreCase) ||
               message.Contains("UNIQUE", StringComparison.OrdinalIgnoreCase) ||
               message.Contains("IX_JobUsedEquipments_JobId_CatalogItemId", StringComparison.OrdinalIgnoreCase) ||
               message.Contains("1062");
    }
}
