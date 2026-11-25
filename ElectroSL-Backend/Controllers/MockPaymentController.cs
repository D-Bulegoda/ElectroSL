using System;
using System.Security.Claims;
using System.Threading.Tasks;
using ElectroSL_Backend.Data;
using ElectroSL_Backend.DTOs.Payment;
using ElectroSL_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ElectroSL_Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Route("api/payment")]
[Authorize(Roles = "Customer")]
public class MockPaymentController : ControllerBase
{
    private readonly ElectroSLDbContext _context;
    private readonly IPaymentProcessingService _paymentService;

    public MockPaymentController(
        ElectroSLDbContext context,
        IPaymentProcessingService paymentService)
    {
        _context = context;
        _paymentService = paymentService;
    }

    private int GetCurrentCustomerUserId()
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                      ?? User.FindFirst("sub")?.Value
                      ?? User.FindFirst("id")?.Value;

        if (int.TryParse(idClaim, out var customerId))
        {
            return customerId;
        }

        return 0;
    }

    // GET: api/MockPayment/checkout-summary/12
    [HttpGet("checkout-summary/{jobId}")]
    public async Task<IActionResult> GetCheckoutSummary(int jobId)
    {
        var customerUserId = GetCurrentCustomerUserId();
        if (customerUserId <= 0)
        {
            return Unauthorized(new { success = false, message = "Valid customer identity is required." });
        }

        try
        {
            var summary = await _paymentService.GetCheckoutSummaryAsync(jobId, customerUserId);
            return Ok(summary);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { success = false, message = ex.Message });
        }
    }

    // POST: api/MockPayment/process
    [HttpPost("process")]
    public async Task<IActionResult> ProcessPayment([FromBody] CustomerPaymentRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var customerUserId = GetCurrentCustomerUserId();
        if (customerUserId <= 0)
        {
            return Unauthorized(new { success = false, message = "Valid customer identity is required." });
        }

        try
        {
            var result = await _paymentService.ProcessCustomerPaymentAsync(request, customerUserId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { success = false, message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    // GET: api/MockPayment/job/1
    [HttpGet("job/{jobId}")]
    public async Task<IActionResult> GetPaymentByJob(int jobId)
    {
        var customerUserId = GetCurrentCustomerUserId();
        if (customerUserId <= 0)
        {
            return Unauthorized(new { success = false, message = "Valid customer identity is required." });
        }

        var job = await _context.Jobs
            .AsNoTracking()
            .FirstOrDefaultAsync(j => j.JobId == jobId);

        if (job == null)
        {
            return NotFound(new { success = false, message = $"Job #{jobId} was not found." });
        }

        if (job.CustomerId != customerUserId)
        {
            return StatusCode(403, new { success = false, message = "You do not have access to payment details for this job." });
        }

        var transaction = await _context.PaymentTransactions
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.JobId == jobId);

        if (transaction == null)
        {
            return NotFound(new { success = false, message = "No payment record found for this job." });
        }

        return Ok(transaction);
    }
}
