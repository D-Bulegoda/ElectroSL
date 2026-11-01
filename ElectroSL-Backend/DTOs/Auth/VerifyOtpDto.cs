namespace ElectroSL_Backend.DTOs.Auth;

public class VerifyOtpDto
{
    public int UserId { get; set; }
    public string OtpCode { get; set; } = string.Empty;
}