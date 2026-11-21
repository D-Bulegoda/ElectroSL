using System;
using System.ComponentModel.DataAnnotations;

namespace ElectroSL_Backend.Models;

public class EquipmentPriceHistory
{
    [Key]
    public int Id { get; set; }

    public int CatalogItemId { get; set; }

    public decimal OldPrice { get; set; }

    public decimal NewPrice { get; set; }

    public decimal ChangePercentage { get; set; }

    public string? Reason { get; set; }

    public int ChangedByAdminId { get; set; }

    public DateTime EffectiveDateUtc { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public EquipmentCatalog EquipmentCatalog { get; set; } = null!;
    public User ChangedByAdmin { get; set; } = null!;
}

