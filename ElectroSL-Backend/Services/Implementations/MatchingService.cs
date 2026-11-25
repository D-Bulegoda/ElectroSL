
using ElectroSL_Backend.Data;
using ElectroSL_Backend.Models;
using ElectroSL_Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
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

    public async Task<List<ElectricianProfile>>
    FindApprovedElectriciansIslandWideAsync()
{
    // Get all admin-approved electricians.
    var electricians = await _context.ElectricianProfiles
        .Where(e => e.IsApprovedByAdmin)
        .ToListAsync();

    var electricianIds = electricians
        .Select(e => e.UserId)
        .ToList();

    // Calculate each electrician's average rating.
    var averageRatings = await _context.Reviews
        .Where(r => electricianIds.Contains(r.ElectricianId))
        .GroupBy(r => r.ElectricianId)
        .Select(g => new
        {
            ElectricianId = g.Key,
            AverageRating = g.Average(r => r.Rating)
        })
        .ToDictionaryAsync(
            x => x.ElectricianId,
            x => x.AverageRating
        );

    // Return electricians with an average rating of 4.5 or above.
    return electricians
        .Where(e =>
            averageRatings.TryGetValue(e.UserId, out var rating) &&
            rating >= 4.5m)
        .ToList();
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
