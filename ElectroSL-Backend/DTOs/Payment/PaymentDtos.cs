using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ElectroSL_Backend.DTOs.Payment;

public class CustomerPaymentRequestDto
{
    [Required(ErrorMessage = "JobId is required.")]
    public int JobId { get; set; }

    [Required(ErrorMessage = "PaymentMethod is required.")]
    public string PaymentMethod { get; set; } = "FullDigital";
}

public class CustomerPaymentResultDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int TransactionId { get; set; }
    public int JobId { get; set; }
    public string JobStatus { get; set; } = string.Empty;
    public decimal GrossJobValue { get; set; }
    public decimal PlatformCommission { get; set; }
    public decimal ElectricianEarnings { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public decimal CustomerPaidOnline { get; set; }
    public decimal CustomerDirectCash { get; set; }
    public decimal? UpdatedWalletBalance { get; set; }
    public DateTime ProcessedAtUtc { get; set; }
}

public class JobCheckoutSummaryDto
{
    public int JobId { get; set; }
    public string JobTitle { get; set; } = string.Empty;
    public string JobStatus { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public int? ElectricianId { get; set; }
    public string? ElectricianName { get; set; }
    public bool IsPaymentEligible { get; set; }
    public string? IneligibilityReason { get; set; }

    public decimal? LabourCharge { get; set; }
    public DateTime? LabourAmountSetAtUtc { get; set; }

    public List<CheckoutEquipmentItemDto> EquipmentItems { get; set; } = new();
    public decimal BillableEquipmentTotal { get; set; }

    public decimal GrossJobValue { get; set; }
    public decimal PlatformCommissionRate { get; set; }
    public decimal PlatformCommission { get; set; }
    public decimal ElectricianEarnings { get; set; }

    public CheckoutPricingOptionsDto PricingOptions { get; set; } = null!;
}

public class CheckoutEquipmentItemDto
{
    public int Id { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class CheckoutPricingOptionsDto
{
    public CheckoutPricingTierDto FullDigital { get; set; } = null!;
    public CheckoutPricingTierDto CashSplit { get; set; } = null!;
}

public class CheckoutPricingTierDto
{
    public string PaymentMethod { get; set; } = string.Empty;
    public decimal CustomerPaysOnline { get; set; }
    public decimal CustomerPaysCash { get; set; }
    public decimal ElectricianWalletCredit { get; set; }
    public string Description { get; set; } = string.Empty;
}

