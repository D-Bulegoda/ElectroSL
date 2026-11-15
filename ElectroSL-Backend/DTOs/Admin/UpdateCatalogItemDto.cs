using System.ComponentModel.DataAnnotations;

namespace ElectroSL_Backend.DTOs.Admin;

public class UpdateCatalogItemDto
{
    public string? Category { get; set; }
    public string? BrandName { get; set; }
    public string? Specification { get; set; }

    [Range(0.01, double.MaxValue, ErrorMessage = "Price must be greater than zero.")]
    public decimal? StandardMarketPrice { get; set; }
}
