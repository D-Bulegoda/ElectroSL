using System.ComponentModel.DataAnnotations;

namespace ElectroSL_Backend.DTOs.Admin;

public class UserStatusChangeDto
{
    public int? ConcurrencyVersion { get; set; }

    [MaxLength(500)]
    public string? Reason { get; set; }
}

