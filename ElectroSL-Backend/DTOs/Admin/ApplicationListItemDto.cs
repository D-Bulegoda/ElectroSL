namespace ElectroSL_Backend.DTOs.Admin;

public class ApplicationListItemDto
{
    public int ProfileId { get; set; }
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
    public string VerificationStatus { get; set; } = string.Empty;
    public string NvqCertificateUrl { get; set; } = string.Empty;
    public string NicDocumentUrl { get; set; } = string.Empty;
    public bool SimulatorPassed { get; set; }
    public DateTime CreatedAt { get; set; }
}
