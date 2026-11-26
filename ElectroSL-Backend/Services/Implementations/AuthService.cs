using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using ElectroSL_Backend.Data;
using ElectroSL_Backend.DTOs.Auth;
using ElectroSL_Backend.Models;
using ElectroSL_Backend.Services.Interfaces;
using ElectroSL_Backend.Utilities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;


namespace ElectroSL_Backend.Services.Implementations;

public class AuthService : IAuthService
{
    private readonly ElectroSLDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IPasswordHasher<User> _passwordHasher;

    public AuthService(
        ElectroSLDbContext context,
        IConfiguration configuration,
        IPasswordHasher<User> passwordHasher)
    {
        _context = context;
        _configuration = configuration;
        _passwordHasher = passwordHasher;
    }

    public async Task<RegistrationResultDto?> RegisterUserAsync(RegisterDto dto)
    {
        string email = dto.Email.Trim().ToLowerInvariant();

        bool emailExists = await _context.Users
            .AnyAsync(u => u.Email.ToLower() == email);

        if (emailExists)
            return null;

        string role = string.IsNullOrWhiteSpace(dto.Role) ? "Customer" : dto.Role.Trim();

        var user = new User
        {
            Name = dto.Name.Trim(),
            Email = email,
            Phone = dto.Phone?.Trim() ?? string.Empty,
            Role = role,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            CreatedAt = DateTime.UtcNow
        };

        // Generate a secure 6-digit OTP
        string otpCode = RandomNumberGenerator
            .GetInt32(100000, 1000000)
            .ToString();

        user.OtpCodeHash = Convert.ToHexString(
            SHA256.HashData(Encoding.UTF8.GetBytes(otpCode))
        );
        user.OtpExpiryUtc = DateTime.UtcNow.AddMinutes(5);

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return new RegistrationResultDto
        {
            User = user,
            OtpCode = otpCode
        };;
    }

    public async Task<AuthResponseDto?> LoginAsync(string email, string password)
    {
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
            return null;

        string normalizedEmail = email.Trim().ToLowerInvariant();

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);

        if (user == null)
            return null;

        bool isPasswordValid = user.PasswordHash.StartsWith("$2")
            ? BCrypt.Net.BCrypt.Verify(password, user.PasswordHash)
            : _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, password) != PasswordVerificationResult.Failed;

        if (!isPasswordValid)
            return null;

       if (!user.IsActive || user.AccountStatus != "Active")
        {
            throw new AccountStatusException(
                user.AccountStatus,
                user.SuspensionReason,
                $"Your account is {user.AccountStatus.ToLowerInvariant()}.");
        }

        var jwtSettings = _configuration.GetSection("JwtSettings");

        string secretKey = jwtSettings["SecretKey"]
            ?? throw new InvalidOperationException("JWT SecretKey is missing.");
        string issuer = jwtSettings["Issuer"]
            ?? throw new InvalidOperationException("JWT Issuer is missing.");
        string audience = jwtSettings["Audience"]
            ?? throw new InvalidOperationException("JWT Audience is missing.");
        int expiryMinutes = int.TryParse(
            jwtSettings["ExpiryMinutes"], out int minutes) ? minutes : 120;

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: credentials);

        return new AuthResponseDto
        {
            Token = new JwtSecurityTokenHandler().WriteToken(token),
            UserId = user.UserId,
            Name = user.Name,
            Email = user.Email,
            Role = user.Role
        };
    }

    public async Task<string?> GenerateOtpAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);

        if (user == null)
        {
            return null;
        }

        string otpCode = RandomNumberGenerator
            .GetInt32(100000, 1000000)
            .ToString();

        user.OtpCodeHash = Convert.ToHexString(
            SHA256.HashData(Encoding.UTF8.GetBytes(otpCode))
        );

        user.OtpExpiryUtc = DateTime.UtcNow.AddMinutes(5);

        await _context.SaveChangesAsync();

        return otpCode;
    }

    public async Task<bool> VerifyOtpAsync(int userId, string otpCode)
    {
        if (string.IsNullOrWhiteSpace(otpCode))
            return false;

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null || user.IsPhoneVerified)
            return false;

        if (string.IsNullOrWhiteSpace(user.OtpCodeHash) ||
            user.OtpExpiryUtc == null)
            return false;

        if (DateTime.UtcNow > user.OtpExpiryUtc.Value)
            return false;

        string hashedOtp = Convert.ToHexString(
            SHA256.HashData(Encoding.UTF8.GetBytes(otpCode.Trim()))
        );

        byte[] storedHash;
        byte[] enteredHash;

        try
        {
            storedHash = Convert.FromHexString(user.OtpCodeHash);
            enteredHash = Convert.FromHexString(hashedOtp);
        }
        catch (FormatException)
        {
            return false;
        }

        if (!CryptographicOperations.FixedTimeEquals(storedHash, enteredHash))
            return false;

        user.IsPhoneVerified = true;
        user.OtpCodeHash = null;
        user.OtpExpiryUtc = null;

        await _context.SaveChangesAsync();

        return true;
    }
}