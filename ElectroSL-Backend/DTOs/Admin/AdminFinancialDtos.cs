using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using ElectroSL_Backend.Models;

namespace ElectroSL_Backend.DTOs.Admin;

/// <summary>
/// Platform-wide financial summary distinguishing GMV, online collected revenue, and direct cash.
/// </summary>
public class AdminFinancialSummaryDto
{
    /// <summary>
    /// Total Gross Merchandise Value across all completed jobs (Labour + Equipment).
    /// </summary>
    public decimal TotalGrossJobValue { get; set; }

    /// <summary>
    /// Actual cash volume collected online by ElectroSL (100% of digital jobs + 15% platform fee of cash-split jobs).
    /// </summary>
    public decimal TotalCollectedOnline { get; set; }

    /// <summary>
    /// Cash paid directly by customers to technicians on-site (85% of cash-split jobs).
    /// </summary>
    public decimal TotalDirectCashToElectricians { get; set; }

    /// <summary>
    /// Total 15% platform commission earned by ElectroSL across all completed jobs.
    /// </summary>
    public decimal TotalPlatformCommission { get; set; }

    /// <summary>
    /// Total 85% net earnings earned by electricians (digital earnings + direct cash).
    /// </summary>
    public decimal TotalElectricianEarnings { get; set; }

    /// <summary>
    /// Current outstanding platform payout liability: sum of all active technician virtual wallet balances.
    /// </summary>
    public decimal OutstandingWalletLiability { get; set; }

    /// <summary>
    /// Total gross out-of-band bank payouts recorded by administrators.
    /// </summary>
    public decimal TotalRecordedPayouts { get; set; }

    /// <summary>
    /// Total payouts reversed due to bank transfer bounce/rejection.
    /// </summary>
    public decimal TotalReversedPayouts { get; set; }

    /// <summary>
    /// Net disbursed payouts (TotalRecordedPayouts - TotalReversedPayouts).
    /// </summary>
    public decimal NetDisbursedPayouts { get; set; }

    /// <summary>
    /// Total admin manual credit adjustments to wallets.
    /// </summary>
    public decimal TotalAdjustmentsCredit { get; set; }

    /// <summary>
    /// Total admin manual debit adjustments to wallets.
    /// </summary>
    public decimal TotalAdjustmentsDebit { get; set; }

    /// <summary>
    /// Count of technicians with positive wallet balance (> 0).
    /// </summary>
    public int TechniciansWithPositiveBalanceCount { get; set; }

    /// <summary>
    /// Total registered technician count.
    /// </summary>
    public int TotalTechnicianCount { get; set; }

    /// <summary>
    /// Total payment transactions count.
    /// </summary>
    public int TotalPaymentTransactionsCount { get; set; }

    /// <summary>
    /// Total wallet transactions count in immutable ledger.
    /// </summary>
    public int TotalWalletLedgerTransactionsCount { get; set; }
}

/// <summary>
/// Query filters for the global wallet transaction ledger.
/// </summary>
public class FinancialLedgerFilterDto
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public int? ElectricianProfileId { get; set; }
    public WalletTransactionType? TransactionType { get; set; }
    public DateTime? StartDateUtc { get; set; }
    public DateTime? EndDateUtc { get; set; }
    public string? SearchQuery { get; set; }
}

