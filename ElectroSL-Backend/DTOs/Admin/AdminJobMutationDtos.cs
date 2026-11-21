namespace ElectroSL_Backend.DTOs.Admin;

public class AdminAssignJobDto
{
    public int ElectricianId { get; set; }
    public int ConcurrencyVersion { get; set; }
    public string? Notes { get; set; }
}

public class AdminReassignJobDto
{
    public int NewElectricianId { get; set; }
    public int ConcurrencyVersion { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class AdminCancelJobDto
{
    public int ConcurrencyVersion { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class AdminResolveDisputeDto
{
    public int ConcurrencyVersion { get; set; }
    public string ResolutionNotes { get; set; } = string.Empty;
}

