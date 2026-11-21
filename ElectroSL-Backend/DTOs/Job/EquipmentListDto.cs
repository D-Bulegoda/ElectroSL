using System.ComponentModel.DataAnnotations;

namespace ElectroSL_Backend.DTOs.Job;

public class EquipmentListDto
{
    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "Valid JobId is required.")]
    public int JobId { get; set; }

    [Required]
    public List<EquipmentItemDto> Items { get; set; } = new();
}

public class EquipmentItemDto
{
    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "Valid CatalogItemId is required.")]
    public int CatalogItemId { get; set; }

    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1.")]
    public int Quantity { get; set; }

    [Required]
    [Range(0.01, 10000000.0, ErrorMessage = "Claimed price must be greater than zero.")]
    public decimal ClaimedPrice { get; set; }

    public string? ReceiptImageUrl { get; set; }
}
