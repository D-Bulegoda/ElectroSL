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
        if (dto == null ||
            string.IsNullOrWhiteSpace(dto.Email) ||
            string.IsNullOrWhiteSpace(dto.Password))
        {
            return BadRequest(new
            {
                message = "Email and password are required."
            });
        }

        try
        {
            var authResult = await _authService.LoginAsync(dto.Email, dto.Password);

            if (authResult == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid email or password."
                });
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
        if (dto == null ||
            string.IsNullOrWhiteSpace(dto.Email) ||
            string.IsNullOrWhiteSpace(dto.Password))
        {
            return BadRequest(new
            {
                message = "Name, email and password are required."
            });
        }

        var user = await _authService.RegisterUserAsync(dto);

        if (user == null)
        {
            return BadRequest(new
            {
                message = "A user with this email already exists."
            });
        }

        return Ok(new
        {
            success = true,
            userId = user.UserId,
            message = "Registration successful."
        });
    }

    [HttpPost("register-electrician")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> RegisterElectrician([FromForm] RegisterElectricianFormDto dto)
    {
        if (dto == null ||
            string.IsNullOrWhiteSpace(dto.FullName) ||
            string.IsNullOrWhiteSpace(dto.Email) ||
            string.IsNullOrWhiteSpace(dto.Password))
        {
            return BadRequest(new
            {
                message = "Full name, email and password are required."
            });
        }

        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();

        var exists = await _context.Users
            .AnyAsync(u => u.Email.ToLower() == normalizedEmail);

        if (exists)
        {
            return BadRequest(new
            {
                message = "An account with this email address already exists."
            });
        }

        string nvqStorageKey = string.Empty;
        string nicStorageKey = string.Empty;

        try
        {
            if (dto.Certificate != null && dto.Certificate.Length > 0)
            {
                nvqStorageKey =
                    await _documentStorageService.SaveDocumentAsync(
                        dto.Certificate,
                        "nvq");
            }

            if (dto.NicDocument != null && dto.NicDocument.Length > 0)
            {
                nicStorageKey =
                    await _documentStorageService.SaveDocumentAsync(
                        dto.NicDocument,
                        "nic");
            }
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = $"Document processing failed: {ex.Message}"
            });
        }

        var user = new User
        {
            Name = dto.FullName.Trim(),
            Email = normalizedEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = "Electrician",
            Phone = dto.Phone?.Trim() ?? string.Empty,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var profile = new ElectricianProfile
        {
            UserId = user.UserId,
            Specialization = dto.Qualification ?? "General Electrician",
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
            message =
                "Electrician registration submitted successfully. Application is pending admin review."
        });
    }

    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.OtpCode))
        {
            return BadRequest(new
            {
                message = "OTP code is required."
            });
        }

        var success = await _authService.VerifyOtpAsync(1, dto.OtpCode);

        if (!success)
        {
            return BadRequest(new
            {
                message = "Invalid or expired OTP."
            });
        }

        return Ok(new
        {
            success = true,
            message = "OTP verified successfully."
        });
    }
}