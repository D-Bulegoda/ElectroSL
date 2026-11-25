using Microsoft.AspNetCore.Http;

namespace ElectroSL_Backend.DTOs.Electrician;

public class UploadDocumentsFormDto
{
    public IFormFile? NicDocument { get; set; }
    public IFormFile? NvqCertificate { get; set; }
}