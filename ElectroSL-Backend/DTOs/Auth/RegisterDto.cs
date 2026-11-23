
namespace ElectroSL_Backend.DTOs.Auth;

public class RegisterDto
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;

    // Customer or Electrician
    public string Role { get; set; } = "Customer";

    // Required for Electrician registration
    public string? NvqCertificateUrl { get; set; }
    public string? NicDocumentUrl { get; set; }
    public string? Specialization { get; set; }
}
