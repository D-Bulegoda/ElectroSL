using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ElectroSL_Backend.Data;
using ElectroSL_Backend.Models;
using ElectroSL_Backend.Services;

namespace ElectroSL_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MockPaymentController : ControllerBase
    {
        private readonly ElectroSLDbContext _context;
        private readonly INotificationService _notificationService;

        public MockPaymentController(ElectroSLDbContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        [HttpPost("process")]
        public async Task<IActionResult> ProcessPayment([FromBody] PaymentRequestDto request)
        {
            // 1. Validate Amount
            if (request.TotalAmount <= 0)
                return BadRequest(new { success = false, message = "Total amount must be greater than zero." });

            // 2. Validate Job exists, is payable, and has an assigned electrician
            var job = await _context.Jobs
                .FirstOrDefaultAsync(j => j.JobId == request.JobId);

            if (job == null)
                return NotFound(new { success = false, message = "Job not found." });

            if (job.Status == "Cancelled")
                return BadRequest(new { success = false, message = "Cannot process payment for a cancelled job." });

            if (job.ElectricianId == null)
                return BadRequest(new { success = false, message = "No electrician assigned to this job." });

            // 3. Prevent duplicate payments
            var existingPayment = await _context.PaymentTransactions
                .FirstOrDefaultAsync(p => p.JobId == request.JobId);

            if (existingPayment != null)
                return BadRequest(new { success = false, message = "Payment has already been processed for this job." });

            // 4. Calculate 10% Platform Commission and Electrician Earnings
            decimal commissionRate = 0.10m;
            decimal platformCommission = request.TotalAmount * commissionRate;
            decimal electricianEarning = request.TotalAmount - platformCommission;

            var transaction = new PaymentTransaction
            {
                JobId = request.JobId,
                TotalAmount = request.TotalAmount,
                PlatformCommission = platformCommission,
                ElectricianEarning = electricianEarning,
                PaymentMethod = request.PaymentMethod
            };

            _context.PaymentTransactions.Add(transaction);

            // 5. Update Electrician Wallet
            var profile = await _context.ElectricianProfiles
                .FirstOrDefaultAsync(ep => ep.UserId == job.ElectricianId);

            if (profile != null)
            {
                profile.AppWalletBalance += electricianEarning;
            }

            // 6. Mark Job as Completed
            job.Status = "Completed";

            await _context.SaveChangesAsync();

            // 7. Send Real-Time + DB Notifications to both parties
            await _notificationService.SendNotificationAsync(
                job.ElectricianId.Value,
                "Payment Received",
                $"You received LKR {electricianEarning:N2} for Job #{job.JobId}. Your wallet has been updated.",
                "PaymentReceived",
                job.JobId
            );

            await _notificationService.SendNotificationAsync(
                job.CustomerId,
                "Payment Successful",
                $"Your payment of LKR {request.TotalAmount:N2} for Job #{job.JobId} was successful.",
                "PaymentSuccess",
                job.JobId
            );

            return Ok(new
            {
                success = true,
                transactionId = transaction.TransactionId,
                message = "Payment processed successfully!",
                platformCommission,
                electricianEarning,
                newWalletBalance = profile?.AppWalletBalance
            });
        }

        // GET: api/MockPayment/job/1
        [HttpGet("job/{jobId}")]
        public async Task<IActionResult> GetPaymentByJob(int jobId)
        {
            var transaction = await _context.PaymentTransactions
                .FirstOrDefaultAsync(p => p.JobId == jobId);

            if (transaction == null)
                return NotFound(new { success = false, message = "No payment record found for this job." });

            return Ok(transaction);
        }
    }

    public class PaymentRequestDto
    {
        public int JobId { get; set; }
        public decimal TotalAmount { get; set; }
        public string PaymentMethod { get; set; } = "Credit Card";
    }
}