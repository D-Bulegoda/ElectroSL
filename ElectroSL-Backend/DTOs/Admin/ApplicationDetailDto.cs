namespace ElectroSL_Backend.DTOs.Admin;

public class ApplicationDetailDto
{
    // User & Profile Info
    public int ProfileId { get; set; }
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
    public string VerificationStatus { get; set; } = string.Empty;
    public string NvqCertificateUrl { get; set; } = string.Empty;
    public string NicDocumentUrl { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    // Simulator Results
    public bool SimulatorPassed { get; set; }
    public int SimulatorScore { get; set; }
    public int SimulatorTimeTaken { get; set; }
    public int SafetyMistakesCount { get; set; }
    public DateTime? SimulatorDate { get; set; }

    // Review Audit Trail
    public string? RejectionReason { get; set; }
    public int? ReviewedByAdminId { get; set; }
    public DateTime? ReviewedAt { get; set; }

    // Financial
    public decimal WalletBalance { get; set; }

    // Persistent Audit History Log
    public List<TechnicianAuditLogDto> AuditLogs { get; set; } = new();
}
