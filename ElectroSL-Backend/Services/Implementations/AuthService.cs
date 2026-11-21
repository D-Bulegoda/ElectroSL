using ElectroSL_Backend.Data;
using ElectroSL_Backend.DTOs.Auth;
using ElectroSL_Backend.Models;
using ElectroSL_Backend.Services.Interfaces;
using ElectroSL_Backend.Utilities;
using Microsoft.EntityFrameworkCore;

namespace ElectroSL_Backend.Services.Implementations;

public class AuthService : IAuthService
{
    private readonly ElectroSLDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(ElectroSLDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<AuthResponseDto?> LoginAsync(string email, string password)
    {
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            return null;
        }

        var normalizedEmail = email.Trim().ToLowerInvariant();
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);

        if (user == null)
        {
            return null;
        }

        bool isPasswordValid = false;
        try
        {
            isPasswordValid = BCrypt.Net.BCrypt.Verify(password, user.PasswordHash);
        }
        catch (Exception)
        {
            // In case of invalid salt format in legacy record, verification fails securely
            isPasswordValid = false;
        }

        if (!isPasswordValid)
        {
            return null;
        }

        // Account status enforcement: Inactive and suspended users cannot log in
        if (!user.IsActive || user.AccountStatus == "Suspended" || user.AccountStatus == "Inactive")
        {
            var status = user.AccountStatus ?? "Inactive";
            var reason = !string.IsNullOrWhiteSpace(user.SuspensionReason)
                ? user.SuspensionReason
                : "Your account is not active. Please contact customer support.";
            throw new AccountStatusException(status, user.SuspensionReason, $"Account is {status.ToLowerInvariant()}. {reason}");
        }

        var secretKey = _configuration["JwtSettings:SecretKey"] 
            ?? "ElectroSL_Super_Secret_Key_Must_Be_At_Least_32_Chars_Long!";
        var issuer = _configuration["JwtSettings:Issuer"] ?? "ElectroSL";
        var audience = _configuration["JwtSettings:Audience"] ?? "ElectroSL_Clients";
        var expiryMinutes = 120;
        if (int.TryParse(_configuration["JwtSettings:ExpiryMinutes"], out var parsedExpiry))
        {
            expiryMinutes = parsedExpiry;
        }

        var token = JwtTokenGenerator.GenerateToken(
            user.UserId,
            user.Email,
            user.Role,
            secretKey,
            issuer,
            audience,
            expiryMinutes
        );

        return new AuthResponseDto
        {
            Token = token,
            Role = user.Role,
            UserId = user.UserId,
            Name = user.Name,
            Email = user.Email
        };
    }

    public async Task<bool> VerifyOtpAsync(int userId, string otpCode)
    {
        if (string.IsNullOrWhiteSpace(otpCode)) return false;

        var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);
        if (user == null) return false;

        // If OTP expired, reject
        if (user.OtpExpiryUtc.HasValue && user.OtpExpiryUtc.Value < DateTime.UtcNow)
        {
            return false;
        }

        bool isValid = false;
        if (!string.IsNullOrWhiteSpace(user.OtpCodeHash))
        {
            try
            {
                isValid = BCrypt.Net.BCrypt.Verify(otpCode, user.OtpCodeHash);
            }
            catch
            {
                isValid = false;
            }
        }

        if (isValid)
        {
            user.IsPhoneVerified = true;
            user.OtpCodeHash = null;
            user.OtpExpiryUtc = null;
            await _context.SaveChangesAsync();
        }

        return isValid;
    }

    public async Task<User?> RegisterUserAsync(RegisterDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
        {
            return null;
        }

        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
        bool exists = await _context.Users.AnyAsync(u => u.Email.ToLower() == normalizedEmail);
        if (exists)
        {
            return null;
        }

        var user = new User
        {
            Name = dto.Name?.Trim() ?? string.Empty,
            Email = normalizedEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = string.IsNullOrWhiteSpace(dto.Role) ? "Customer" : dto.Role,
            Phone = dto.Phone?.Trim() ?? string.Empty,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        if (user.Role == "Electrician")
        {
            var profile = new ElectricianProfile
            {
                UserId = user.UserId,
                VerificationStatus = "Pending",
                Specialization = "General Electrician"
            };
            _context.ElectricianProfiles.Add(profile);
            await _context.SaveChangesAsync();
        }

        return user;
    }
}
