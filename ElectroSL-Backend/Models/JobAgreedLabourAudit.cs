using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ElectroSL_Backend.Models;

public class JobAgreedLabourAudit
{
    [Key]
    public int Id { get; set; }

    public int JobId { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? PreviousAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal NewAmount { get; set; }

    public int AdminId { get; set; }

    public DateTime ChangedAtUtc { get; set; } = DateTime.UtcNow;

    [MaxLength(500)]
    public string? Notes { get; set; }

    // Navigation Properties
    [ForeignKey("JobId")]
    public virtual Job Job { get; set; } = null!;

    [ForeignKey("AdminId")]
    public virtual User Admin { get; set; } = null!;
}

