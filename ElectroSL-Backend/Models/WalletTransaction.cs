using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ElectroSL_Backend.Models;

public enum WalletTransactionType
{
    InitialBalanceMigration = 1, // Baseline snapshot of legacy AppWalletBalance
    DigitalJobEarning = 2,       // 85% credit from completed digital job payment
    PayoutDisbursed = 3,         // Administrative bank payout recorded
    PayoutReversal = 4,          // Reversal of bounced/failed bank payout
    AdminAdjustmentCredit = 5,   // Audited administrative balance credit
    AdminAdjustmentDebit = 6,    // Audited administrative balance debit (capped at available balance)
    CashJobCommissionDebit = 7   // 15% platform commission debit owed from cash job
}

public class WalletTransaction
{
    [Key]
    public long TransactionId { get; set; }

    public int ElectricianProfileId { get; set; }

    public int? JobId { get; set; }

    public int? PaymentTransactionId { get; set; }

    public int? PayoutRecordId { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal BalanceBefore { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal BalanceAfter { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal CommissionDebtBefore { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal CommissionDebtAfter { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal CommissionDebtRecovered { get; set; }

    public WalletTransactionType TransactionType { get; set; }

    [MaxLength(255)]
    public string Description { get; set; } = string.Empty;

    public int? InitiatedByAdminId { get; set; }

    [MaxLength(100)]
    public string? ExternalReferenceNumber { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    [ForeignKey("ElectricianProfileId")]
    public virtual ElectricianProfile ElectricianProfile { get; set; } = null!;

    [ForeignKey("JobId")]
    public virtual Job? Job { get; set; }

    [ForeignKey("PaymentTransactionId")]
    public virtual PaymentTransaction? PaymentTransaction { get; set; }

    [ForeignKey("PayoutRecordId")]
    public virtual TechnicianPayoutRecord? PayoutRecord { get; set; }

    [ForeignKey("InitiatedByAdminId")]
    public virtual User? InitiatedByAdmin { get; set; }
}

