using System;
using System.Collections.Generic;

namespace ElectroSL_Backend.DTOs.Admin;

public class AdminJobDetailDto
{
    public int JobId { get; set; }
    public string JobType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string VoiceNoteUrl { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public bool IsEmergency { get; set; }
    public double LocationLat { get; set; }
    public double LocationLng { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int ConcurrencyVersion { get; set; }

    // Assignment Audit
    public int? AssignedByAdminId { get; set; }
    public string? AssignedByAdminName { get; set; }
    public DateTime? AssignedAt { get; set; }

    // Cancellation Audit
    public int? CancelledByUserId { get; set; }
    public string? CancelledByUserName { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string? CancellationReason { get; set; }

    // Dispute Audit
    public string? DisputeReason { get; set; }
    public DateTime? DisputeResolvedAt { get; set; }
    public string? DisputeResolutionNotes { get; set; }

    // Customer Dossier
    public JobCustomerInfoDto Customer { get; set; } = null!;

    // Electrician Dossier (if assigned)
    public JobElectricianInfoDto? Electrician { get; set; }

    // Associated Entities
    public List<JobBidItemDto> Bids { get; set; } = new();
    public List<JobEquipmentClaimDto> EquipmentClaims { get; set; } = new();
    public JobPaymentInfoDto? Payment { get; set; }
    public JobReviewInfoDto? Review { get; set; }
}

public class JobCustomerInfoDto
{
    public int CustomerId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string AccountStatus { get; set; } = string.Empty;
}

public class JobElectricianInfoDto
{
    public int ElectricianId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
    public string VerificationStatus { get; set; } = string.Empty;
    public bool IsApprovedByAdmin { get; set; }
    public bool IsOnline { get; set; }
    public double AverageRating { get; set; }
}

public class JobBidItemDto
{
    public int BidId { get; set; }
    public int ElectricianId { get; set; }
    public string ElectricianName { get; set; } = string.Empty;
    public string ElectricianPhone { get; set; } = string.Empty;
    public decimal EstimatedAmount { get; set; }
    public string Remarks { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; }
}

public class JobEquipmentClaimDto
{
    public int Id { get; set; }
    public int? CatalogItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal ClaimedPrice { get; set; }
    public decimal? StandardMarketPrice { get; set; }
    public decimal? VariancePercentage { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? AdminReviewNotes { get; set; }
    public string? ReceiptAttachmentUrl { get; set; }
}

public class JobPaymentInfoDto
{
    public int TransactionId { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PlatformCommission { get; set; }
    public decimal ElectricianEarning { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; }
}

public class JobReviewInfoDto
{
    public int ReviewId { get; set; }
    public decimal Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
}

