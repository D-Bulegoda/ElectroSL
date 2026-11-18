
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ElectroSL_Backend.Data;
using ElectroSL_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Security.Cryptography;
using ElectroSL_Backend.Models;

namespace ElectroSL_Backend.Services.Implementations;

public class AuthService : IAuthService
{
    private readonly ElectroSLDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly PasswordHasher<string> _passwordHasher = new();

    public AuthService(
        ElectroSLDbContext context,
        IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<string> LoginAsync(string email, string password)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == email);

        if (user == null)
            throw new UnauthorizedAccessException("Invalid email or password.");

        var verification = _passwordHasher.VerifyHashedPassword(
            user.Email,
            user.PasswordHash,
            password
        );

        if (verification == PasswordVerificationResult.Failed)
            throw new UnauthorizedAccessException("Invalid email or password.");

        var jwtKey = _configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("JWT key is missing.");

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtKey));

        var credentials = new SigningCredentials(
            key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(3),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public async Task<bool> VerifyOtpAsync(int userId, string otpCode)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null ||
            string.IsNullOrWhiteSpace(user.OtpCodeHash) ||
            user.OtpExpiryUtc == null ||
            user.OtpExpiryUtc <= DateTime.UtcNow)
        {
            return false;
        }

        var result = _passwordHasher.VerifyHashedPassword(
            user.Email,
            user.OtpCodeHash,
            otpCode
        );

        if (result == PasswordVerificationResult.Failed)
            return false;

        user.IsPhoneVerified = true;
        user.OtpCodeHash = null;
        user.OtpExpiryUtc = null;

        await _context.SaveChangesAsync();

        return true;
    }



public async Task<(int UserId, string OtpCode)> RegisterAsync(
    string name,
    string email,
    string password,
    string phone,
    string role)
{
    if (string.IsNullOrWhiteSpace(name) ||
        string.IsNullOrWhiteSpace(email) ||
        string.IsNullOrWhiteSpace(password) ||
        string.IsNullOrWhiteSpace(phone) ||
        string.IsNullOrWhiteSpace(role))
    {
        throw new ArgumentException("All registration fields are required.");
    }

    name = name.Trim();
    email = email.Trim().ToLowerInvariant();
    phone = phone.Trim();
    role = role.Trim();

    if (password.Length < 8)
        throw new ArgumentException("Password must contain at least 8 characters.");

    if (role != "Customer" && role != "Electrician")
        throw new ArgumentException("Invalid registration role.");

    var existingUser = await _context.Users
        .AnyAsync(u => u.Email.ToLower() == email);

    if (existingUser)
        throw new InvalidOperationException("Email is already registered.");

    var user = new User
    {
        Name = name,
        Email = email,
        Phone = phone,
        Role = role,
        IsPhoneVerified = false,
        CreatedAt = DateTime.UtcNow
    };

    user.PasswordHash = _passwordHasher.HashPassword(
        user.Email,
        password
    );

    var otpCode = RandomNumberGenerator.GetInt32(1000, 10000).ToString();

    user.OtpCodeHash = _passwordHasher.HashPassword(
        user.Email,
        otpCode
    );

    user.OtpExpiryUtc = DateTime.UtcNow.AddMinutes(5);

    _context.Users.Add(user);
    await _context.SaveChangesAsync();

    return (user.UserId, otpCode);
}


}
