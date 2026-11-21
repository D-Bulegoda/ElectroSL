using ElectroSL_Backend.Data;
using ElectroSL_Backend.Models;
using ElectroSL_Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ElectroSL_Backend.Services.Implementations;

public class MatchingService : IMatchingService
{
    private readonly DistanceCalculationService _distanceService;
    private readonly ElectroSLDbContext _context;

    public MatchingService(DistanceCalculationService distanceService, ElectroSLDbContext context)
    {
        _distanceService = distanceService;
        _context = context;
    }

    public async Task<List<ElectricianProfile>> FindNearbyElectriciansAsync(double lat, double lng, double radiusKm = 10.0)
    {
        // Enforce accreditation & active state: Revoked, Pending, Rejected, or Inactive/Suspended electricians cannot be dispatched
        var activeApproved = await _context.ElectricianProfiles
            .Include(p => p.User)
            .Where(p => p.VerificationStatus == "Approved" && p.IsApprovedByAdmin && p.IsOnline && p.User.IsActive && p.User.AccountStatus == "Active")
            .ToListAsync();

        return activeApproved
            .Where(p => _distanceService.CalculateDistance(lat, lng, p.CurrentLat, p.CurrentLng) <= radiusKm)
            .ToList();
    }

    public async Task<List<ElectricianProfile>> FindTopRatedIslandWideAsync(double minimumRating = 4.5)
    {
        // Enforce accreditation & active state: Revoked or unapproved/inactive electricians cannot participate in New Construction bidding
        return await _context.ElectricianProfiles
            .Include(p => p.User)
            .Where(p => p.VerificationStatus == "Approved" && p.IsApprovedByAdmin && p.IsOnline && p.User.IsActive && p.User.AccountStatus == "Active")
            .ToListAsync();
    }
}