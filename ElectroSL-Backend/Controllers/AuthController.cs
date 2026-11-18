
using ElectroSL_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ElectroSL_Backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            var token = await _authService.LoginAsync(
                request.Email,
                request.Password
            );

            return Ok(new
            {
                success = true,
                token
            });
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new
            {
                success = false,
                message = "Invalid email or password."
            });
        }
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(
        [FromBody] RegisterRequest request)
    {
        try
        {
            var result = await _authService.RegisterAsync(
                request.Name,
                request.Email,
                request.Password,
                request.Phone,
                request.Role
            );

            return Ok(new
            {
                success = true,
                message = "Registration successful. OTP generated.",
                userId = result.UserId,

                // DEVELOPMENT ONLY: Remove before production.
                otp = result.OtpCode
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                success = false,
                message = ex.Message
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new
            {
                success = false,
                message = ex.Message
            });
        }
    }

    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp(
        [FromBody] VerifyOtpRequest request)
    {
        var verified = await _authService.VerifyOtpAsync(
            request.UserId,
            request.OtpCode
        );

        if (!verified)
        {
            return BadRequest(new
            {
                success = false,
                message = "Invalid or expired OTP."
            });
        }

        return Ok(new
        {
            success = true,
            message = "Phone number verified successfully."
        });
    }
}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class RegisterRequest
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Role { get; set; } = "Customer";
}

public class VerifyOtpRequest
{
    public int UserId { get; set; }
    public string OtpCode { get; set; } = string.Empty;
}
