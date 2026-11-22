using System.ComponentModel.DataAnnotations;

namespace ElectroSL_Backend.DTOs.Admin;

public class SimulatorOverrideDto
{
    [Required(ErrorMessage = "A mandatory explanation for the simulator override is required.")]
    [MinLength(10, ErrorMessage = "Explanation must be at least 10 characters.")]
    [MaxLength(1000, ErrorMessage = "Explanation cannot exceed 1000 characters.")]
    public string Explanation { get; set; } = string.Empty;

    [Required(ErrorMessage = "A technical skill rating (1-5 stars) is mandatory before approval.")]
    [Range(1, 5, ErrorMessage = "Technical skill rating must be an integer between 1 and 5.")]
    public int TechnicalSkillRating { get; set; } = 3;

    [MaxLength(1000, ErrorMessage = "Assessment note cannot exceed 1000 characters.")]
    public string? AssessmentNote { get; set; }
}
