using ElectroSL_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Http;

namespace ElectroSL_Backend.Services.Implementations;

public class LocalMediaStorageService : IMediaStorageService
{
    public async Task<string> SaveVoiceNoteAsync(IFormFile file)
    {
        // Save to Uploads/VoiceNotes
        return await Task.FromResult($"/uploads/voicenotes/{Guid.NewGuid()}.webm");
    }

    public async Task<string> SaveImageAsync(IFormFile file, string category)
    {
        return await Task.FromResult($"/uploads/{category}/{Guid.NewGuid()}.jpg");
    }
}