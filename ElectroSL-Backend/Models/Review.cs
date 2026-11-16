using System.ComponentModel.DataAnnotations;

namespace ElectroSL_Backend.Models;

public class Review
{
    [Key]
    public int ReviewId { get; set; }
    public int JobId { get; set; }
    public int ElectricianId { get; set; }
    public decimal Rating { get; set; } // e.g., 4.8
    public string Comment { get; set; } = string.Empty;

    // Navigation Properties
    public Job Job { get; set; } = null!;
    public User Electrician { get; set; } = null!;
}