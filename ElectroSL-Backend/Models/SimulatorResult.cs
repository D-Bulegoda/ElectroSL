using System;
using System.ComponentModel.DataAnnotations;

namespace ElectroSL_Backend.Models;

public class SimulatorResult
{
    [Key]
    public int Id { get; set; }
    public int ElectricianId { get; set; }
    
    // Updated to match SimulatorController expectations
    public decimal Score { get; set; }
    public string TaskConfigurationJson { get; set; } = string.Empty;
    public DateTime CompletedAtUtc { get; set; } = DateTime.UtcNow;

    // Retained Imashi's fields for future assessment tracking
    public int TimeTakenSeconds { get; set; }
    public int SafetyMistakesCount { get; set; }
    public bool IsPassed { get; set; }

    // Navigation Property
    public User Electrician { get; set; } = null!;
}