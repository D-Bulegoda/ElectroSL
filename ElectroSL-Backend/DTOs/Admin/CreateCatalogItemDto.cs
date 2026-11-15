using System.ComponentModel.DataAnnotations;

namespace ElectroSL_Backend.DTOs.Admin;

public class CreateCatalogItemDto
{
    [Required(ErrorMessage = "Category is required.")]
    public string Category { get; set; } = string.Empty;

    [Required(ErrorMessage = "Brand name is required.")]
    public string BrandName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Specification is required.")]
    public string Specification { get; set; } = string.Empty;

    [Required(ErrorMessage = "Standard market price is required.")]
    [Range(0.01, double.MaxValue, ErrorMessage = "Price must be greater than zero.")]
    public decimal StandardMarketPrice { get; set; }
}
