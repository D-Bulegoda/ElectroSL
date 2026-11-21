using System;
using System.ComponentModel.DataAnnotations;

namespace ElectroSL_Backend.DTOs.Admin;

public class SetAgreedLabourAmountDto
{
    [Required(ErrorMessage = "Agreed labour amount is required.")]
    [Range(0.01, 10000000.00, ErrorMessage = "Agreed labour amount must be positive and not exceed LKR 10,000,000.00.")]
    public decimal AgreedLabourAmount { get; set; }

    [MaxLength(500, ErrorMessage = "Notes cannot exceed 500 characters.")]
    public string? Notes { get; set; }

    public int? ExpectedConcurrencyVersion { get; set; }
}

public class SetAgreedLabourAmountResultDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int JobId { get; set; }
    public decimal AgreedLabourAmount { get; set; }
    public decimal? PreviousAmount { get; set; }
    public int SetByAdminId { get; set; }
    public DateTime SetAtUtc { get; set; }
    public int NewConcurrencyVersion { get; set; }
}

