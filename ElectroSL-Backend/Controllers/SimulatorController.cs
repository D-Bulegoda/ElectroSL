using ElectroSL_Backend.Data;
using ElectroSL_Backend.Models;
using Microsoft.AspNetCore.Mvc;

namespace ElectroSL_Backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class SimulatorController : ControllerBase
{
    private readonly ElectroSLDbContext _context;

    public SimulatorController(ElectroSLDbContext context)
    {
        _context = context;
    }

    [HttpPost("evaluate")]
    public async Task<IActionResult> EvaluateSimulatorTask([FromBody] SimulatorSubmissionDto dto)
    {
        if (dto == null)
        {
            return BadRequest(new { message = "Invalid assessment submission payload." });
        }

        var result = new SimulatorResult
        {
            ElectricianId = dto.ElectricianId,
            TotalScore = (int)Math.Round(dto.Score),
            IsPassed = dto.IsPassed,
            AttemptDate = DateTime.UtcNow,
            TimeTakenSeconds = dto.TimeTakenSeconds > 0 ? dto.TimeTakenSeconds : 0,
            SafetyMistakesCount = dto.SafetyMistakesCount >= 0 ? dto.SafetyMistakesCount : 0
        };

        _context.SimulatorResults.Add(result);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            resultId = result.Id,
            message = "Assessment stored successfully."
        });
    }
}

public class SimulatorSubmissionDto
{
    public int ElectricianId { get; set; }
    public decimal Score { get; set; }
    public bool IsPassed { get; set; }
    public string TaskId { get; set; } = string.Empty;
    public string ConfigurationJson { get; set; } = string.Empty;
    public int TimeTakenSeconds { get; set; }
    public int SafetyMistakesCount { get; set; }
}
