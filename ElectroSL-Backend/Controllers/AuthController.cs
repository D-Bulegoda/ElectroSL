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