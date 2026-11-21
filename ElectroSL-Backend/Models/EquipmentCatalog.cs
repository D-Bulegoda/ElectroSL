using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ElectroSL_Backend.Models;

public class EquipmentCatalog
{
    [Key]
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
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public ICollection<JobUsedEquipment> JobUsedEquipments { get; set; } = new List<JobUsedEquipment>();
    public ICollection<EquipmentPriceHistory> PriceHistories { get; set; } = new List<EquipmentPriceHistory>();
}
