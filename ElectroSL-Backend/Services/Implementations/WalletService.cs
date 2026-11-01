namespace ElectroSL_Backend.Services.Implementations;

public class WalletService
{
    private const decimal PlatformCommissionRate = 0.15m;
    private const decimal MaxNegativeCreditLimit = -2000.00m;

    public void ProcessCashPayment(int electricianId, decimal totalAmount, ref decimal currentWalletBalance)
    {
        // Electrician gets full cash; system deducts 15% from virtual app wallet
        decimal commissionDue = totalAmount * PlatformCommissionRate;
        currentWalletBalance -= commissionDue;
    }

    public bool IsElectricianBlockedFromJobs(decimal currentWalletBalance)
    {
        // If balance falls below -2000 LKR, block new jobs until top-up
        return currentWalletBalance <= MaxNegativeCreditLimit;
    }
}