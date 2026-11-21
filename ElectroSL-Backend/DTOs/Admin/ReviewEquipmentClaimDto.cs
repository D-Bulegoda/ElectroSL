using System.ComponentModel.DataAnnotations;

namespace ElectroSL_Backend.DTOs.Admin;

public class ReviewEquipmentClaimDto
{
    [MaxLength(1000, ErrorMessage = "Review notes cannot exceed 1000 characters.")]
    public string? ReviewNotes { get; set; }
}
