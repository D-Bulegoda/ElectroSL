namespace ElectroSL_Backend.Models;

public class JobBid
{
    public int BidId { get; set; }
    public int JobId { get; set; }
    public int ElectricianId { get; set; }
    public decimal EstimatedAmount { get; set; }
    public string Remarks { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
}