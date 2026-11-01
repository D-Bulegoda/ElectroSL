using ElectroSL_Backend.Models;

namespace ElectroSL_Backend.Services.Interfaces;

public interface IMatchingService
{
    Task<List<ElectricianProfile>> FindNearbyElectriciansAsync(double lat, double lng, double radiusKm = 10.0);
    Task<List<ElectricianProfile>> FindTopRatedIslandWideAsync(double minimumRating = 4.5);
}