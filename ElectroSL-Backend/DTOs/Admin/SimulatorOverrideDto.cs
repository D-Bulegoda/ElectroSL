using System.ComponentModel.DataAnnotations;

namespace ElectroSL_Backend.DTOs.Admin;

public class SimulatorOverrideDto
{
    [Required(ErrorMessage = "A mandatory explanation for the simulator override is required.")]
    [MinLength(10, ErrorMessage = "Explanation must be at least 10 characters.")]
    [MaxLength(1000, ErrorMessage = "Explanation cannot exceed 1000 characters.")]
    public string Explanation { get; set; } = string.Empty;
}

