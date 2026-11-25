namespace ElectroSL_Backend.DTOs.Admin;

public class JobOperationalSummaryDto
{
    public int TotalJobs { get; set; }
    public int PendingJobs { get; set; }
    public int AssignedJobs { get; set; }
    public int InProgressJobs { get; set; }
    public int CompletedJobs { get; set; }
    public int CancelledJobs { get; set; }
    public int DisputedJobs { get; set; }
    public int EmergencyJobs { get; set; }
    public int UnassignedJobs { get; set; }
    public int UnassignedEmergencyJobs { get; set; }
    public int StuckAssignedJobs { get; set; }
    public int OverdueInProgressJobs { get; set; }
}

