using System;

namespace ElectroSL_Backend.DTOs.Admin;

public class EligibleElectricianDto
{
    public int UserId { get; set; }
    public int ProfileId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
    public string VerificationStatus { get; set; } = string.Empty;
    public bool IsApprovedByAdmin { get; set; }
    public bool IsOnline { get; set; }
    public double CurrentLat { get; set; }
    public double CurrentLng { get; set; }
    public double? DistanceKm { get; set; }
    public double AverageRating { get; set; }
    public int CompletedJobsCount { get; set; }
    public decimal AppWalletBalance { get; set; }
}

