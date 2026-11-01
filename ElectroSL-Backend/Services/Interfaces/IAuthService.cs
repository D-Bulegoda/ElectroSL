namespace ElectroSL_Backend.Services.Interfaces;

public interface IAuthService
{
    Task<string> LoginAsync(string email, string password);
    Task<bool> VerifyOtpAsync(int userId, string otpCode);
}