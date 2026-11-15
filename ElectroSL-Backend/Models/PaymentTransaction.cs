using System;
using System.ComponentModel.DataAnnotations;

namespace ElectroSL_Backend.Models;

public class PaymentTransaction
{
    [Key]
    public int TransactionId { get; set; }
    public int JobId { get; set; }
    public string PaymentMethod { get; set; } = "Cash"; // or "Card"
    public decimal TotalAmount { get; set; }
    public decimal PlatformCommission { get; set; } // 15%
    public decimal ElectricianEarning { get; set; } // 85%
    public DateTime ProcessedAt { get; set; } = DateTime.UtcNow;

    // Navigation Property
    public Job Job { get; set; } = null!;
}