using Microsoft.AspNetCore.Mvc;

namespace ElectroSL_Backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class MockPaymentController : ControllerBase
{
    [HttpPost("process")]
    public IActionResult ProcessPayment([FromBody] decimal amount)
    {
        decimal platformFee = amount * 0.15m;
        decimal electricianEarning = amount * 0.85m;
        
        return Ok(new 
        { 
            Success = true, 
            PlatformFee = platformFee, 
            ElectricianEarning = electricianEarning 
        });
    }
}