using ElectroSL_Backend.Services.Interfaces;

namespace ElectroSL_Backend.Services.Implementations;

public class AuthService : IAuthService
{
    public async Task<string> LoginAsync(string email, string password)
    {
        // Placeholder: Validate user and return JWT
        return await Task.FromResult("jwt_token_placeholder");
    }

    public async Task<bool> VerifyOtpAsync(int userId, string otpCode)
    {
        return await Task.FromResult(otpCode == "1234");
    }
}