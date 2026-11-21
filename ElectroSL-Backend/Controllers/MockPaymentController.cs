using Microsoft.AspNetCore.Mvc;
using ElectroSL_Backend.Models;
using ElectroSL_Backend.Data;

namespace ElectroSL_Backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class MockPaymentController : ControllerBase
{
    private readonly ElectroSLDbContext _context;

    public MockPaymentController(ElectroSLDbContext context)
    {
        _context = context;
    }

    [HttpPost("process")]
    public async Task<IActionResult> ProcessPayment([FromBody] PaymentRequestDto dto)
    {
        if (dto == null || dto.TotalAmount <= 0)
        {
            return BadRequest(new { success = false, message = "Invalid payment amount." });
        }

        // 15% platform commission split calculation
        decimal platformCommission = dto.TotalAmount * 0.15m;
        decimal electricianEarning = dto.TotalAmount - platformCommission;

        var transaction = new PaymentTransaction
        {
            JobId = dto.JobId,
            TotalAmount = dto.TotalAmount,
            PlatformCommission = platformCommission,
            ElectricianEarning = electricianEarning,
            PaymentMethod = "MockGateway",
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.PaymentTransactions.Add(transaction);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            message = "Payment split processed successfully",
            transactionId = transaction.TransactionId,
            commission = platformCommission,
            earning = electricianEarning
        });
    }
}

public class PaymentRequestDto
{
    public int JobId { get; set; }
    public decimal TotalAmount { get; set; }
}
