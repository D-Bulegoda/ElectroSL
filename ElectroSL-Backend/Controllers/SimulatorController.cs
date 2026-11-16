[HttpPost("evaluate")]
public async Task<IActionResult> EvaluateSimulatorTask([FromBody] SimulatorSubmissionDto dto)
{
    var result = new SimulatorResult
    {
        ElectricianId = dto.ElectricianId,
        Score = dto.Score,
        IsPassed = dto.IsPassed,
        TaskConfigurationJson = dto.ConfigurationJson,
        CompletedAtUtc = DateTime.UtcNow
    };

    _context.SimulatorResults.Add(result);
    await _context.SaveChangesAsync();

    return Ok(new { success = true, resultId = result.ResultId, message = "Assessment stored successfully." });
}

public class SimulatorSubmissionDto
{
    public int ElectricianId { get; set; }
    public decimal Score { get; set; }
    public bool IsPassed { get; set; }
    public string TaskId { get; set; } = string.Empty;
    public string ConfigurationJson { get; set; } = string.Empty;
}