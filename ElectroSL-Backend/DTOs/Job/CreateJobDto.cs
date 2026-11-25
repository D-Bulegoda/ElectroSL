using System.ComponentModel.DataAnnotations;

namespace ElectroSL_Backend.DTOs.Job;

public class CreateJobDto
{
    public int CustomerId { get; set; }

    public string? Title { get; set; }

    public string? Category { get; set; }

    public string JobType { get; set; } = "Maintenance";

    [Required]
    public string Description { get; set; } = string.Empty;

    public double LocationLat { get; set; }

    public double LocationLng { get; set; }

    public string? PreferredDate { get; set; }

    public string? PreferredTime { get; set; }

    public bool IsEmergency { get; set; } = false;
}