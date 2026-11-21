using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ElectroSL_Backend.Models;

public class TechnicianPayoutRecord
{
    [Key]
    public int PayoutId { get; set; }

    public int ElectricianProfileId { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    [MaxLength(100)]
    public string BankName { get; set; } = string.Empty;

    [MaxLength(30)]
    public string AccountNumberMasked { get; set; } = string.Empty;

    [MaxLength(100)]
    public string BankTransferReference { get; set; } = string.Empty;

    public int RecordedByAdminId { get; set; }

    public DateTime DisbursedAtUtc { get; set; } = DateTime.UtcNow;

    [MaxLength(500)]
    public string AdminNotes { get; set; } = string.Empty;

    // Navigation Properties
    [ForeignKey("ElectricianProfileId")]
    public virtual ElectricianProfile ElectricianProfile { get; set; } = null!;

    [ForeignKey("RecordedByAdminId")]
    public virtual User RecordedByAdmin { get; set; } = null!;

    public virtual ICollection<WalletTransaction> WalletTransactions { get; set; } = new List<WalletTransaction>();
}

