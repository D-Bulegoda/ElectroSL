
using ElectroSL_Backend.Data;
using ElectroSL_Backend.Models;
using ElectroSL_Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ElectroSL_Backend.Services.Implementations;

public class MatchingService : IMatchingService
{
    private readonly ElectroSLDbContext _context;

    public MatchingService(ElectroSLDbContext context)
    {
        _context = context;
    }

    public async Task<List<ElectricianProfile>> FindNearbyElectriciansAsync(
        double lat,
        double lng,
        double radiusKm = 10.0)
    {
        var electricians = await _context.ElectricianProfiles
            .Where(e => e.IsOnline && e.IsApprovedByAdmin)
            .ToListAsync();

        var nearbyElectricians = electricians
            .Where(e =>
                CalculateDistanceInKm(
                    lat,
                    lng,
                    e.CurrentLat,
                    e.CurrentLng
                ) <= radiusKm)
            .ToList();

        return nearbyElectricians;
    }

        
    
    public async Task<List<ElectricianProfile>> FindApprovedElectriciansIslandWideAsync()
    {
        // Return all admin-approved electricians.
        // Ratings will be displayed separately to customers.
        return await _context.ElectricianProfiles
            .Where(e => e.IsApprovedByAdmin)
            .ToListAsync();
    }



    private static double CalculateDistanceInKm(
        double lat1,
        double lng1,
        double lat2,
        double lng2)
    {
        const double earthRadiusKm = 6371.0;

        double dLat = ToRadians(lat2 - lat1);
        double dLng = ToRadians(lng2 - lng1);

        double a =
            Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
            Math.Cos(ToRadians(lat1)) *
            Math.Cos(ToRadians(lat2)) *
            Math.Sin(dLng / 2) * Math.Sin(dLng / 2);

        double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        return earthRadiusKm * c;
    }

    private static double ToRadians(double degrees)
    {
        return degrees * Math.PI / 180.0;
    }
}
