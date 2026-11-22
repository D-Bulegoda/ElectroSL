using System;
using System.Data;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using ElectroSL_Backend.Data;
using ElectroSL_Backend.DTOs.Payment;
using ElectroSL_Backend.Models;
using ElectroSL_Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace ElectroSL_Backend.Services.Implementations;

public class PaymentProcessingService : IPaymentProcessingService
{
    private readonly ElectroSLDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly INotificationService _notificationService;
    private readonly ILogger<PaymentProcessingService> _logger;

    public PaymentProcessingService(
        ElectroSLDbContext context,
        IConfiguration configuration,
        INotificationService notificationService,
        ILogger<PaymentProcessingService> logger)
    {
        _context = context;
        _configuration = configuration;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<JobCheckoutSummaryDto> GetCheckoutSummaryAsync(
        int jobId,
        int customerUserId,
        CancellationToken cancellationToken = default)
    {
        var job = await _context.Jobs
            .AsNoTracking()
            .Include(j => j.Customer)
            .Include(j => j.Electrician)
            .FirstOrDefaultAsync(j => j.JobId == jobId, cancellationToken);

        if (job == null)
        {
            throw new KeyNotFoundException($"Job #{jobId} was not found.");
        }

        if (job.CustomerId != customerUserId)
        {
            throw new UnauthorizedAccessException($"You do not have permission to view checkout for Job #{jobId}.");
        }

        var equipmentClaims = await _context.JobUsedEquipments
            .AsNoTracking()
            .Where(e => e.JobId == jobId)
            .ToListAsync(cancellationToken);

        // Check for blocking equipment status
        bool hasFlaggedEquipment = equipmentClaims.Any(e => string.Equals(e.Status, "FlaggedForReview", StringComparison.OrdinalIgnoreCase));
        bool isPaymentAlreadyProcessed = await _context.PaymentTransactions
            .AsNoTracking()
            .AnyAsync(pt => pt.JobId == jobId, cancellationToken);

        // Determine eligibility
        bool isEligible = true;
        string? ineligibilityReason = null;

        if (isPaymentAlreadyProcessed)
        {
            isEligible = false;
            ineligibilityReason = "Payment has already been processed for this job.";
        }
        else if (job.Status == "Cancelled" || job.Status == "Completed" || job.Status == "Disputed")
        {
            isEligible = false;
            ineligibilityReason = $"Job #{jobId} is currently in '{job.Status}' status and cannot accept payment.";
        }
        else if (job.ElectricianId == null)
        {
            isEligible = false;
            ineligibilityReason = "No electrician has been assigned to this job.";
        }
        else if (!job.AgreedLabourAmount.HasValue || job.AgreedLabourAmount.Value <= 0)
        {
            isEligible = false;
            ineligibilityReason = "Authoritative agreed labour amount has not been established by an administrator for this job.";
        }
        else if (hasFlaggedEquipment)
        {
            isEligible = false;
            ineligibilityReason = "Equipment claims for this job are currently flagged for review and require administrative approval before payment.";
        }

        // Calculate billable equipment (AutoApproved and AdminApproved only)
        var billableClaims = equipmentClaims
            .Where(e => string.Equals(e.Status, "AutoApproved", StringComparison.OrdinalIgnoreCase) ||
                         string.Equals(e.Status, "AdminApproved", StringComparison.OrdinalIgnoreCase))
            .ToList();

        decimal billableEquipmentTotal = billableClaims.Sum(e => e.ClaimedPrice);
        decimal labourCharge = job.AgreedLabourAmount ?? 0m;
        decimal grossJobValue = labourCharge + billableEquipmentTotal;

        decimal commissionRate = _configuration.GetValue<decimal>("FinancialSettings:PlatformCommissionRate", 0.15m);
        decimal platformCommission = Math.Round(grossJobValue * commissionRate, 2, MidpointRounding.AwayFromZero);
        decimal electricianEarnings = grossJobValue - platformCommission;

        var equipmentItems = equipmentClaims.Select(e => new CheckoutEquipmentItemDto
        {
            Id = e.Id,
            ItemName = e.ItemName,
            Quantity = e.Quantity,
            UnitPrice = e.Quantity > 0 ? Math.Round(e.ClaimedPrice / e.Quantity, 2) : e.ClaimedPrice,
            TotalPrice = e.ClaimedPrice,
            Status = e.Status
        }).ToList();

        return new JobCheckoutSummaryDto
        {
            JobId = job.JobId,
            JobTitle = job.Description.Length > 50 ? job.Description.Substring(0, 47) + "..." : job.Description,
            JobStatus = job.Status,
            CustomerId = job.CustomerId,
            CustomerName = job.Customer.Name,
            ElectricianId = job.ElectricianId,
            ElectricianName = job.Electrician?.Name,
            IsPaymentEligible = isEligible,
            IneligibilityReason = ineligibilityReason,
            LabourCharge = job.AgreedLabourAmount,
            LabourAmountSetAtUtc = job.AgreedLabourAmountSetAtUtc,
            EquipmentItems = equipmentItems,
            BillableEquipmentTotal = billableEquipmentTotal,
            GrossJobValue = grossJobValue,
            PlatformCommissionRate = commissionRate,
            PlatformCommission = platformCommission,
            ElectricianEarnings = electricianEarnings,
            PricingOptions = new CheckoutPricingOptionsDto
            {
                FullDigital = new CheckoutPricingTierDto
                {
                    PaymentMethod = "FullDigital",
                    CustomerPaysOnline = grossJobValue,
                    CustomerPaysCash = 0.00m,
                    ElectricianWalletCredit = electricianEarnings,
                    Description = "Pay 100% online now via Card. Electrician receives 85% as earnings credited to their ElectroSL digital wallet."
                },
                Cash = new CheckoutPricingTierDto
                {
                    PaymentMethod = "Cash",
                    CustomerPaysOnline = 0.00m,
                    CustomerPaysCash = grossJobValue,
                    ElectricianWalletCredit = 0.00m,
                    Description = "Pay 100% in cash directly to the technician on-site upon work completion. 15% platform commission is charged to technician wallet."
                },
                CashSplit = new CheckoutPricingTierDto
                {
                    PaymentMethod = "Cash",
                    CustomerPaysOnline = 0.00m,
                    CustomerPaysCash = grossJobValue,
                    ElectricianWalletCredit = 0.00m,
                    Description = "Pay 100% in cash directly to the technician on-site upon work completion. 15% platform commission is charged to technician wallet."
                }
            }
        };
    }

    public async Task<CustomerPaymentResultDto> ProcessCustomerPaymentAsync(
        CustomerPaymentRequestDto request,
        int customerUserId,
        CancellationToken cancellationToken = default)
    {
        if (request == null)
            throw new ArgumentException("Payment request payload cannot be null.");

        string canonicalMethod = NormalizePaymentMethod(request.PaymentMethod);

        // Execute atomic database transaction with MariaDB row locking
        using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, cancellationToken);
        try
        {
            // 1. Lock the Job row exclusively
            var job = await _context.Jobs
                .FromSqlInterpolated($"SELECT * FROM Jobs WHERE JobId = {request.JobId} FOR UPDATE")
                .FirstOrDefaultAsync(cancellationToken);

            if (job == null)
            {
                throw new KeyNotFoundException($"Job #{request.JobId} was not found.");
            }

            // 2. Ownership verification: authenticated customer must own the job
            if (job.CustomerId != customerUserId)
            {
                _logger.LogWarning("Security violation: User {UserId} attempted payment on Job #{JobId} owned by Customer {OwnerId}",
                    customerUserId, job.JobId, job.CustomerId);
                throw new UnauthorizedAccessException($"You do not have permission to process payment for Job #{job.JobId}.");
            }

            // 3. Reject Cancelled, Completed, and Disputed jobs
            if (job.Status == "Cancelled" || job.Status == "Completed" || job.Status == "Disputed")
            {
                throw new InvalidOperationException($"Cannot process payment: Job #{job.JobId} is currently in '{job.Status}' status.");
            }

            // 4. Ensure assigned electrician exists
            if (job.ElectricianId == null)
            {
                throw new InvalidOperationException($"Cannot process payment: No electrician has been assigned to Job #{job.JobId}.");
            }

            // 5. Require authoritative agreed labour amount
            if (!job.AgreedLabourAmount.HasValue || job.AgreedLabourAmount.Value <= 0)
            {
                throw new InvalidOperationException(
                    $"Cannot process payment: Authoritative agreed labour amount has not been set by an administrator for Job #{job.JobId}.");
            }

            // 6. Prevent duplicate payment under lock
            var existingPayment = await _context.PaymentTransactions
                .AnyAsync(pt => pt.JobId == job.JobId, cancellationToken);

            if (existingPayment)
            {
                throw new InvalidOperationException($"Payment has already been processed and recorded for Job #{job.JobId}.");
            }

            // 7. Load equipment claims under transaction
            var equipmentClaims = await _context.JobUsedEquipments
                .Where(e => e.JobId == job.JobId)
                .ToListAsync(cancellationToken);

            // Block payment if any equipment is FlaggedForReview
            if (equipmentClaims.Any(e => string.Equals(e.Status, "FlaggedForReview", StringComparison.OrdinalIgnoreCase)))
            {
                throw new InvalidOperationException(
                    "Cannot process payment: One or more equipment claims for this job are flagged for review and awaiting admin approval.");
            }

            // Calculate billable equipment (AutoApproved + AdminApproved)
            decimal billableEquipment = equipmentClaims
                .Where(e => string.Equals(e.Status, "AutoApproved", StringComparison.OrdinalIgnoreCase) ||
                             string.Equals(e.Status, "AdminApproved", StringComparison.OrdinalIgnoreCase))
                .Sum(e => e.ClaimedPrice);

            // 8. Server-calculated authoritative financial values
            decimal grossJobValue = job.AgreedLabourAmount.Value + billableEquipment;
            decimal commissionRate = _configuration.GetValue<decimal>("FinancialSettings:PlatformCommissionRate", 0.15m);
            decimal platformCommission = Math.Round(grossJobValue * commissionRate, 2, MidpointRounding.AwayFromZero);
            decimal electricianEarnings = grossJobValue - platformCommission;

            // Invariant verification
            if (platformCommission + electricianEarnings != grossJobValue)
            {
                throw new InvalidOperationException("Internal financial calculation error: Commission and earnings do not equal gross value.");
            }

            var nowUtc = DateTime.UtcNow;
            decimal? updatedWalletBalance = null;
            decimal customerPaidOnline;
            decimal customerDirectCash;

            // 9. Process payment and wallet mutations based on canonical method
            var paymentTransaction = new PaymentTransaction
            {
                JobId = job.JobId,
                TotalAmount = grossJobValue,
                PlatformCommission = platformCommission,
                ElectricianEarning = electricianEarnings,
                PaymentMethod = canonicalMethod,
                CreatedAtUtc = nowUtc
            };

            _context.PaymentTransactions.Add(paymentTransaction);
            await _context.SaveChangesAsync(cancellationToken);

            // Acquire exclusive row lock on ElectricianProfile
            var profile = await _context.ElectricianProfiles
                .FromSqlInterpolated($"SELECT * FROM ElectricianProfiles WHERE UserId = {job.ElectricianId.Value} FOR UPDATE")
                .FirstOrDefaultAsync(cancellationToken);

            if (profile == null)
            {
                throw new InvalidOperationException($"Electrician profile for assigned user #{job.ElectricianId.Value} was not found.");
            }

            if (canonicalMethod == "FullDigital")
            {
                customerPaidOnline = grossJobValue;
                customerDirectCash = 0.00m;

                decimal debtBefore = profile.OutstandingCommissionDebt;
                decimal debtRecovered = Math.Min(debtBefore, electricianEarnings);
                decimal debtAfter = debtBefore - debtRecovered;
                profile.OutstandingCommissionDebt = debtAfter;

                decimal balanceBefore = profile.AppWalletBalance;
                decimal balanceAfter = balanceBefore + electricianEarnings;
                profile.AppWalletBalance = balanceAfter;
                updatedWalletBalance = balanceAfter;

                // Insert immutable ledger transaction
                var walletTransaction = new WalletTransaction
                {
                    ElectricianProfileId = profile.ProfileId,
                    JobId = job.JobId,
                    PaymentTransactionId = paymentTransaction.TransactionId,
                    Amount = electricianEarnings,
                    BalanceBefore = balanceBefore,
                    BalanceAfter = balanceAfter,
                    CommissionDebtBefore = debtBefore,
                    CommissionDebtAfter = debtAfter,
                    CommissionDebtRecovered = debtRecovered,
                    TransactionType = WalletTransactionType.DigitalJobEarning,
                    Description = debtRecovered > 0
                        ? $"Digital job earning for Job #{job.JobId} (+LKR {electricianEarnings:N2}). Commission debt recovered: LKR {debtRecovered:N2}."
                        : $"Digital job earning for Job #{job.JobId} (+LKR {electricianEarnings:N2}).",
                    CreatedAtUtc = nowUtc
                };

                _context.WalletTransactions.Add(walletTransaction);
                await _context.SaveChangesAsync(cancellationToken);
            }
            else // Cash
            {
                customerPaidOnline = 0.00m;
                customerDirectCash = grossJobValue;

                decimal debtBefore = profile.OutstandingCommissionDebt;
                decimal debtAfter = debtBefore + platformCommission;
                profile.OutstandingCommissionDebt = debtAfter;

                decimal balanceBefore = profile.AppWalletBalance;
                decimal balanceAfter = balanceBefore - platformCommission;
                profile.AppWalletBalance = balanceAfter;
                updatedWalletBalance = balanceAfter;

                // Insert immutable ledger transaction
                var walletTransaction = new WalletTransaction
                {
                    ElectricianProfileId = profile.ProfileId,
                    JobId = job.JobId,
                    PaymentTransactionId = paymentTransaction.TransactionId,
                    Amount = -platformCommission,
                    BalanceBefore = balanceBefore,
                    BalanceAfter = balanceAfter,
                    CommissionDebtBefore = debtBefore,
                    CommissionDebtAfter = debtAfter,
                    CommissionDebtRecovered = 0.00m,
                    TransactionType = WalletTransactionType.CashJobCommissionDebit,
                    Description = $"Platform commission (15%) debit for cash-paid Job #{job.JobId} (-LKR {platformCommission:N2}).",
                    CreatedAtUtc = nowUtc
                };

                _context.WalletTransactions.Add(walletTransaction);
                await _context.SaveChangesAsync(cancellationToken);
            }

            // 10. PRESERVE JOB STATUS: Do NOT set job.Status = "Completed"
            // Job status remains in its existing lifecycle state (e.g. InProgress)

            await transaction.CommitAsync(cancellationToken);

            _logger.LogInformation(
                "Payment successfully recorded for Job #{JobId}. Method: {Method}, GMV: LKR {GMV:N2}, Comm: LKR {Comm:N2}, Tech: LKR {Tech:N2}",
                job.JobId, canonicalMethod, grossJobValue, platformCommission, electricianEarnings);

            // 11. Dispatch notifications outside transaction
            _ = Task.Run(async () =>
            {
                try
                {
                    if (canonicalMethod == "FullDigital")
                    {
                        await _notificationService.SendNotificationAsync(
                            job.ElectricianId.Value,
                            "Digital Payment Credited",
                            $"Payment for Job #{job.JobId} has been processed online. LKR {electricianEarnings:N2} was credited to your ElectroSL wallet.",
                            "PaymentReceived",
                            job.JobId
                        );

                        await _notificationService.SendNotificationAsync(
                            job.CustomerId,
                            "Payment Successful",
                            $"Your online payment of LKR {grossJobValue:N2} for Job #{job.JobId} was processed successfully.",
                            "PaymentSuccess",
                            job.JobId
                        );
                    }
                    else
                    {
                        await _notificationService.SendNotificationAsync(
                            job.ElectricianId.Value,
                            "Cash Payment Confirmed",
                            $"Customer paid LKR {grossJobValue:N2} in cash on-site for Job #{job.JobId}. 15% platform commission of LKR {platformCommission:N2} has been debited to your wallet.",
                            "PaymentCashSplit",
                            job.JobId
                        );

                        await _notificationService.SendNotificationAsync(
                            job.CustomerId,
                            "Cash Payment Recorded",
                            $"Your direct cash payment of LKR {grossJobValue:N2} to technician for Job #{job.JobId} was recorded.",
                            "PaymentSuccess",
                            job.JobId
                        );
                    }
                }
                catch (Exception notifEx)
                {
                    _logger.LogError(notifEx, "Background notification dispatch failed for Job #{JobId}", job.JobId);
                }
            });

            return new CustomerPaymentResultDto
            {
                Success = true,
                Message = canonicalMethod == "FullDigital"
                    ? $"Payment of LKR {grossJobValue:N2} processed successfully via digital payment."
                    : $"Direct cash payment of LKR {grossJobValue:N2} recorded. Platform commission of LKR {platformCommission:N2} debited to wallet.",
                TransactionId = paymentTransaction.TransactionId,
                JobId = job.JobId,
                JobStatus = job.Status,
                GrossJobValue = grossJobValue,
                PlatformCommission = platformCommission,
                ElectricianEarnings = electricianEarnings,
                PaymentMethod = canonicalMethod,
                CustomerPaidOnline = customerPaidOnline,
                CustomerDirectCash = customerDirectCash,
                UpdatedWalletBalance = updatedWalletBalance,
                ProcessedAtUtc = nowUtc
            };
        }
        catch (Exception ex)
        {
            try
            {
                await transaction.RollbackAsync(cancellationToken);
            }
            catch
            {
                // Ignore rollback exceptions if already rolled back
            }

            _logger.LogError(ex, "Payment processing failed for Job #{JobId}", request.JobId);
            throw;
        }
    }

    private static string NormalizePaymentMethod(string rawMethod)
    {
        if (string.IsNullOrWhiteSpace(rawMethod))
            throw new ArgumentException("Payment method is required. Valid payment methods are 'FullDigital' and 'Cash'.");

        var clean = rawMethod.Trim();

        if (clean.Equals("FullDigital", StringComparison.OrdinalIgnoreCase) ||
            clean.Equals("Card", StringComparison.OrdinalIgnoreCase) ||
            clean.Equals("Credit Card", StringComparison.OrdinalIgnoreCase) ||
            clean.Equals("Debit Card", StringComparison.OrdinalIgnoreCase) ||
            clean.Equals("Online", StringComparison.OrdinalIgnoreCase))
        {
            return "FullDigital";
        }

        if (clean.Equals("Cash", StringComparison.OrdinalIgnoreCase) ||
            clean.Equals("Cash on Delivery", StringComparison.OrdinalIgnoreCase))
        {
            return "Cash";
        }

        throw new ArgumentException($"Invalid payment method '{rawMethod}'. Allowed payment methods for new payments are 'FullDigital' and 'Cash'.");
    }
}
