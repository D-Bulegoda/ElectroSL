using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using ElectroSL_Backend.Data;
using ElectroSL_Backend.Hubs;
using ElectroSL_Backend.Models;

namespace ElectroSL_Backend.Services
{
    public interface INotificationService
    {
        Task SendNotificationAsync(int userId, string title, string message, string type = "JobUpdate", int? relatedJobId = null);
    }

    public class NotificationService : INotificationService
    {
        private readonly ElectroSLDbContext _context;
        private readonly IHubContext<NotificationHub> _hubContext;

        public NotificationService(ElectroSLDbContext context, IHubContext<NotificationHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        public async Task SendNotificationAsync(int userId, string title, string message, string type = "JobUpdate", int? relatedJobId = null)
        {
            var notification = new Notification
            {
                UserId = userId,
                Title = title,
                Message = message,
                Type = type,
                RelatedJobId = relatedJobId,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            // Push real-time alert to the specific user's SignalR group
            await _hubContext.Clients.Group($"user_{userId}").SendAsync("ReceiveNotification", new
            {
                notification.NotificationId,
                notification.Title,
                notification.Message,
                notification.Type,
                notification.RelatedJobId,
                notification.IsRead,
                notification.CreatedAt
            });
        }
    }
}