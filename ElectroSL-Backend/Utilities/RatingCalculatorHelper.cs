namespace ElectroSL_Backend.Utilities;

public static class RatingCalculatorHelper
{
    // Implementation of your formula: ((Admin Initial Rating * 2) + Sum(Customer Ratings)) / (2 + Total Jobs)
    public static double CalculateWeightedRating(double adminInitialRating, double sumOfCustomerRatings, int totalCompletedJobs)
    {
        return ((adminInitialRating * 2) + sumOfCustomerRatings) / (2 + totalCompletedJobs);
    }
}