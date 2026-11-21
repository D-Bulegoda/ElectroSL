using Microsoft.AspNetCore.Http;

namespace ElectroSL_Backend.Services.Interfaces;

public interface IDocumentStorageService
{
    /// <summary>
    /// Validates file extension, size, MIME type, and magic bytes,
    /// then saves the file physically outside wwwroot with an unpredictable filename.
    /// </summary>
    /// <param name="file">Uploaded file form data</param>
    /// <param name="documentTypePrefix">Prefix indicating document type, e.g., "nic" or "nvq"</param>
    /// <returns>The secure storage reference / filename</returns>
    Task<string> SaveDocumentAsync(IFormFile file, string documentTypePrefix);

    /// <summary>
    /// Retrieves a read stream for a stored document after validating path traversal and existence.
    /// </summary>
    /// <param name="storageKey">The relative storage reference / filename</param>
    /// <returns>Stream, ContentType, and FileName or null if not found/invalid</returns>
    (Stream Stream, string ContentType, string FileName)? GetDocumentStream(string storageKey);

    /// <summary>
    /// Checks if a physical document file exists on disk in the secure storage folder.
    /// </summary>
    bool DocumentExists(string storageKey);

    /// <summary>
    /// Deletes a stored document file if it exists.
    /// </summary>
    void DeleteDocument(string storageKey);

    /// <summary>
    /// Gets the absolute base directory where secure documents are stored.
    /// </summary>
    string GetStorageDirectory();
}

