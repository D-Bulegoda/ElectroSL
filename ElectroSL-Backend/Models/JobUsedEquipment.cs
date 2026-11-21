using System;
using System.ComponentModel.DataAnnotations;

namespace ElectroSL_Backend.Models;

public class JobUsedEquipment
{
    [Key]
    public int Id { get; set; }
    public int JobId { get; set; }
    public int? CatalogItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public decimal ClaimedPrice { get; set; }
    public int Quantity { get; set; }
    public decimal VariancePercentage { get; set; } // Flagged if > 5%
    public string ReceiptImageUrl { get; set; } = string.Empty;

    // Phase 2 Review Workflow Properties
    public string Status { get; set; } = "AutoApproved"; // Legacy (historical records), AutoApproved, FlaggedForReview, AdminApproved, AdminRejected
    public string? AdminReviewNotes { get; set; }
    public int? ReviewedByAdminId { get; set; }
    public DateTime? ReviewedAt { get; set; }

    // Navigation Properties
    public Job Job { get; set; } = null!;
    public EquipmentCatalog? EquipmentCatalog { get; set; }
    public User? ReviewedByAdmin { get; set; }
}
