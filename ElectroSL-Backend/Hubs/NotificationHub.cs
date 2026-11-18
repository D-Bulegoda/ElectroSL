using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace ElectroSL_Backend.Hubs
{
    public class NotificationHub : Hub
    {
        // Frontend calls this on login/connect to join their personal notification channel
        public async Task JoinUserGroup(string userId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
        }

        public async Task LeaveUserGroup(string userId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
        }
    }
}