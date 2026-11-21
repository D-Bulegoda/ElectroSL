using System;

namespace ElectroSL_Backend.DTOs.Admin;

public class UserSummaryDto
{
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty; // Customer, Electrician, Admin
    public bool IsActive { get; set; }
    public string AccountStatus { get; set; } = "Active"; // Active, Inactive, Suspended
    public string? SuspensionReason { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? DeactivatedAt { get; set; }
    public DateTime? SuspendedAt { get; set; }
    public int ConcurrencyVersion { get; set; }

    // Electrician-specific quick indicators
    public int? ElectricianProfileId { get; set; }
    public string? VerificationStatus { get; set; }
    public bool? IsApprovedByAdmin { get; set; }
    public bool? IsOnline { get; set; }
    public string? Specialization { get; set; }
    public decimal? AppWalletBalance { get; set; }
}

