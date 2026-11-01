using ElectroSL_Backend.Utilities;

namespace ElectroSL_Backend.Services.Implementations;

public class DistanceCalculationService
{
    public double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
    {
        return HaversineHelper.CalculateDistanceInKm(lat1, lon1, lat2, lon2);
    }
}