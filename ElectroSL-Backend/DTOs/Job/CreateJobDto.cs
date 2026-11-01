namespace ElectroSL_Backend.DTOs.Job;

public class CreateJobDto
{
    public int CustomerId { get; set; }
    public string JobType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public double LocationLat { get; set; }
    public double LocationLng { get; set; }
    public bool IsEmergency { get; set; }
}