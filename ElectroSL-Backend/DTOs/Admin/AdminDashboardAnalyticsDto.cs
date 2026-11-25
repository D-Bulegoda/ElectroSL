namespace ElectroSL_Backend.DTOs.Admin;

public class AdminDashboardAnalyticsDto
{
    public string DateRange { get; set; } = "30d";
    public DateTime? FromDateUtc { get; set; }
    public DateTime ToDateUtc { get; set; } = DateTime.UtcNow;

    // Financial KPIs
    public decimal TotalGmv { get; set; }
    public decimal PlatformCommission { get; set; }
    public decimal FullDigitalOnlineCollections { get; set; }
    public decimal CashSplitOnlineCollections { get; set; }
    public decimal DirectCashPaidToElectricians { get; set; }
    public decimal ElectricianEarnings { get; set; }
    public decimal OutstandingWalletLiability { get; set; }
    public decimal TotalRecordedPayouts { get; set; }
    public int PaymentTransactionCount { get; set; }

    // Chart 1: Financial trends
    public List<FinancialTrendPointDto> FinancialTrends { get; set; } = new();

    // Chart 2: Payment method breakdown
    public PaymentMethodDistributionDto PaymentMethods { get; set; } = new();

    // Chart 3: Job status distribution
    public JobStatusDistributionDto JobStatuses { get; set; } = new();

    // Chart 4: Job trends over time
    public List<JobTrendPointDto> JobTrends { get; set; } = new();

    // Chart 5: Technician statistics
    public TechnicianStatisticsDto TechnicianStats { get; set; } = new();

    // Operational summary counts
    public int TotalCustomers { get; set; }
    public int TotalTechnicians { get; set; }
    public int PendingTechnicianVerifications { get; set; }
    public int ActiveJobs { get; set; }
    public int UnassignedJobs { get; set; }
    public int DisputedJobs { get; set; }
    public int EmergencyJobs { get; set; }
    public int FlaggedEquipmentClaims { get; set; }

    // Operational Alerts
    public List<OperationalAlertDto> OperationalAlerts { get; set; } = new();

    // Recent Activity feeds
    public List<RecentJobActivityDto> RecentJobs { get; set; } = new();
    public List<RecentAuditActivityDto> RecentAudits { get; set; } = new();
}

public class FinancialTrendPointDto
{
    public string Period { get; set; } = string.Empty;
    public decimal Gmv { get; set; }
    public decimal Commission { get; set; }
    public decimal ElectricianEarnings { get; set; }
    public int TransactionCount { get; set; }
}

public class PaymentMethodDistributionDto
{
    public int FullDigitalCount { get; set; }
    public decimal FullDigitalGmv { get; set; }
    public int CashCount { get; set; }
    public decimal CashGmv { get; set; }
    public int CashSplitCount { get; set; }
    public decimal CashSplitGmv { get; set; }
    public decimal FullDigitalPercentage { get; set; }
    public decimal CashPercentage { get; set; }
    public decimal CashSplitPercentage { get; set; }
}

public class JobStatusDistributionDto
{
    public int Pending { get; set; }
    public int Assigned { get; set; }
    public int InProgress { get; set; }
    public int Completed { get; set; }
    public int Cancelled { get; set; }
    public int Disputed { get; set; }
    public int Total { get; set; }
}

public class JobTrendPointDto
{
    public string Period { get; set; } = string.Empty;
    public int CreatedCount { get; set; }
    public int CompletedCount { get; set; }
}

public class TechnicianStatisticsDto
{
    public int Approved { get; set; }
    public int Pending { get; set; }
    public int Rejected { get; set; }
    public int SuspendedOrInactive { get; set; }
    public int Total { get; set; }
}

public class OperationalAlertDto
{
    public string Severity { get; set; } = "warning"; // "critical", "warning", "info"
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string ActionLink { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class RecentJobActivityDto
{
    public int JobId { get; set; }
    public string JobType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string? ElectricianName { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool IsEmergency { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class RecentAuditActivityDto
{
    public long AuditLogId { get; set; }
    public string ActionType { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? AdminEmail { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
