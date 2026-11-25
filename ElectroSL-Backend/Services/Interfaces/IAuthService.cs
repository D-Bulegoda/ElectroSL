using ElectroSL_Backend.DTOs.Auth;
using ElectroSL_Backend.Models;


namespace ElectroSL_Backend.Services.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto?> LoginAsync(string email, string password);
    Task<bool> VerifyOtpAsync(int userId, string otpCode);
    Task<RegistrationResultDto?> RegisterUserAsync(RegisterDto dto);
}
