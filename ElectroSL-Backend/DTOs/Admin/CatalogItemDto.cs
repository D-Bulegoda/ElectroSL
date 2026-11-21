namespace ElectroSL_Backend.DTOs.Admin;

public class CatalogItemDto
{
    public int ItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = string.Empty;
    public string BrandName { get; set; } = string.Empty;
    public string Specification { get; set; } = string.Empty;
    public string Unit { get; set; } = "Unit";
    public decimal StandardMarketPrice { get; set; }
    public decimal PriceVarianceThreshold { get; set; } = 5.00m;
    public bool IsActive { get; set; } = true;
    public int ConcurrencyVersion { get; set; } = 1;
    public DateTime LastUpdated { get; set; }
}
