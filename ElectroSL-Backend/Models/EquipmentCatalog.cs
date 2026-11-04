using System.ComponentModel.DataAnnotations;

namespace ElectroSL_Backend.Models;

public class EquipmentCatalog
{
    [Key]
    public int ItemId { get; set; }
    public string Category { get; set; } = string.Empty;
    public string BrandName { get; set; } = string.Empty;
    public string Specification { get; set; } = string.Empty;
    public decimal StandardMarketPrice { get; set; }
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
}