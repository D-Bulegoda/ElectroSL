namespace ElectroSL_Backend.DTOs.Job;

public class EquipmentClaimResponseDto
{
    public int Id { get; set; }
    public int JobId { get; set; }
    public int? CatalogItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal ClaimedPrice { get; set; }
    public decimal StandardMarketPrice { get; set; }
    public decimal PriceVarianceThreshold { get; set; }
    public decimal VariancePercentage { get; set; }
    public string Status { get; set; } = string.Empty; // "AutoApproved", "FlaggedForReview", "Legacy", "AdminApproved", "AdminRejected"
    public string ReceiptImageUrl { get; set; } = string.Empty;
    public decimal TotalClaimedAmount => ClaimedPrice * Quantity;
}

