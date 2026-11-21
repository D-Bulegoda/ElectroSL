using System;
using System.ComponentModel.DataAnnotations;

namespace ElectroSL_Backend.Models;

public class TechnicianAuditLog
{
    [Key]
    public int Id { get; set; }

    public int ElectricianProfileId { get; set; }

    public int AdminId { get; set; }

    [Required]
    [MaxLength(50)]
    public string Action { get; set; } = string.Empty; 
    // "Approved", "Rejected", "Revoked", "SimulatorOverrideApproved"

    [Required]
    [MaxLength(50)]
    public string PreviousStatus { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string NewStatus { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Reason { get; set; }

    public DateTime TimestampUtc { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public ElectricianProfile ElectricianProfile { get; set; } = null!;
    public User Admin { get; set; } = null!;
}