/// <summary>
/// Item in the global wallet transaction ledger.
/// </summary>
public class AdminWalletTransactionDto
{
    public long TransactionId { get; set; }
    public int ElectricianProfileId { get; set; }
    public string ElectricianName { get; set; } = string.Empty;
    public string ElectricianEmail { get; set; } = string.Empty;
    public int? JobId { get; set; }
    public int? PaymentTransactionId { get; set; }
    public int? PayoutRecordId { get; set; }
    public decimal Amount { get; set; }
    public decimal BalanceBefore { get; set; }
    public decimal BalanceAfter { get; set; }
    public WalletTransactionType TransactionType { get; set; }
    public string TransactionTypeName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int? InitiatedByAdminId { get; set; }
    public string? InitiatedByAdminName { get; set; }
    public string? ExternalReferenceNumber { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

/// <summary>
/// Paginated list response for financial queries.
/// </summary>
public class PaginatedFinancialResponse<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;
    public bool HasPreviousPage => Page > 1;
    public bool HasNextPage => Page < TotalPages;
}

/// <summary>
/// Detailed technician wallet overview for administration.
/// </summary>
public class TechnicianWalletDetailDto
{
    public int ProfileId { get; set; }
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
    public string VerificationStatus { get; set; } = string.Empty;
    public bool IsApprovedByAdmin { get; set; }
    public bool IsOnline { get; set; }
    public decimal CurrentWalletBalance { get; set; }
    public decimal LifetimeDigitalEarnings { get; set; }
    public decimal LifetimeGrossPayouts { get; set; }
    public decimal LifetimeReversedPayouts { get; set; }
    public decimal LifetimeNetPayouts { get; set; }
    public decimal LifetimeAdjustmentsCredit { get; set; }
    public decimal LifetimeAdjustmentsDebit { get; set; }
    public int TotalTransactionsCount { get; set; }
    public List<AdminWalletTransactionDto> RecentTransactions { get; set; } = new();
    public List<TechnicianPayoutRecordDto> RecentPayouts { get; set; } = new();
}

/// <summary>
/// Payout record DTO for administrative inspection.
/// </summary>
public class TechnicianPayoutRecordDto
{
    public int PayoutId { get; set; }
    public int ElectricianProfileId { get; set; }
    public decimal Amount { get; set; }
    public string BankName { get; set; } = string.Empty;
    public string AccountNumberMasked { get; set; } = string.Empty;
    public string BankTransferReference { get; set; } = string.Empty;
    public int RecordedByAdminId { get; set; }
    public string RecordedByAdminName { get; set; } = string.Empty;
    public DateTime DisbursedAtUtc { get; set; }
    public string AdminNotes { get; set; } = string.Empty;
    public bool IsReversed { get; set; }
    public DateTime? ReversedAtUtc { get; set; }
    public string? ReversalReason { get; set; }
    public long? ReversalTransactionId { get; set; }
}

/// <summary>
/// Request payload to record an externally confirmed bank payout.
/// </summary>
public class RecordPayoutRequestDto
{
    [Required]
    public int ElectricianProfileId { get; set; }

    [Required]
    [Range(0.01, 10000000.00, ErrorMessage = "Payout amount must be greater than zero.")]
    public decimal Amount { get; set; }

    [Required]
    [MaxLength(100)]
    public string BankName { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    [RegularExpression(@"^[\*X]{3,}[0-9]{3,}$|^[0-9]{3,4}$|^\*{2,}[0-9]{3,4}$", 
        ErrorMessage = "Account number must be masked (e.g. '****1234' or 'XXXX5678'). Raw account numbers are prohibited.")]
    public string AccountNumberMasked { get; set; } = string.Empty;

    [Required]
    [MinLength(3, ErrorMessage = "A valid bank transfer reference (e.g. SLIPS/CEFT ref) is required.")]
    [MaxLength(100)]
    public string BankTransferReference { get; set; } = string.Empty;

    [Required]
    [MinLength(5, ErrorMessage = "Administrative notes are required to document the transfer.")]
    [MaxLength(500)]
    public string AdminNotes { get; set; } = string.Empty;

    /// <summary>
    /// Explicit confirmation that the external bank transfer has already completed. Mandatory and must be true.
    /// </summary>
    public bool ConfirmBankTransferCompleted { get; set; } = false;
}

/// <summary>
/// Request payload to reverse a failed or bounced bank payout.
/// </summary>
public class ReversePayoutRequestDto
{
    [Required]
    [MinLength(10, ErrorMessage = "A meaningful administrative reversal reason of at least 10 characters is required.")]
    [MaxLength(500)]
    public string ReversalReason { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? BankNoticeReference { get; set; }
}

/// <summary>
/// Request payload for an audited administrative wallet balance adjustment.
/// </summary>
public class WalletAdjustmentRequestDto
{
    [Required]
    [RegularExpression("^(Credit|Debit)$", ErrorMessage = "Adjustment type must be either 'Credit' or 'Debit'.")]
    public string Type { get; set; } = "Credit";

    [Required]
    [Range(0.01, 10000000.00, ErrorMessage = "Adjustment amount must be greater than zero.")]
    public decimal Amount { get; set; }

    [Required]
    [MinLength(10, ErrorMessage = "A meaningful administrative reason of at least 10 characters is mandatory.")]
    [MaxLength(255)]
    public string Reason { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? ExternalReferenceNumber { get; set; }
}

/// <summary>
/// Result of a payout recording action.
/// </summary>
public class PayoutActionResultDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int? PayoutId { get; set; }
    public long? LedgerTransactionId { get; set; }
    public decimal NewWalletBalance { get; set; }
}

/// <summary>
/// Result of an administrative adjustment action.
/// </summary>
public class AdjustmentActionResultDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public long? LedgerTransactionId { get; set; }
    public decimal PreviousBalance { get; set; }
    public decimal NewWalletBalance { get; set; }
}

