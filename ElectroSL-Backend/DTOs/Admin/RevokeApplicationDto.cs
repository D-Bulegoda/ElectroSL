using System.ComponentModel.DataAnnotations;

namespace ElectroSL_Backend.DTOs.Admin;

public class RevokeApplicationDto
{
    [Required(ErrorMessage = "A revocation reason is mandatory.")]
    [MinLength(10, ErrorMessage = "Revocation reason must be at least 10 characters.")]
    [MaxLength(1000, ErrorMessage = "Revocation reason cannot exceed 1000 characters.")]
    public string Reason { get; set; } = string.Empty;
}

