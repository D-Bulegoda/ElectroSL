using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;
using ElectroSL_Backend.Data;
using ElectroSL_Backend.Services;

namespace ElectroSL_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationController : ControllerBase
    {
        private readonly ElectroSLDbContext _context;
        private readonly INotificationService _notificationService;

        public NotificationController(ElectroSLDbContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        // GET: api/Notification/user/1
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserNotifications(int userId)
        {
            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Take(30)
                .ToListAsync();

            return Ok(notifications);
        }

        // PUT: api/Notification/read/5
        [HttpPut("read/{notificationId}")]
        public async Task<IActionResult> MarkAsRead(int notificationId)
        {
            var notification = await _context.Notifications.FindAsync(notificationId);
            if (notification == null)
                return NotFound(new { success = false, message = "Notification not found." });

            notification.IsRead = true;
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Marked as read." });
        }

        // POST: api/Notification/job-alert (Use for testing or triggering job status updates)
        [HttpPost("job-alert")]
        public async Task<IActionResult> SendJobAlert([FromBody] JobNotificationDto request)
        {
            var userExists = await _context.Users.AnyAsync(u => u.UserId == request.UserId);
            if (!userExists)
                return NotFound(new { success = false, message = "Target user not found." });

            await _notificationService.SendNotificationAsync(
                request.UserId,
                request.Title,
                request.Message,
                request.Type,
                request.RelatedJobId
            );

            return Ok(new { success = true, message = "Notification sent." });
        }
    }

    public class JobNotificationDto
    {
        public int UserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Type { get; set; } = "JobUpdate";
        public int? RelatedJobId { get; set; }
    }
}