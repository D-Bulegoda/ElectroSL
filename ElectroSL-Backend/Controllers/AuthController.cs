using ElectroSL_Backend.Data;
using ElectroSL_Backend.DTOs.Auth;
using ElectroSL_Backend.Models;
using ElectroSL_Backend.Services.Interfaces;
using ElectroSL_Backend.Utilities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ElectroSL_Backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IDocumentStorageService _documentStorageService;
    private readonly ElectroSLDbContext _context;

    public AuthController(
        IAuthService authService,
        IDocumentStorageService documentStorageService,
        ElectroSLDbContext context)
    {
        _authService = authService;
        _documentStorageService = documentStorageService;
        _context = context;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
        {
            return BadRequest(new { message = "Email and password are required." });
        }

        try
        {
            var authResult = await _authService.LoginAsync(dto.Email, dto.Password);

            if (authResult == null)
            {
                return Unauthorized(new { message = "Invalid email or password." });
            }

            return Ok(authResult);
        }
        catch (AccountStatusException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                message = ex.Message,
                accountStatus = ex.Status,
                suspensionReason = ex.Reason
            });
        }
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
        {
            return BadRequest(new { message = "Name, email and password are required." });
        }

        var user = await _authService.RegisterUserAsync(dto);
        if (user == null)
        {
            return BadRequest(new { message = "A user with this email already exists." });
        }

        return Ok(new { success = true, userId = user.UserId, message = "Registration successful." });
    }

    [HttpPost("register-electrician")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> RegisterElectrician(
        [FromForm] string fullName,
        [FromForm] string email,
        [FromForm] string password,
        [FromForm] string phone,
        [FromForm] string? address,
        [FromForm] string? qualification,
        [FromForm] IFormFile? certificate,
        [FromForm] IFormFile? nicDocument)
    {
        if (string.IsNullOrWhiteSpace(fullName) || string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            return BadRequest(new { message = "Full name, email and password are required." });
        }

        var normalizedEmail = email.Trim().ToLowerInvariant();
        bool exists = await _context.Users.AnyAsync(u => u.Email.ToLower() == normalizedEmail);
        if (exists)
        {
            return BadRequest(new { message = "An account with this email address already exists." });
        }

        string nvqStorageKey = string.Empty;
        string nicStorageKey = string.Empty;

        try
        {
            if (certificate != null && certificate.Length > 0)
            {
                nvqStorageKey = await _documentStorageService.SaveDocumentAsync(certificate, "nvq");
            }

            if (nicDocument != null && nicDocument.Length > 0)
            {
                nicStorageKey = await _documentStorageService.SaveDocumentAsync(nicDocument, "nic");
            }
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Document processing failed: {ex.Message}" });
        }

        var user = new User
        {
            Name = fullName.Trim(),
            Email = normalizedEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Role = "Electrician",
            Phone = phone?.Trim() ?? string.Empty,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var profile = new ElectricianProfile
        {
            UserId = user.UserId,
            Specialization = qualification ?? "General Electrician",
            NvqCertificateUrl = nvqStorageKey,
            NicDocumentUrl = nicStorageKey,
            VerificationStatus = "Pending"
        };

        _context.ElectricianProfiles.Add(profile);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            userId = user.UserId,
            profileId = profile.ProfileId,
            message = "Electrician registration submitted successfully. Application is pending admin review."
        });
    }

    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.OtpCode))
        {
            return BadRequest(new { message = "OTP code is required." });
        }

        var success = await _authService.VerifyOtpAsync(1, dto.OtpCode);
        if (!success)
        {
            return BadRequest(new { message = "Invalid or expired OTP." });
        }

        return Ok(new { success = true, message = "OTP verified successfully." });
    }
}
using System.Threading.Tasks;
using ElectroSL_Backend.Data;
using ElectroSL_Backend.DTOs.Auth;
using ElectroSL_Backend.Services.Interfaces;
using ElectroSL_Backend.Utilities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace ElectroSL_Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ElectroSLDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(IAuthService authService, ElectroSLDbContext context, IConfiguration configuration)
        {
            _authService = authService;
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email))
            {
                return BadRequest(new { message = "Email is required." });
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.ToLower());
            string role = user?.Role ?? (dto.Email.Contains("admin", System.StringComparison.OrdinalIgnoreCase) ? "Admin" : "Electrician");
            int userId = user?.UserId ?? 1;

            var secretKey = _configuration["JwtSettings:SecretKey"] ?? "ElectroSL_Super_Secret_Key_Change_This_In_Production";
            var token = JwtTokenGenerator.GenerateToken(userId, role, secretKey);

            return Ok(new
            {
                success = true,
                token,
                role,
                userId,
                email = dto.Email,
                name = user?.Name ?? (role == "Admin" ? "System Administrator" : "Electrician User")
            });
        }

        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpDto dto)
        {
            var isValid = await _authService.VerifyOtpAsync(dto.UserId, dto.OtpCode);
            return Ok(new { success = isValid });
        }
    }
}
