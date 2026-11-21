using System.ComponentModel.DataAnnotations;

namespace ElectroSL_Backend.DTOs.Admin;

public class CreateCatalogItemDto
{
    public string? ItemName { get; set; }

    public string? Description { get; set; }

    [Required(ErrorMessage = "Category is required.")]
    public string Category { get; set; } = string.Empty;

    [Required(ErrorMessage = "Brand name is required.")]
    public string BrandName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Specification is required.")]
    public string Specification { get; set; } = string.Empty;

    public string Unit { get; set; } = "Unit";

    [Required(ErrorMessage = "Standard market price is required.")]
    [Range(0.01, double.MaxValue, ErrorMessage = "Price must be greater than zero.")]
    public decimal StandardMarketPrice { get; set; }

    [Range(0.01, 100.0, ErrorMessage = "Price variance threshold must be between 0.01% and 100%.")]
    public decimal PriceVarianceThreshold { get; set; } = 5.00m;
}
