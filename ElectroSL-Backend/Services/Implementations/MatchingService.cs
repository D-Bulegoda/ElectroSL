using ElectroSL_Backend.Models;
using ElectroSL_Backend.Services.Interfaces;

namespace ElectroSL_Backend.Services.Implementations;

public class MatchingService : IMatchingService
{
    private readonly DistanceCalculationService _distanceService;

    public MatchingService(DistanceCalculationService distanceService)
    {
        _distanceService = distanceService;
    }

    public async Task<List<ElectricianProfile>> FindNearbyElectriciansAsync(double lat, double lng, double radiusKm = 10.0)
    {
        // Placeholder: Fetch online electricians from DB and filter using _distanceService
        return await Task.FromResult(new List<ElectricianProfile>());
    }

    public async Task<List<ElectricianProfile>> FindTopRatedIslandWideAsync(double minimumRating = 4.5)
    {
        // Placeholder: Return electricians with Rating >= minimumRating for New Construction bidding
        return await Task.FromResult(new List<ElectricianProfile>());
    }
}