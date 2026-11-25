using System;

namespace ElectroSL_Backend.DTOs.Admin;

public class AdminJobListItemDto
{
    public int JobId { get; set; }
    public string JobType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public bool IsEmergency { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public double LocationLat { get; set; }
    public double LocationLng { get; set; }
    public int ConcurrencyVersion { get; set; }

    // Customer Summary
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;

    // Electrician Summary (Nullable)
    public int? ElectricianId { get; set; }
    public string? ElectricianName { get; set; }
    public string? ElectricianEmail { get; set; }
    public string? ElectricianPhone { get; set; }
    public string? ElectricianSpecialization { get; set; }

    // Counts & Financials
    public int BidsCount { get; set; }
    public int EquipmentClaimsCount { get; set; }
    public decimal? TotalAmount { get; set; }
}

