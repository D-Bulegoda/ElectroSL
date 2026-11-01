namespace ElectroSL_Backend.DTOs.User;

public class ElectricianProfileDto
{
    public int UserId { get; set; }
    public string Specialization { get; set; } = string.Empty;
    public string NvqCertificateBase64 { get; set; } = string.Empty; // For frontend upload
}