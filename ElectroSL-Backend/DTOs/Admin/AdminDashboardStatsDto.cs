namespace ElectroSL_Backend.DTOs.Admin;

public class AdminDashboardStatsDto
{
    public int TotalElectricians { get; set; }
    public int PendingApprovals { get; set; }
    public int ApprovedCount { get; set; }
    public int RejectedCount { get; set; }
    public int ActiveJobs { get; set; }
    public decimal TotalCommissionCollected { get; set; }
    public int FlaggedEquipmentClaims { get; set; }

    // User Management metrics (Phase 3)
    public int TotalCustomers { get; set; }
    public int TotalActiveAccounts { get; set; }
    public int TotalSuspendedAccounts { get; set; }
    public int TotalInactiveAccounts { get; set; }
}
