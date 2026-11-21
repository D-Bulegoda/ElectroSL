using System.ComponentModel.DataAnnotations;

namespace ElectroSL_Backend.DTOs.Admin;

public class UpdateCatalogItemDto
{
    public string? ItemName { get; set; }
    public string? Description { get; set; }
    public string? Category { get; set; }
    public string? BrandName { get; set; }
    public string? Specification { get; set; }
    public string? Unit { get; set; }
    public bool? IsActive { get; set; }

    [Range(0.01, double.MaxValue, ErrorMessage = "Price must be greater than zero.")]
    public decimal? StandardMarketPrice { get; set; }

    [Range(0.01, 100.0, ErrorMessage = "Price variance threshold must be between 0.01% and 100%.")]
    public decimal? PriceVarianceThreshold { get; set; }

    public string? Reason { get; set; }

    public int? ConcurrencyVersion { get; set; }
}
