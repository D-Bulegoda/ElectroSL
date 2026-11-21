using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ElectroSL_Backend.Models;

public class Job
{
    [Key]
    public int JobId { get; set; }
    public int CustomerId { get; set; }
    public int? ElectricianId { get; set; }
    public string JobType { get; set; } = "Maintenance"; // or "NewConstruction"
    public string Description { get; set; } = string.Empty;
    public string VoiceNoteUrl { get; set; } = string.Empty;
    public double LocationLat { get; set; }
    public double LocationLng { get; set; }
    public string Status { get; set; } = "Pending"; 
    public string StartOTP { get; set; } = string.Empty; // 4-digit PIN
    public string FinalApprovalOTP { get; set; } = string.Empty; 
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsEmergency { get; set; } = false;

    // Phase 3 Task 3.3.1: Job Operations Database Foundation & Concurrency Token
    public int ConcurrencyVersion { get; set; } = 1;

    // Assignment Tracking
    public int? AssignedByAdminId { get; set; }
    public DateTime? AssignedAt { get; set; }

    // Cancellation Tracking
    public DateTime? CancelledAt { get; set; }
    public int? CancelledByUserId { get; set; }

    [MaxLength(500)]
    public string? CancellationReason { get; set; }

    // Dispute Tracking
    [MaxLength(500)]
    public string? DisputeReason { get; set; }
    public DateTime? DisputeResolvedAt { get; set; }

    [MaxLength(1000)]
    public string? DisputeResolutionNotes { get; set; }

    // Completion Tracking
    public DateTime? CompletedAt { get; set; }

    // Navigation Properties
    public User Customer { get; set; } = null!;
    public User? Electrician { get; set; }
    public User? AssignedByAdmin { get; set; }
    public User? CancelledByUser { get; set; }
    public ICollection<JobBid> JobBids { get; set; } = new List<JobBid>();
    public ICollection<JobUsedEquipment> JobUsedEquipments { get; set; } = new List<JobUsedEquipment>();
    public PaymentTransaction? PaymentTransaction { get; set; }
    public Review? Review { get; set; }
}