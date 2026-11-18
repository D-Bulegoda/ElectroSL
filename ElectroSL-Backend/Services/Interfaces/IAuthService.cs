
namespace ElectroSL_Backend.Services.Interfaces;

public interface IAuthService
{
    Task<string> LoginAsync(string email, string password);

    Task<bool> VerifyOtpAsync(int userId, string otpCode);

    Task<(int UserId, string OtpCode)> RegisterAsync(
        string name,
        string email,
        string password,
        string phone,
        string role
    );
}
