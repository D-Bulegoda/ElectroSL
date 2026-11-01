using Microsoft.AspNetCore.Mvc;

namespace ElectroSL_Backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ElectricianController : ControllerBase
{
    [HttpPost("{id}/toggle-status")]
    public IActionResult ToggleOnlineStatus(int id, [FromBody] bool isOnline)
    {
        return Ok(new { message = $"Electrician {id} is now {(isOnline ? "Online" : "Offline")}" });
    }
}