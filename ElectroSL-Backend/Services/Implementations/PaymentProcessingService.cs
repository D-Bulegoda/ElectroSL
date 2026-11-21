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
                CashSplit = new CheckoutPricingTierDto
                {
                    PaymentMethod = "CashSplit",
                    CustomerPaysOnline = platformCommission,
                    CustomerPaysCash = electricianEarnings,
                    ElectricianWalletCredit = 0.00m,
                    Description = "Pay 15% platform commission online now. Pay the remaining 85% directly to the electrician in cash. No wallet movement or debt occurs."
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

            if (canonicalMethod == "FullDigital")
            {
                customerPaidOnline = grossJobValue;
                customerDirectCash = 0.00m;

                // Acquire exclusive row lock on ElectricianProfile
                var profile = await _context.ElectricianProfiles
                    .FromSqlInterpolated($"SELECT * FROM ElectricianProfiles WHERE UserId = {job.ElectricianId.Value} FOR UPDATE")
                    .FirstOrDefaultAsync(cancellationToken);

                if (profile == null)
                {
                    throw new InvalidOperationException($"Electrician profile for assigned user #{job.ElectricianId.Value} was not found.");
                }

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
                    TransactionType = WalletTransactionType.DigitalJobEarning,
                    Description = $"Digital job earning for Job #{job.JobId} (Gross: LKR {grossJobValue:N2}, 15% Comm: LKR {platformCommission:N2})",
                    CreatedAtUtc = nowUtc
                };

                _context.WalletTransactions.Add(walletTransaction);
                await _context.SaveChangesAsync(cancellationToken);
            }
            else // CashSplit
            {
                customerPaidOnline = platformCommission;
                customerDirectCash = electricianEarnings;

                // Strictly NO wallet mutations and NO wallet transaction records
                updatedWalletBalance = null;
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
                            "Platform Commission Confirmed",
                            $"Customer paid the 15% platform fee for Job #{job.JobId} online. Please collect LKR {electricianEarnings:N2} directly from the customer in cash upon work completion.",
                            "PaymentCashSplit",
                            job.JobId
                        );

                        await _notificationService.SendNotificationAsync(
                            job.CustomerId,
                            "Platform Fee Paid",
                            $"Your payment of LKR {platformCommission:N2} for the 15% platform fee for Job #{job.JobId} was successful. Please pay the remaining LKR {electricianEarnings:N2} directly to the electrician in cash.",
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
                    : $"Platform commission of LKR {platformCommission:N2} paid online. LKR {electricianEarnings:N2} is payable in cash to the electrician.",
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
            throw new ArgumentException("Payment method is required.");

        var clean = rawMethod.Trim();

        if (clean.Equals("FullDigital", StringComparison.OrdinalIgnoreCase) ||
            clean.Equals("Card", StringComparison.OrdinalIgnoreCase) ||
            clean.Equals("Credit Card", StringComparison.OrdinalIgnoreCase) ||
            clean.Equals("Debit Card", StringComparison.OrdinalIgnoreCase))
        {
            return "FullDigital";
        }

        if (clean.Equals("CashSplit", StringComparison.OrdinalIgnoreCase) ||
            clean.Equals("Cash", StringComparison.OrdinalIgnoreCase) ||
            clean.Equals("Cash on Delivery", StringComparison.OrdinalIgnoreCase))
        {
            return "CashSplit";
        }

        throw new ArgumentException($"Unsupported payment method '{rawMethod}'. Allowed methods: 'FullDigital', 'CashSplit'.");
    }
}
