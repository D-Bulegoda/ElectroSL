using Microsoft.AspNetCore.Http;

namespace ElectroSL_Backend.DTOs.Auth;

public class RegisterElectricianFormDto
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? Qualification { get; set; }
    public IFormFile? Certificate { get; set; }
    public IFormFile? NicDocument { get; set; }
}