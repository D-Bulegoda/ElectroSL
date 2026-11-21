using ElectroSL_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;

namespace ElectroSL_Backend.Services.Implementations;

public class DocumentStorageService : IDocumentStorageService
{
    private readonly IWebHostEnvironment _environment;
    private readonly string _storageDirectory;
    private const long MaxFileSize = 5 * 1024 * 1024; // 5 MB

    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".pdf", ".jpg", ".jpeg", ".png"
    };

    private static readonly HashSet<string> AllowedMimeTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "application/pdf", "image/jpeg", "image/jpg", "image/png"
    };

    public DocumentStorageService(IWebHostEnvironment environment)
    {
        _environment = environment;
        // Secure location: <ContentRoot>/Storage/VerificationDocuments (OUTSIDE wwwroot)
        _storageDirectory = Path.GetFullPath(Path.Combine(_environment.ContentRootPath, "Storage", "VerificationDocuments"));
        if (!Directory.Exists(_storageDirectory))
        {
            Directory.CreateDirectory(_storageDirectory);
        }
    }

    public string GetStorageDirectory() => _storageDirectory;

    public async Task<string> SaveDocumentAsync(IFormFile file, string documentTypePrefix)
    {
        if (file == null || file.Length == 0)
        {
            throw new ArgumentException("No file was uploaded or file is empty.", nameof(file));
        }

        if (file.Length > MaxFileSize)
        {
            throw new InvalidOperationException($"File size exceeds the 5MB limit ({file.Length / (1024 * 1024)} MB).");
        }

        var ext = Path.GetExtension(file.FileName);
        if (string.IsNullOrWhiteSpace(ext) || !AllowedExtensions.Contains(ext))
        {
            throw new InvalidOperationException($"File type '{ext}' is not permitted. Only PDF, JPG, and PNG files are allowed.");
        }

        // Validate MIME type provided by request
        if (!string.IsNullOrWhiteSpace(file.ContentType) && !AllowedMimeTypes.Contains(file.ContentType))
        {
            throw new InvalidOperationException($"Invalid content type '{file.ContentType}'.");
        }

        // Verify magic bytes (file signature) to ensure client isn't spoofing the extension
        await ValidateFileSignatureAsync(file, ext);

        // Normalize prefix and extension
        var cleanPrefix = documentTypePrefix?.ToLowerInvariant() switch
        {
            "nic" => "nic",
            "nvq" => "nvq",
            "receipt" => "receipt",
            _ => "doc"
        };

        var normalizedExt = ext.ToLowerInvariant();
        if (normalizedExt == ".jpeg") normalizedExt = ".jpg";

        // Generate unpredictable, unique file name
        var uniqueFileName = $"{cleanPrefix}_{Guid.NewGuid():N}{normalizedExt}";
        var destinationPath = Path.GetFullPath(Path.Combine(_storageDirectory, uniqueFileName));

        // Path traversal guard
        if (!destinationPath.StartsWith(_storageDirectory, StringComparison.OrdinalIgnoreCase))
        {
            throw new UnauthorizedAccessException("Potential path traversal attempt detected.");
        }

        using (var fileStream = new FileStream(destinationPath, FileMode.Create, FileAccess.Write, FileShare.None))
        {
            await file.CopyToAsync(fileStream);
        }

        return uniqueFileName;
    }

    public (Stream Stream, string ContentType, string FileName)? GetDocumentStream(string storageKey)
    {
        if (string.IsNullOrWhiteSpace(storageKey))
        {
            return null;
        }

        // Sanitize: extract just the file name to prevent directory traversal
        var fileName = Path.GetFileName(storageKey.Trim());
        if (string.IsNullOrWhiteSpace(fileName))
        {
            return null;
        }

        var fullPath = Path.GetFullPath(Path.Combine(_storageDirectory, fileName));

        // Strict traversal verification
        if (!fullPath.StartsWith(_storageDirectory, StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        // Primary: check secure directory outside wwwroot
        if (!File.Exists(fullPath))
        {
            // Backward-compatibility check: check wwwroot/uploads if legacy files exist
            var webRoot = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
            var legacyPath = Path.GetFullPath(Path.Combine(webRoot, storageKey.TrimStart('/', '\\')));
            if (legacyPath.StartsWith(webRoot, StringComparison.OrdinalIgnoreCase) && File.Exists(legacyPath))
            {
                fullPath = legacyPath;
            }
            else
            {
                return null;
            }
        }

        var ext = Path.GetExtension(fullPath).ToLowerInvariant();
        var contentType = ext switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".pdf" => "application/pdf",
            _ => "application/octet-stream"
        };

        var fileStream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read);
        return (fileStream, contentType, fileName);
    }

    public bool DocumentExists(string storageKey)
    {
        if (string.IsNullOrWhiteSpace(storageKey)) return false;

        var fileName = Path.GetFileName(storageKey.Trim());
        if (string.IsNullOrWhiteSpace(fileName)) return false;

        var fullPath = Path.GetFullPath(Path.Combine(_storageDirectory, fileName));
        if (fullPath.StartsWith(_storageDirectory, StringComparison.OrdinalIgnoreCase) && File.Exists(fullPath))
        {
            return true;
        }

        // Fallback legacy check
        var webRoot = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
        var legacyPath = Path.GetFullPath(Path.Combine(webRoot, storageKey.TrimStart('/', '\\')));
        return legacyPath.StartsWith(webRoot, StringComparison.OrdinalIgnoreCase) && File.Exists(legacyPath);
    }

    public void DeleteDocument(string storageKey)
    {
        if (string.IsNullOrWhiteSpace(storageKey)) return;

        var fileName = Path.GetFileName(storageKey.Trim());
        var fullPath = Path.GetFullPath(Path.Combine(_storageDirectory, fileName));
        if (fullPath.StartsWith(_storageDirectory, StringComparison.OrdinalIgnoreCase) && File.Exists(fullPath))
        {
            File.Delete(fullPath);
        }
    }

    private static async Task ValidateFileSignatureAsync(IFormFile file, string extension)
    {
        var buffer = new byte[16];
        using (var stream = file.OpenReadStream())
        {
            var bytesRead = await stream.ReadAsync(buffer, 0, buffer.Length);
            if (bytesRead < 4)
            {
                throw new InvalidOperationException("Uploaded file header is too small to be a valid document.");
            }
        }

        var ext = extension.ToLowerInvariant();

        if (ext == ".pdf")
        {
            // PDF starts with %PDF (0x25, 0x50, 0x44, 0x46)
            if (buffer[0] != 0x25 || buffer[1] != 0x50 || buffer[2] != 0x44 || buffer[3] != 0x46)
            {
                throw new InvalidOperationException("Uploaded file does not match PDF binary signature.");
            }
        }
        else if (ext == ".png")
        {
            // PNG signature: 89 50 4E 47 0D 0A 1A 0A
            if (buffer[0] != 0x89 || buffer[1] != 0x50 || buffer[2] != 0x4E || buffer[3] != 0x47)
            {
                throw new InvalidOperationException("Uploaded file does not match PNG binary signature.");
            }
        }
        else if (ext is ".jpg" or ".jpeg")
        {
            // JPEG starts with FF D8 FF
            if (buffer[0] != 0xFF || buffer[1] != 0xD8 || buffer[2] != 0xFF)
            {
                throw new InvalidOperationException("Uploaded file does not match JPEG binary signature.");
            }
        }
    }
}

