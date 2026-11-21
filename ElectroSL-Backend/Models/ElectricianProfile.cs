
using System;
using System.ComponentModel.DataAnnotations;

namespace ElectroSL_Backend.Models;

public class ElectricianProfile
{
    [Key]
    public int ProfileId { get; set; }

    public int UserId { get; set; }

    public string NvqCertificateUrl { get; set; } = string.Empty;
    public string NicDocumentUrl { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;

    // Verification state
    public string VerificationStatus { get; set; } = "Pending";
    public bool IsApprovedByAdmin { get; set; } = false;
    public string? RejectionReason { get; set; }
    public int? ReviewedByAdminId { get; set; }
    public DateTime? ReviewedAt { get; set; }

    public bool IsOnline { get; set; } = false;
    public double CurrentLat { get; set; }
    public double CurrentLng { get; set; }

    public decimal AppWalletBalance { get; set; } = 0.0m;

    // Navigation Property
    public User User { get; set; } = null!;
    public ICollection<TechnicianAuditLog> AuditLogs { get; set; } = new List<TechnicianAuditLog>();
    public virtual ICollection<WalletTransaction> WalletTransactions { get; set; } = new List<WalletTransaction>();
    public virtual ICollection<TechnicianPayoutRecord> PayoutRecords { get; set; } = new List<TechnicianPayoutRecord>();
}
