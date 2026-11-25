namespace ElectroSL_Backend.DTOs.Auth;

public class RegistrationResultDto
{
    public global::ElectroSL_Backend.Models.User User { get; set; } = null!;

    public string OtpCode { get; set; } = string.Empty;
}