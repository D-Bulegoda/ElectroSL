namespace ElectroSL_Backend.DTOs.Admin;

public class CatalogItemDto
{
    public int ItemId { get; set; }
    public string Category { get; set; } = string.Empty;
    public string BrandName { get; set; } = string.Empty;
    public string Specification { get; set; } = string.Empty;
    public decimal StandardMarketPrice { get; set; }
    public DateTime LastUpdated { get; set; }
}
