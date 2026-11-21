using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ElectroSL_Backend.Models;

/// <summary>
/// Immutable, append-only administrative audit log recording critical operations across
/// user management, technician verification, catalog management, job dispatch, and financial controls.
/// </summary>
public class AdminAuditLog
{
    [Key]
    public long AuditLogId { get; set; }

    /// <summary>
    /// Administrator who initiated the action.
    /// </summary>
    public int AdminUserId { get; set; }

    /// <summary>
    /// Type of administrative operation (e.g. UserActivated, TechnicianApproved, JobAssigned, PayoutRecorded, etc.).
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string ActionType { get; set; } = string.Empty;

    /// <summary>
    /// Name of affected domain entity (e.g. User, ElectricianProfile, Job, EquipmentCatalog, TechnicianPayoutRecord, WalletTransaction).
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string EntityType { get; set; } = string.Empty;

    /// <summary>
    /// Primary key or identifier of the affected entity.
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string EntityId { get; set; } = string.Empty;

    /// <summary>
    /// Human-readable operational description.
    /// </summary>
    [Required]
    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// JSON-serialized snapshot of previous values before mutation (where applicable).
    /// </summary>
    public string? OldValues { get; set; }

    /// <summary>
    /// JSON-serialized snapshot of new values after mutation (where applicable).
    /// </summary>
    public string? NewValues { get; set; }

    /// <summary>
    /// Mandatory administrative justification, dispute notes, or cancellation reason.
    /// </summary>
    [MaxLength(1000)]
    public string? Reason { get; set; }

    /// <summary>
    /// Originating IP address of the administrative client (if safely available).
    /// </summary>
    [MaxLength(50)]
    public string? IpAddress { get; set; }

    /// <summary>
    /// Exact UTC timestamp when the audit entry was created.
    /// </summary>
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    // Navigation property
    [ForeignKey("AdminUserId")]
    public virtual User AdminUser { get; set; } = null!;
}

