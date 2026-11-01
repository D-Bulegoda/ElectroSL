using Microsoft.AspNetCore.Mvc;

namespace ElectroSL_Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        [HttpPost("login")]
        public IActionResult Login()
        {
            // Placeholder for authentication logic
            return Ok(new { message = "Login endpoint ready." });
        }
    }
}