using Microsoft.AspNetCore.SignalR;

namespace ElectroSL_Backend.Hubs;

public class JobTrackingHub : Hub
{
    // Real-time location updates for the customer map
    public async Task UpdateElectricianLocation(string jobId, double lat, double lng)
    {
        await Clients.Group(jobId).SendAsync("ReceiveLocationUpdate", lat, lng);
    }

    public async Task JoinJobTrackingGroup(string jobId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, jobId);
    }
}