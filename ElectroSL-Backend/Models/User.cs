using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ElectroSL_Backend.Models;

public class User
{
    [Key]
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "Customer"; // Customer, Electrician, Admin
    public string Phone { get; set; } = string.Empty;
    public bool IsPhoneVerified { get; set; } = false;
    public string? OtpCodeHash { get; set; }
    public DateTime? OtpExpiryUtc { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Account Lifecycle & Status Management (Phase 3)
    public bool IsActive { get; set; } = true;

    [Required]
    [MaxLength(30)]
    public string AccountStatus { get; set; } = "Active"; // "Active", "Inactive", "Suspended"

    [MaxLength(500)]
    public string? SuspensionReason { get; set; }

    public DateTime? DeactivatedAt { get; set; }
    public DateTime? SuspendedAt { get; set; }

    public int ConcurrencyVersion { get; set; } = 1;

    // Navigation Properties
    public ElectricianProfile? ElectricianProfile { get; set; }
    public ICollection<Job> CustomerJobs { get; set; } = new List<Job>();
    public ICollection<Job> AssignedJobs { get; set; } = new List<Job>();
    public ICollection<JobBid> JobBids { get; set; } = new List<JobBid>();
    public ICollection<Review> ReviewsReceived { get; set; } = new List<Review>();
    public ICollection<SimulatorResult> SimulatorResults { get; set; } = new List<SimulatorResult>();
    public ICollection<TechnicianAuditLog> AdminAuditActions { get; set; } = new List<TechnicianAuditLog>();
    public ICollection<EquipmentPriceHistory> PriceChangeActions { get; set; } = new List<EquipmentPriceHistory>();
    public ICollection<JobUsedEquipment> ReviewedEquipments { get; set; } = new List<JobUsedEquipment>();
}
