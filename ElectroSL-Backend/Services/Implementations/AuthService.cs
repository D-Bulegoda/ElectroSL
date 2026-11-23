
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ElectroSL_Backend.Data;
using ElectroSL_Backend.DTOs.Auth;
using ElectroSL_Backend.Models;
using ElectroSL_Backend.Services.Interfaces;
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

    public async Task<string> RegisterAsync(RegisterDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name) ||
            string.IsNullOrWhiteSpace(dto.Email) ||
            string.IsNullOrWhiteSpace(dto.Phone) ||
            string.IsNullOrWhiteSpace(dto.Password))
        {
            throw new ArgumentException("All basic registration fields are required.");
        }

        if (dto.Password.Length < 8)
            throw new ArgumentException("Password must contain at least 8 characters.");

        string role = dto.Role.Trim();

        if (role != "Customer" && role != "Electrician")
            throw new ArgumentException("Only Customer and Electrician registration is allowed.");

        if (role == "Electrician" &&
            (string.IsNullOrWhiteSpace(dto.NvqCertificateUrl) ||
             string.IsNullOrWhiteSpace(dto.NicDocumentUrl) ||
             string.IsNullOrWhiteSpace(dto.Specialization)))
        {
            throw new ArgumentException(
                "Electricians must provide NVQ certificate, NIC document and specialization.");
        }

        string email = dto.Email.Trim().ToLowerInvariant();

        bool emailExists = await _context.Users
            .AnyAsync(u => u.Email.ToLower() == email);

        if (emailExists)
            throw new InvalidOperationException("An account with this email already exists.");

        var user = new User
        {
            Name = dto.Name.Trim(),
            Email = email,
            Phone = dto.Phone.Trim(),
            Role = role,
            CreatedAt = DateTime.UtcNow
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);

        if (role == "Electrician")
        {
            user.ElectricianProfile = new ElectricianProfile
            {
                NvqCertificateUrl = dto.NvqCertificateUrl!.Trim(),
                NicDocumentUrl = dto.NicDocumentUrl!.Trim(),
                Specialization = dto.Specialization!.Trim(),
                VerificationStatus = "Pending",
                IsApprovedByAdmin = false,
                IsOnline = false
            };
        }

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return "Registration successful.";
    }

    public async Task<string> LoginAsync(string email, string password)
    {
        if (string.IsNullOrWhiteSpace(email) ||
            string.IsNullOrWhiteSpace(password))
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        string normalizedEmail = email.Trim().ToLowerInvariant();

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);

        if (user == null)
            throw new UnauthorizedAccessException("Invalid email or password.");

        var result = _passwordHasher.VerifyHashedPassword(
            user, user.PasswordHash, password);

        if (result == PasswordVerificationResult.Failed)
            throw new UnauthorizedAccessException("Invalid email or password.");

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

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(secretKey));

        var credentials = new SigningCredentials(
            key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public async Task<bool> VerifyOtpAsync(int userId, string otpCode)
    {
        // Temporary placeholder. Real OTP verification is not implemented.
        return await Task.FromResult(false);
    }
}
