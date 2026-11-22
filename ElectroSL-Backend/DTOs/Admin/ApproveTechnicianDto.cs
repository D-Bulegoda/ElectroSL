using System.ComponentModel.DataAnnotations;

namespace ElectroSL_Backend.DTOs.Admin;

public class ApproveTechnicianDto
{
    [Required(ErrorMessage = "A technical skill rating (1-5 stars) is mandatory before approval.")]
    [Range(1, 5, ErrorMessage = "Technical skill rating must be an integer between 1 and 5.")]
    public int TechnicalSkillRating { get; set; }

    [MaxLength(1000, ErrorMessage = "Assessment note cannot exceed 1000 characters.")]
    public string? AssessmentNote { get; set; }
}

