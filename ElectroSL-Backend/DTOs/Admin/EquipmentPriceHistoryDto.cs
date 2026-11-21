using System;

namespace ElectroSL_Backend.DTOs.Admin;

public class EquipmentPriceHistoryDto
{
    public int Id { get; set; }
    public int CatalogItemId { get; set; }
    public decimal OldPrice { get; set; }
    public decimal NewPrice { get; set; }
    public decimal ChangePercentage { get; set; }
    public string? Reason { get; set; }
    public int ChangedByAdminId { get; set; }
    public string AdminName { get; set; } = string.Empty;
    public string AdminEmail { get; set; } = string.Empty;
    public DateTime EffectiveDateUtc { get; set; }
}

