using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ElectroSL_Backend.Models
{
    public class PaymentTransaction
    {
        [Key]
        public int TransactionId { get; set; }

        public int JobId { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal PlatformCommission { get; set; } // 15%

        [Column(TypeName = "decimal(18,2)")]
        public decimal ElectricianEarning { get; set; } // 85%

        [MaxLength(20)]
        public string PaymentMethod { get; set; } = "MockGateway";

        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

        [ForeignKey("JobId")]
        public virtual Job Job { get; set; } = null!;
    }
}