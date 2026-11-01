using Microsoft.AspNetCore.Http;

namespace ElectroSL_Backend.Services.Interfaces;

public interface IMediaStorageService
{
    Task<string> SaveVoiceNoteAsync(IFormFile file);
    Task<string> SaveImageAsync(IFormFile file, string category);
}