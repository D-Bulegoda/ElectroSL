using System;

namespace ElectroSL_Backend.DTOs.Admin;

public class TechnicianAuditLogDto
{
    public int Id { get; set; }
    public int ElectricianProfileId { get; set; }
    public int AdminId { get; set; }
    public string AdminName { get; set; } = string.Empty;
    public string AdminEmail { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string PreviousStatus { get; set; } = string.Empty;
    public string NewStatus { get; set; } = string.Empty;
    public string? Reason { get; set; }
    public DateTime TimestampUtc { get; set; }
}

