namespace ElectroSL_Backend.Models;

public class JobUsedEquipment
{
    public int Id { get; set; }
    public int JobId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public decimal ClaimedPrice { get; set; }
    public int Quantity { get; set; }
    public decimal VariancePercentage { get; set; } // Flagged if > 5%
    public string ReceiptImageUrl { get; set; } = string.Empty;
}