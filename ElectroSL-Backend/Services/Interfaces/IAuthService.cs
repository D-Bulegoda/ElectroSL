
using ElectroSL_Backend.DTOs.Auth;

namespace ElectroSL_Backend.Services.Interfaces;

public interface IAuthService
{
    Task<string> RegisterAsync(RegisterDto registerDto);
    Task<string> LoginAsync(string email, string password);
    Task<bool> VerifyOtpAsync(int userId, string otpCode);
}
