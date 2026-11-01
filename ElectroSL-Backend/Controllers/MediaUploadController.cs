using Microsoft.AspNetCore.Mvc;

namespace ElectroSL_Backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class MediaUploadController : ControllerBase
{
    [HttpPost("upload-voice-note")]
    public IActionResult UploadVoiceNote(IFormFile file)
    {
        // Logic to save .webm/.mp3 file to Uploads/VoiceNotes/
        return Ok(new { filePath = "/uploads/voicenotes/sample.webm" });
    }
}