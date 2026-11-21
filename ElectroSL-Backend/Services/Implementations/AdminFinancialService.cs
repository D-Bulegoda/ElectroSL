using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using ElectroSL_Backend.Data;
using ElectroSL_Backend.DTOs.Admin;
using ElectroSL_Backend.Models;
using ElectroSL_Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace ElectroSL_Backend.Services.Implementations;

public class AdminFinancialService : IAdminFinancialService
{
    private readonly ElectroSLDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AdminFinancialService> _logger;
    private readonly IAdminAuditService _auditService;

    public AdminFinancialService(
        ElectroSLDbContext context,
        IConfiguration configuration,
        ILogger<AdminFinancialService> logger,
        IAdminAuditService auditService)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
        _auditService = auditService;
    }

    public async Task<AdminFinancialSummaryDto> GetFinancialSummaryAsync(CancellationToken cancellationToken = default)
    {
        // 1. Payment transactions metrics
        var paymentTransactions = await _context.PaymentTransactions
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        decimal totalGrossJobValue = paymentTransactions.Sum(pt => pt.TotalAmount);
        decimal totalPlatformCommission = paymentTransactions.Sum(pt => pt.PlatformCommission);
        decimal totalElectricianEarnings = paymentTransactions.Sum(pt => pt.ElectricianEarning);

        // Separate CashSplit vs Digital accounting
        // CashSplit: customer pays 15% online to ElectroSL; 85% is paid directly in cash to electrician.
        // Digital: customer pays 100% online to ElectroSL.
        var cashSplitTxs = paymentTransactions
            .Where(pt => string.Equals(pt.PaymentMethod, "CashSplit", StringComparison.OrdinalIgnoreCase) ||
                         string.Equals(pt.PaymentMethod, "Cash", StringComparison.OrdinalIgnoreCase))
            .ToList();

        var digitalTxs = paymentTransactions
            .Where(pt => !string.Equals(pt.PaymentMethod, "CashSplit", StringComparison.OrdinalIgnoreCase) &&
                         !string.Equals(pt.PaymentMethod, "Cash", StringComparison.OrdinalIgnoreCase))
            .ToList();

        decimal totalCollectedOnline = digitalTxs.Sum(pt => pt.TotalAmount) + cashSplitTxs.Sum(pt => pt.PlatformCommission);
        decimal totalDirectCash = cashSplitTxs.Sum(pt => pt.ElectricianEarning);

        // 2. Active wallet liabilities (sum of all technician balances)
        decimal outstandingWalletLiability = await _context.ElectricianProfiles
            .AsNoTracking()
            .SumAsync(ep => (decimal?)ep.AppWalletBalance, cancellationToken) ?? 0.00m;

        int positiveBalanceCount = await _context.ElectricianProfiles
            .AsNoTracking()
            .CountAsync(ep => ep.AppWalletBalance > 0, cancellationToken);

        int totalTechnicians = await _context.ElectricianProfiles
            .AsNoTracking()
            .CountAsync(cancellationToken);

        // 3. Payout statistics
        decimal totalRecordedPayouts = await _context.TechnicianPayoutRecords
            .AsNoTracking()
            .SumAsync(pr => (decimal?)pr.Amount, cancellationToken) ?? 0.00m;

        decimal totalReversedPayouts = await _context.WalletTransactions
            .AsNoTracking()
            .Where(wt => wt.TransactionType == WalletTransactionType.PayoutReversal)
            .SumAsync(wt => (decimal?)wt.Amount, cancellationToken) ?? 0.00m;

        decimal netDisbursedPayouts = totalRecordedPayouts - totalReversedPayouts;

        // 4. Manual adjustments statistics
        decimal totalAdjustmentsCredit = await _context.WalletTransactions
            .AsNoTracking()
            .Where(wt => wt.TransactionType == WalletTransactionType.AdminAdjustmentCredit)
            .SumAsync(wt => (decimal?)wt.Amount, cancellationToken) ?? 0.00m;

        decimal totalAdjustmentsDebit = await _context.WalletTransactions
            .AsNoTracking()
            .Where(wt => wt.TransactionType == WalletTransactionType.AdminAdjustmentDebit)
            .SumAsync(wt => (decimal?)Math.Abs(wt.Amount), cancellationToken) ?? 0.00m;

        int totalWalletLedgerCount = await _context.WalletTransactions
            .AsNoTracking()
            .CountAsync(cancellationToken);

        return new AdminFinancialSummaryDto
        {
            TotalGrossJobValue = totalGrossJobValue,
            TotalCollectedOnline = totalCollectedOnline,
            TotalDirectCashToElectricians = totalDirectCash,
            TotalPlatformCommission = totalPlatformCommission,
            TotalElectricianEarnings = totalElectricianEarnings,
            OutstandingWalletLiability = outstandingWalletLiability,
            TotalRecordedPayouts = totalRecordedPayouts,
            TotalReversedPayouts = totalReversedPayouts,
            NetDisbursedPayouts = netDisbursedPayouts,
            TotalAdjustmentsCredit = totalAdjustmentsCredit,
            TotalAdjustmentsDebit = totalAdjustmentsDebit,
            TechniciansWithPositiveBalanceCount = positiveBalanceCount,
            TotalTechnicianCount = totalTechnicians,
            TotalPaymentTransactionsCount = paymentTransactions.Count,
            TotalWalletLedgerTransactionsCount = totalWalletLedgerCount
        };
    }

    public async Task<PaginatedFinancialResponse<AdminWalletTransactionDto>> GetTransactionsAsync(
        FinancialLedgerFilterDto filter,
        CancellationToken cancellationToken = default)
    {
        int page = filter.Page < 1 ? 1 : filter.Page;
        int pageSize = filter.PageSize < 1 ? 20 : (filter.PageSize > 100 ? 100 : filter.PageSize);

        var query = _context.WalletTransactions
            .AsNoTracking()
            .Include(wt => wt.ElectricianProfile)
                .ThenInclude(ep => ep.User)
            .Include(wt => wt.InitiatedByAdmin)
            .AsQueryable();

        if (filter.ElectricianProfileId.HasValue)
        {
            query = query.Where(wt => wt.ElectricianProfileId == filter.ElectricianProfileId.Value);
        }

        if (filter.TransactionType.HasValue)
        {
            query = query.Where(wt => wt.TransactionType == filter.TransactionType.Value);
        }

        if (filter.StartDateUtc.HasValue)
        {
            query = query.Where(wt => wt.CreatedAtUtc >= filter.StartDateUtc.Value);
        }

        if (filter.EndDateUtc.HasValue)
        {
            query = query.Where(wt => wt.CreatedAtUtc <= filter.EndDateUtc.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.SearchQuery))
        {
            string search = filter.SearchQuery.Trim().ToLower();
            query = query.Where(wt =>
                wt.Description.ToLower().Contains(search) ||
                (wt.ExternalReferenceNumber != null && wt.ExternalReferenceNumber.ToLower().Contains(search)) ||
                wt.ElectricianProfile.User.Name.ToLower().Contains(search) ||
                wt.ElectricianProfile.User.Email.ToLower().Contains(search));
        }

        int totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(wt => wt.CreatedAtUtc)
            .ThenByDescending(wt => wt.TransactionId)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(wt => new AdminWalletTransactionDto
            {
                TransactionId = wt.TransactionId,
                ElectricianProfileId = wt.ElectricianProfileId,
                ElectricianName = wt.ElectricianProfile.User.Name,
                ElectricianEmail = wt.ElectricianProfile.User.Email,
                JobId = wt.JobId,
                PaymentTransactionId = wt.PaymentTransactionId,
                PayoutRecordId = wt.PayoutRecordId,
                Amount = wt.Amount,
                BalanceBefore = wt.BalanceBefore,
                BalanceAfter = wt.BalanceAfter,
                TransactionType = wt.TransactionType,
                TransactionTypeName = wt.TransactionType.ToString(),
                Description = wt.Description,
                InitiatedByAdminId = wt.InitiatedByAdminId,
                InitiatedByAdminName = wt.InitiatedByAdmin != null ? wt.InitiatedByAdmin.Name : null,
                ExternalReferenceNumber = wt.ExternalReferenceNumber,
                CreatedAtUtc = wt.CreatedAtUtc
            })
            .ToListAsync(cancellationToken);

        return new PaginatedFinancialResponse<AdminWalletTransactionDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<TechnicianWalletDetailDto?> GetTechnicianWalletAsync(
        int profileId,
        CancellationToken cancellationToken = default)
    {
        var profile = await _context.ElectricianProfiles
            .AsNoTracking()
            .Include(ep => ep.User)
            .FirstOrDefaultAsync(ep => ep.ProfileId == profileId, cancellationToken);

        if (profile == null)
            return null;

        var transactions = await _context.WalletTransactions
            .AsNoTracking()
            .Include(wt => wt.InitiatedByAdmin)
            .Where(wt => wt.ElectricianProfileId == profileId)
            .OrderByDescending(wt => wt.CreatedAtUtc)
            .ThenByDescending(wt => wt.TransactionId)
            .ToListAsync(cancellationToken);

        var payouts = await _context.TechnicianPayoutRecords
            .AsNoTracking()
            .Include(pr => pr.RecordedByAdmin)
            .Where(pr => pr.ElectricianProfileId == profileId)
            .OrderByDescending(pr => pr.DisbursedAtUtc)
            .ToListAsync(cancellationToken);

        // Find which payouts have compensating reversals
        var reversedPayoutIds = transactions
            .Where(wt => wt.TransactionType == WalletTransactionType.PayoutReversal && wt.PayoutRecordId.HasValue)
            .Select(wt => wt.PayoutRecordId!.Value)
            .ToHashSet();

        var reversalLookup = transactions
            .Where(wt => wt.TransactionType == WalletTransactionType.PayoutReversal && wt.PayoutRecordId.HasValue)
            .ToDictionary(wt => wt.PayoutRecordId!.Value, wt => new { wt.CreatedAtUtc, wt.Description, wt.TransactionId });

        decimal lifetimeDigitalEarnings = transactions
            .Where(wt => wt.TransactionType == WalletTransactionType.DigitalJobEarning)
            .Sum(wt => wt.Amount);

        decimal lifetimeGrossPayouts = payouts.Sum(pr => pr.Amount);
        decimal lifetimeReversedPayouts = transactions
            .Where(wt => wt.TransactionType == WalletTransactionType.PayoutReversal)
            .Sum(wt => wt.Amount);

        decimal lifetimeNetPayouts = lifetimeGrossPayouts - lifetimeReversedPayouts;

        decimal lifetimeAdjustmentsCredit = transactions
            .Where(wt => wt.TransactionType == WalletTransactionType.AdminAdjustmentCredit)
            .Sum(wt => wt.Amount);

        decimal lifetimeAdjustmentsDebit = transactions
            .Where(wt => wt.TransactionType == WalletTransactionType.AdminAdjustmentDebit)
            .Sum(wt => Math.Abs(wt.Amount));

        var recentTxDtos = transactions.Take(20).Select(wt => new AdminWalletTransactionDto
        {
            TransactionId = wt.TransactionId,
            ElectricianProfileId = wt.ElectricianProfileId,
            ElectricianName = profile.User.Name,
            ElectricianEmail = profile.User.Email,
            JobId = wt.JobId,
            PaymentTransactionId = wt.PaymentTransactionId,
            PayoutRecordId = wt.PayoutRecordId,
            Amount = wt.Amount,
            BalanceBefore = wt.BalanceBefore,
            BalanceAfter = wt.BalanceAfter,
            TransactionType = wt.TransactionType,
            TransactionTypeName = wt.TransactionType.ToString(),
            Description = wt.Description,
            InitiatedByAdminId = wt.InitiatedByAdminId,
            InitiatedByAdminName = wt.InitiatedByAdmin != null ? wt.InitiatedByAdmin.Name : null,
            ExternalReferenceNumber = wt.ExternalReferenceNumber,
            CreatedAtUtc = wt.CreatedAtUtc
        }).ToList();

        var recentPayoutDtos = payouts.Take(20).Select(pr =>
        {
            bool isReversed = reversedPayoutIds.Contains(pr.PayoutId);
            reversalLookup.TryGetValue(pr.PayoutId, out var revInfo);

            return new TechnicianPayoutRecordDto
            {
                PayoutId = pr.PayoutId,
                ElectricianProfileId = pr.ElectricianProfileId,
                Amount = pr.Amount,
                BankName = pr.BankName,
                AccountNumberMasked = pr.AccountNumberMasked,
                BankTransferReference = pr.BankTransferReference,
                RecordedByAdminId = pr.RecordedByAdminId,
                RecordedByAdminName = pr.RecordedByAdmin.Name,
                DisbursedAtUtc = pr.DisbursedAtUtc,
                AdminNotes = pr.AdminNotes,
                IsReversed = isReversed,
                ReversedAtUtc = revInfo?.CreatedAtUtc,
                ReversalReason = revInfo?.Description,
                ReversalTransactionId = revInfo?.TransactionId
            };
        }).ToList();

        return new TechnicianWalletDetailDto
        {
            ProfileId = profile.ProfileId,
            UserId = profile.UserId,
            Name = profile.User.Name,
            Email = profile.User.Email,
            Phone = profile.User.Phone,
            Specialization = profile.Specialization ?? "General Electrician",
            VerificationStatus = profile.VerificationStatus,
            IsApprovedByAdmin = profile.IsApprovedByAdmin,
            IsOnline = profile.IsOnline,
            CurrentWalletBalance = profile.AppWalletBalance,
            LifetimeDigitalEarnings = lifetimeDigitalEarnings,
            LifetimeGrossPayouts = lifetimeGrossPayouts,
            LifetimeReversedPayouts = lifetimeReversedPayouts,
            LifetimeNetPayouts = lifetimeNetPayouts,
            LifetimeAdjustmentsCredit = lifetimeAdjustmentsCredit,
            LifetimeAdjustmentsDebit = lifetimeAdjustmentsDebit,
            TotalTransactionsCount = transactions.Count,
            RecentTransactions = recentTxDtos,
            RecentPayouts = recentPayoutDtos
        };
    }

    public async Task<PayoutActionResultDto> RecordPayoutAsync(
        RecordPayoutRequestDto dto,
        int adminUserId,
        CancellationToken cancellationToken = default)
    {
        // 1. Mandatory explicit confirmation check
        if (!dto.ConfirmBankTransferCompleted)
        {
            return new PayoutActionResultDto
            {
                Success = false,
                Message = "Explicit confirmation that the external bank transfer has completed is required. ConfirmBankTransferCompleted must be true."
            };
        }

        if (dto.Amount <= 0)
        {
            return new PayoutActionResultDto { Success = false, Message = "Payout amount must be greater than zero." };
        }

        // Validate minimum payout threshold from configuration
        decimal minPayoutAmount = _configuration.GetValue<decimal>("FinancialSettings:MinPayoutAmount", 1000.00m);
        if (dto.Amount < minPayoutAmount)
        {
            return new PayoutActionResultDto
            {
                Success = false,
                Message = $"Payout amount (LKR {dto.Amount:N2}) is below the configured minimum payout threshold of LKR {minPayoutAmount:N2}."
            };
        }

        // Execute atomic database transaction with MariaDB row locking
        using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, cancellationToken);
        try
        {
            // Acquire exclusive row lock on the target electrician profile
            var profile = await _context.ElectricianProfiles
                .FromSqlInterpolated($"SELECT * FROM ElectricianProfiles WHERE ProfileId = {dto.ElectricianProfileId} FOR UPDATE")
                .FirstOrDefaultAsync(cancellationToken);

            if (profile == null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new PayoutActionResultDto
                {
                    Success = false,
                    Message = $"Electrician profile #{dto.ElectricianProfileId} was not found."
                };
            }

            // Enforce non-negative wallet balance invariant
            if (profile.AppWalletBalance < dto.Amount)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new PayoutActionResultDto
                {
                    Success = false,
                    Message = $"Insufficient wallet funds. Current balance: LKR {profile.AppWalletBalance:N2}, Requested payout: LKR {dto.Amount:N2}. Balances can never be negative."
                };
            }

            var balanceBefore = profile.AppWalletBalance;
            var balanceAfter = balanceBefore - dto.Amount;

            // 1. Create immutable payout record
            var payoutRecord = new TechnicianPayoutRecord
            {
                ElectricianProfileId = profile.ProfileId,
                Amount = dto.Amount,
                BankName = dto.BankName.Trim(),
                AccountNumberMasked = dto.AccountNumberMasked.Trim(),
                BankTransferReference = dto.BankTransferReference.Trim(),
                RecordedByAdminId = adminUserId,
                DisbursedAtUtc = DateTime.UtcNow,
                AdminNotes = dto.AdminNotes.Trim()
            };
            _context.TechnicianPayoutRecords.Add(payoutRecord);
            await _context.SaveChangesAsync(cancellationToken);

            // 2. Decrement cached wallet balance
            profile.AppWalletBalance = balanceAfter;

            // 3. Append immutable ledger transaction (Signed debit: negative Amount)
            var ledgerEntry = new WalletTransaction
            {
                ElectricianProfileId = profile.ProfileId,
                PayoutRecordId = payoutRecord.PayoutId,
                Amount = -dto.Amount,
                BalanceBefore = balanceBefore,
                BalanceAfter = balanceAfter,
                TransactionType = WalletTransactionType.PayoutDisbursed,
                Description = $"Confirmed bank payout ref: {dto.BankTransferReference.Trim()} ({dto.BankName.Trim()})",
                InitiatedByAdminId = adminUserId,
                ExternalReferenceNumber = dto.BankTransferReference.Trim(),
                CreatedAtUtc = DateTime.UtcNow
            };
            _context.WalletTransactions.Add(ledgerEntry);
            await _context.SaveChangesAsync(cancellationToken);

            // 4. Append immutable unified AdminAuditLog entry atomically inside the transaction
            var auditEntry = _auditService.CreateAuditEntry(
                adminUserId: adminUserId,
                actionType: "PayoutRecorded",
                entityType: "TechnicianPayoutRecord",
                entityId: payoutRecord.PayoutId.ToString(),
                description: $"Recorded out-of-band bank payout #{payoutRecord.PayoutId} of LKR {dto.Amount:N2} to Electrician Profile #{profile.ProfileId} ({dto.BankName.Trim()}, {dto.AccountNumberMasked.Trim()})",
                oldValues: System.Text.Json.JsonSerializer.Serialize(new { AppWalletBalance = balanceBefore }),
                newValues: System.Text.Json.JsonSerializer.Serialize(new {
                    PayoutId = payoutRecord.PayoutId,
                    ElectricianProfileId = profile.ProfileId,
                    Amount = dto.Amount,
                    BankName = dto.BankName.Trim(),
                    AccountNumberMasked = dto.AccountNumberMasked.Trim(),
                    BankTransferReference = dto.BankTransferReference.Trim(),
                    AppWalletBalance = balanceAfter
                }),
                reason: dto.AdminNotes.Trim());
            _context.AdminAuditLogs.Add(auditEntry);
            await _context.SaveChangesAsync(cancellationToken);

            await transaction.CommitAsync(cancellationToken);

            _logger.LogInformation(
                "Admin #{AdminId} recorded payout #{PayoutId} for Electrician #{ProfileId}. Amount: LKR {Amount:N2}. New Balance: LKR {Balance:N2}",
                adminUserId, payoutRecord.PayoutId, profile.ProfileId, dto.Amount, balanceAfter);

            return new PayoutActionResultDto
            {
                Success = true,
                Message = $"Successfully recorded bank payout #{payoutRecord.PayoutId} of LKR {dto.Amount:N2}.",
                PayoutId = payoutRecord.PayoutId,
                LedgerTransactionId = ledgerEntry.TransactionId,
                NewWalletBalance = balanceAfter
            };
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            _logger.LogError(ex, "Failed to record payout for Electrician #{ProfileId}", dto.ElectricianProfileId);
            return new PayoutActionResultDto
            {
                Success = false,
                Message = $"Failed to record payout due to a database error: {ex.Message}"
            };
        }
    }

    public async Task<PayoutActionResultDto> ReversePayoutAsync(
        int payoutId,
        ReversePayoutRequestDto dto,
        int adminUserId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.ReversalReason) || dto.ReversalReason.Trim().Length < 10)
        {
            return new PayoutActionResultDto
            {
                Success = false,
                Message = "A meaningful administrative reversal reason of at least 10 characters is mandatory."
            };
        }

        var payout = await _context.TechnicianPayoutRecords
            .AsNoTracking()
            .FirstOrDefaultAsync(pr => pr.PayoutId == payoutId, cancellationToken);

        if (payout == null)
        {
            return new PayoutActionResultDto
            {
                Success = false,
                Message = $"Payout record #{payoutId} was not found."
            };
        }

        // Execute atomic transaction with MariaDB row locking
        using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, cancellationToken);
        try
        {
            // 1. Acquire exclusive row lock on the target electrician profile
            var profile = await _context.ElectricianProfiles
                .FromSqlInterpolated($"SELECT * FROM ElectricianProfiles WHERE ProfileId = {payout.ElectricianProfileId} FOR UPDATE")
                .FirstOrDefaultAsync(cancellationToken);

            if (profile == null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new PayoutActionResultDto
                {
                    Success = false,
                    Message = $"Electrician profile #{payout.ElectricianProfileId} was not found."
                };
            }

            // 2. Perform duplicate reversal check INSIDE the row lock and transaction
            var alreadyReversed = await _context.WalletTransactions
                .AnyAsync(wt => wt.PayoutRecordId == payoutId && wt.TransactionType == WalletTransactionType.PayoutReversal, cancellationToken);

            if (alreadyReversed)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new PayoutActionResultDto
                {
                    Success = false,
                    Message = $"Payout #{payoutId} has already been reversed. Multiple reversals for the same payout are prohibited."
                };
            }

            var balanceBefore = profile.AppWalletBalance;
            var balanceAfter = balanceBefore + payout.Amount;

            // 3. Credit technician wallet balance
            profile.AppWalletBalance = balanceAfter;

            // 4. Append compensating immutable ledger transaction (Signed credit: positive Amount)
            var reversalLedgerEntry = new WalletTransaction
            {
                ElectricianProfileId = profile.ProfileId,
                PayoutRecordId = payout.PayoutId,
                Amount = +payout.Amount,
                BalanceBefore = balanceBefore,
                BalanceAfter = balanceAfter,
                TransactionType = WalletTransactionType.PayoutReversal,
                Description = $"Compensating reversal for Payout #{payout.PayoutId}: {dto.ReversalReason.Trim()}",
                InitiatedByAdminId = adminUserId,
                ExternalReferenceNumber = dto.BankNoticeReference?.Trim() ?? payout.BankTransferReference,
                CreatedAtUtc = DateTime.UtcNow
            };
            _context.WalletTransactions.Add(reversalLedgerEntry);
            await _context.SaveChangesAsync(cancellationToken);

            // 5. Append immutable unified AdminAuditLog entry atomically inside the transaction
            var auditEntry = _auditService.CreateAuditEntry(
                adminUserId: adminUserId,
                actionType: "PayoutReversed",
                entityType: "TechnicianPayoutRecord",
                entityId: payout.PayoutId.ToString(),
                description: $"Reversed bank payout #{payout.PayoutId}. Restored LKR {payout.Amount:N2} to Electrician Profile #{profile.ProfileId} wallet",
                oldValues: System.Text.Json.JsonSerializer.Serialize(new {
                    PayoutId = payout.PayoutId,
                    IsReversed = false,
                    AppWalletBalance = balanceBefore
                }),
                newValues: System.Text.Json.JsonSerializer.Serialize(new {
                    PayoutId = payout.PayoutId,
                    IsReversed = true,
                    RestoredAmount = payout.Amount,
                    BankNoticeReference = dto.BankNoticeReference?.Trim(),
                    AppWalletBalance = balanceAfter
                }),
                reason: dto.ReversalReason.Trim());
            _context.AdminAuditLogs.Add(auditEntry);
            await _context.SaveChangesAsync(cancellationToken);

            await transaction.CommitAsync(cancellationToken);

            _logger.LogInformation(
                "Admin #{AdminId} reversed payout #{PayoutId} for Electrician #{ProfileId}. Restored: LKR {Amount:N2}. New Balance: LKR {Balance:N2}",
                adminUserId, payout.PayoutId, profile.ProfileId, payout.Amount, balanceAfter);

            return new PayoutActionResultDto
            {
                Success = true,
                Message = $"Successfully reversed Payout #{payout.PayoutId}. LKR {payout.Amount:N2} restored to technician wallet.",
                PayoutId = payout.PayoutId,
                LedgerTransactionId = reversalLedgerEntry.TransactionId,
                NewWalletBalance = balanceAfter
            };
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            _logger.LogError(ex, "Failed to reverse payout #{PayoutId}", payoutId);
            return new PayoutActionResultDto
            {
                Success = false,
                Message = $"Failed to reverse payout due to a database error: {ex.Message}"
            };
        }
    }

    public async Task<AdjustmentActionResultDto> AdjustWalletAsync(
        int profileId,
        WalletAdjustmentRequestDto dto,
        int adminUserId,
        CancellationToken cancellationToken = default)
    {
        if (dto.Amount <= 0)
        {
            return new AdjustmentActionResultDto
            {
                Success = false,
                Message = "Adjustment amount must be greater than zero."
            };
        }

        if (string.IsNullOrWhiteSpace(dto.Reason) || dto.Reason.Trim().Length < 10)
        {
            return new AdjustmentActionResultDto
            {
                Success = false,
                Message = "A meaningful administrative reason of at least 10 characters is mandatory."
            };
        }

        bool isDebit = string.Equals(dto.Type, "Debit", StringComparison.OrdinalIgnoreCase);
        bool isCredit = string.Equals(dto.Type, "Credit", StringComparison.OrdinalIgnoreCase);

        if (!isDebit && !isCredit)
        {
            return new AdjustmentActionResultDto
            {
                Success = false,
                Message = "Adjustment type must be either 'Credit' or 'Debit'."
            };
        }

        // Execute atomic transaction with MariaDB row locking
        using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, cancellationToken);
        try
        {
            var profile = await _context.ElectricianProfiles
                .FromSqlInterpolated($"SELECT * FROM ElectricianProfiles WHERE ProfileId = {profileId} FOR UPDATE")
                .FirstOrDefaultAsync(cancellationToken);

            if (profile == null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new AdjustmentActionResultDto
                {
                    Success = false,
                    Message = $"Electrician profile #{profileId} was not found."
                };
            }

            // Enforce non-negative wallet balance invariant on Debit
            if (isDebit && profile.AppWalletBalance < dto.Amount)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new AdjustmentActionResultDto
                {
                    Success = false,
                    Message = $"Insufficient wallet funds for debit adjustment. Current balance: LKR {profile.AppWalletBalance:N2}, Requested debit: LKR {dto.Amount:N2}. Balances can never become negative."
                };
            }

            decimal signedAmount = isDebit ? -dto.Amount : +dto.Amount;
            var transactionType = isDebit ? WalletTransactionType.AdminAdjustmentDebit : WalletTransactionType.AdminAdjustmentCredit;

            var balanceBefore = profile.AppWalletBalance;
            var balanceAfter = balanceBefore + signedAmount;

            // 1. Update cached wallet balance
            profile.AppWalletBalance = balanceAfter;

            // 2. Append immutable ledger transaction
            var ledgerEntry = new WalletTransaction
            {
                ElectricianProfileId = profile.ProfileId,
                Amount = signedAmount,
                BalanceBefore = balanceBefore,
                BalanceAfter = balanceAfter,
                TransactionType = transactionType,
                Description = $"Admin adjustment ({dto.Type.Trim()}): {dto.Reason.Trim()}",
                InitiatedByAdminId = adminUserId,
                ExternalReferenceNumber = dto.ExternalReferenceNumber?.Trim(),
                CreatedAtUtc = DateTime.UtcNow
            };
            _context.WalletTransactions.Add(ledgerEntry);
            await _context.SaveChangesAsync(cancellationToken);

            // 3. Append immutable unified AdminAuditLog entry atomically inside the transaction
            var auditEntry = _auditService.CreateAuditEntry(
                adminUserId: adminUserId,
                actionType: isDebit ? "WalletAdjustedDebit" : "WalletAdjustedCredit",
                entityType: "WalletTransaction",
                entityId: ledgerEntry.TransactionId.ToString(),
                description: $"Applied administrative {dto.Type.Trim()} adjustment of LKR {dto.Amount:N2} to Electrician Profile #{profile.ProfileId} wallet",
                oldValues: System.Text.Json.JsonSerializer.Serialize(new { AppWalletBalance = balanceBefore }),
                newValues: System.Text.Json.JsonSerializer.Serialize(new {
                    LedgerTransactionId = ledgerEntry.TransactionId,
                    AdjustmentType = dto.Type.Trim(),
                    Amount = dto.Amount,
                    AppWalletBalance = balanceAfter,
                    ExternalReferenceNumber = dto.ExternalReferenceNumber?.Trim()
                }),
                reason: dto.Reason.Trim());
            _context.AdminAuditLogs.Add(auditEntry);
            await _context.SaveChangesAsync(cancellationToken);

            await transaction.CommitAsync(cancellationToken);

            _logger.LogInformation(
                "Admin #{AdminId} adjusted wallet for Electrician #{ProfileId}. Type: {Type}, Amount: LKR {Amount:N2}, Before: LKR {Before:N2}, After: LKR {After:N2}",
                adminUserId, profile.ProfileId, dto.Type, dto.Amount, balanceBefore, balanceAfter);

            return new AdjustmentActionResultDto
            {
                Success = true,
                Message = $"Successfully applied {dto.Type.Trim()} adjustment of LKR {dto.Amount:N2} to Electrician #{profileId}.",
                LedgerTransactionId = ledgerEntry.TransactionId,
                PreviousBalance = balanceBefore,
                NewWalletBalance = balanceAfter
            };
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            _logger.LogError(ex, "Failed to apply wallet adjustment for Electrician #{ProfileId}", profileId);
            return new AdjustmentActionResultDto
            {
                Success = false,
                Message = $"Failed to apply wallet adjustment due to a database error: {ex.Message}"
            };
        }
    }
}

