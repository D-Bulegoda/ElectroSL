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
    public string VerificationStatus { get; set; } = "Pending"; // Pending, Approved, Rejected
    public bool IsApprovedByAdmin { get; set; } = false; // Kept for backward compatibility
    public string? RejectionReason { get; set; }
    public int? ReviewedByAdminId { get; set; }
    public DateTime? ReviewedAt { get; set; }

    public bool IsOnline { get; set; } = false;
    public double CurrentLat { get; set; }
    public double CurrentLng { get; set; }
    public decimal AppWalletBalance { get; set; } = 0.0m;
}
