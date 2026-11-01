namespace ElectroSL_Backend.Models;

public class SimulatorResult
{
    public int Id { get; set; }
    public int ElectricianId { get; set; }
    public int TotalScore { get; set; }
    public int TimeTakenSeconds { get; set; }
    public int SafetyMistakesCount { get; set; }
    public bool IsPassed { get; set; }
    public DateTime AttemptDate { get; set; } = DateTime.UtcNow;
}