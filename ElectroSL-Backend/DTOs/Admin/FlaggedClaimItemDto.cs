using System;

namespace ElectroSL_Backend.DTOs.Admin;

public class FlaggedClaimItemDto
{
    public int Id { get; set; }
    public int JobId { get; set; }
    public string JobType { get; set; } = string.Empty;
    public string JobDescription { get; set; } = string.Empty;
    public DateTime JobCreatedAt { get; set; }

    // Electrician info
    public int? ElectricianId { get; set; }
    public string ElectricianName { get; set; } = string.Empty;
    public string ElectricianEmail { get; set; } = string.Empty;

    // Customer info
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;

    // Catalog & claim info
    public int? CatalogItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal ClaimedPrice { get; set; }
    public decimal TotalClaimedAmount => ClaimedPrice * Quantity;
    public decimal StandardMarketPrice { get; set; }
    public decimal PriceVarianceThreshold { get; set; }
    public decimal VariancePercentage { get; set; }
    public string ReceiptImageUrl { get; set; } = string.Empty;

    // Status & Audit
    public string Status { get; set; } = string.Empty;
    public string? AdminReviewNotes { get; set; }
    public int? ReviewedByAdminId { get; set; }
    public string? ReviewedByAdminName { get; set; }
    public DateTime? ReviewedAt { get; set; }
}
