namespace ElectroSL_Backend.Models;

public class Job
{
    public int JobId { get; set; }
    public int CustomerId { get; set; }
    public int? ElectricianId { get; set; }
    public string JobType { get; set; } = "Maintenance"; // or "NewConstruction"
    public string Description { get; set; } = string.Empty;
    public string VoiceNoteUrl { get; set; } = string.Empty;
    public double LocationLat { get; set; }
    public double LocationLng { get; set; }
    public string Status { get; set; } = "Pending"; 
    public string StartOTP { get; set; } = string.Empty; // 4-digit PIN
    public string FinalApprovalOTP { get; set; } = string.Empty; 
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsEmergency { get; set; } = false;
}