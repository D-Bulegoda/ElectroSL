using System.ComponentModel.DataAnnotations;

namespace ElectroSL_Backend.DTOs.Admin;

public class RejectApplicationDto
{
    [Required(ErrorMessage = "A rejection reason is required.")]
    [MinLength(10, ErrorMessage = "Rejection reason must be at least 10 characters.")]
    public string Reason { get; set; } = string.Empty;
}
