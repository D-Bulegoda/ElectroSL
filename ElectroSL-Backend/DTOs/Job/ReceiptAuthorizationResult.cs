using System.IO;

namespace ElectroSL_Backend.DTOs.Job;

public enum ReceiptAuthStatus
{
    Success,
    NotFound,
    Forbidden
}

public class ReceiptAuthorizationResult
{
    public ReceiptAuthStatus Status { get; set; }
    public string Message { get; set; } = string.Empty;
    public Stream? Stream { get; set; }
    public string ContentType { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;

    public static ReceiptAuthorizationResult Ok(Stream stream, string contentType, string fileName) => new()
    {
        Status = ReceiptAuthStatus.Success,
        Stream = stream,
        ContentType = contentType,
        FileName = fileName
    };

    public static ReceiptAuthorizationResult NotFound(string message) => new()
    {
        Status = ReceiptAuthStatus.NotFound,
        Message = message
    };

    public static ReceiptAuthorizationResult Forbidden(string message) => new()
    {
        Status = ReceiptAuthStatus.Forbidden,
        Message = message
    };
}

