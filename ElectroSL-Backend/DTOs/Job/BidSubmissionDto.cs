namespace ElectroSL_Backend.DTOs.Job;

public class BidSubmissionDto
{
    public int JobId { get; set; }
    public int ElectricianId { get; set; }
    public decimal EstimatedAmount { get; set; }
    public string Remarks { get; set; } = string.Empty;
}