using System;
using System.Collections.Generic;

namespace ElectroSL_Backend.DTOs.Admin;

public class AdminAdvancedAnalyticsDto
{
    public string Range { get; set; } = "30d";
    public DateTime? FromDateUtc { get; set; }
    public DateTime ToDateUtc { get; set; } = DateTime.UtcNow;
    public DateTime? PriorFromDateUtc { get; set; }
    public DateTime? PriorToDateUtc { get; set; }

    // 1. Financial Performance Insights
    public FinancialBiInsightsDto Financial { get; set; } = new();

    // 2. Job Lifecycle & Dispatch Performance
    public JobPerformanceBiDto Jobs { get; set; } = new();

    // 3. Technician Workforce Performance
    public TechnicianPerformanceBiDto Technicians { get; set; } = new();

    // 4. Equipment Insights & Claim Review Velocity
    public EquipmentBiInsightsDto Equipment { get; set; } = new();

    // 5. Platform User & Demand Growth
    public PlatformGrowthBiDto Growth { get; set; } = new();
}

public class FinancialBiInsightsDto
{
    public decimal TotalGmv { get; set; }
    public decimal PriorGmv { get; set; }
    public decimal? GmvChangePercentage { get; set; }

    public decimal PlatformCommission { get; set; }
    public decimal PriorPlatformCommission { get; set; }
    public decimal? CommissionChangePercentage { get; set; }

    public decimal FullDigitalOnlineCollections { get; set; }
    public int FullDigitalCount { get; set; }
    public decimal FullDigitalGmv { get; set; }

    public decimal CashSplitOnlineCollections { get; set; }
    public int CashSplitCount { get; set; }
    public decimal CashSplitGmv { get; set; }

    public decimal OnlineCollectionsTotal { get; set; }
    public decimal DirectCashPaidToElectricians { get; set; }

    public decimal ElectricianEarnings { get; set; }
    public decimal PriorElectricianEarnings { get; set; }
    public decimal? EarningsChangePercentage { get; set; }

    public decimal OutstandingWalletLiability { get; set; }
    public decimal TotalRecordedPayouts { get; set; }
    public decimal PriorRecordedPayouts { get; set; }
    public decimal? PayoutsChangePercentage { get; set; }

    public int TotalTransactions { get; set; }
    public int PriorTransactions { get; set; }

    public List<FinancialBiTrendPointDto> Trends { get; set; } = new();
}

public class FinancialBiTrendPointDto
{
    public string Period { get; set; } = string.Empty;
    public decimal Gmv { get; set; }
    public decimal Commission { get; set; }
    public decimal ElectricianEarnings { get; set; }
    public decimal OnlineCollections { get; set; }
    public decimal DirectCash { get; set; }
    public int TransactionCount { get; set; }
}

public class JobPerformanceBiDto
{
    public int TotalJobsCreated { get; set; }
    public int PriorJobsCreated { get; set; }
    public decimal? JobsCreatedChangePercentage { get; set; }

    public int PendingJobs { get; set; }
    public int AssignedJobs { get; set; }
    public int InProgressJobs { get; set; }
    public int CompletedJobs { get; set; }
    public int CancelledJobs { get; set; }
    public int DisputedJobs { get; set; }
    public int EmergencyJobs { get; set; }

    public decimal CompletionRate { get; set; }
    public decimal CancellationRate { get; set; }
    public decimal DisputeRate { get; set; }

    public double? AvgTimeToAssignmentMinutes { get; set; }
    public double? AvgTimeToCompletionHours { get; set; }

    public List<JobBiTrendPointDto> Trends { get; set; } = new();
    public List<JobTypeBreakdownDto> Types { get; set; } = new();
}

public class JobBiTrendPointDto
{
    public string Period { get; set; } = string.Empty;
    public int CreatedCount { get; set; }
    public int CompletedCount { get; set; }
    public int CancelledCount { get; set; }
}

public class JobTypeBreakdownDto
{
    public string JobType { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Percentage { get; set; }
}

public class TechnicianPerformanceBiDto
{
    public int TotalRegisteredTechnicians { get; set; }
    public int ApprovedTechnicians { get; set; }
    public int PendingApprovals { get; set; }
    public int RejectedApplications { get; set; }
    public int SuspendedOrInactive { get; set; }

    public int ActiveTechniciansWithJobs { get; set; }
    public decimal TechnicianUtilizationRate { get; set; }

    public List<TechnicianLeaderboardItemDto> Leaderboard { get; set; } = new();
}

public class TechnicianLeaderboardItemDto
{
    public int ProfileId { get; set; }
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
    public string VerificationStatus { get; set; } = string.Empty;
    public int JobsHandled { get; set; }
    public int CompletedJobs { get; set; }
    public int InProgressJobs { get; set; }
    public decimal CompletionRate { get; set; }
    public decimal AppWalletBalance { get; set; }
}

public class EquipmentBiInsightsDto
{
    public int TotalCatalogItems { get; set; }
    public int ActiveCatalogItems { get; set; }

    public int TotalEquipmentClaims { get; set; }
    public decimal TotalEquipmentSpending { get; set; }
    public decimal PriorEquipmentSpending { get; set; }
    public decimal? SpendingChangePercentage { get; set; }

    public int ClaimsApprovedCount { get; set; }
    public int ClaimsRejectedCount { get; set; }
    public int ClaimsFlaggedCount { get; set; }
    public decimal ClaimApprovalRate { get; set; }

    public List<TopUsedEquipmentItemDto> TopUsedEquipment { get; set; } = new();
    public List<EquipmentPriceChangeItemDto> RecentPriceChanges { get; set; } = new();
}

public class TopUsedEquipmentItemDto
{
    public int? CatalogItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int UsageCount { get; set; }
    public int TotalQuantity { get; set; }
    public decimal TotalSpending { get; set; }
}

public class EquipmentPriceChangeItemDto
{
    public int Id { get; set; }
    public int CatalogItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public decimal OldPrice { get; set; }
    public decimal NewPrice { get; set; }
    public decimal ChangePercentage { get; set; }
    public string? Reason { get; set; }
    public string ChangedByAdminName { get; set; } = string.Empty;
    public DateTime EffectiveDateUtc { get; set; }
}

public class PlatformGrowthBiDto
{
    public int TotalUsers { get; set; }
    public int TotalCustomers { get; set; }
    public int TotalElectricians { get; set; }
    public int ActiveAccounts { get; set; }
    public int InactiveOrSuspendedAccounts { get; set; }

    public int NewCustomersInPeriod { get; set; }
    public int PriorNewCustomers { get; set; }
    public decimal? CustomerGrowthRate { get; set; }

    public int NewTechniciansInPeriod { get; set; }
    public int PriorNewTechnicians { get; set; }
    public decimal? TechnicianGrowthRate { get; set; }

    public List<GrowthBiTrendPointDto> Trends { get; set; } = new();
}

public class GrowthBiTrendPointDto
{
    public string Period { get; set; } = string.Empty;
    public int NewCustomers { get; set; }
    public int NewTechnicians { get; set; }
    public int NewJobs { get; set; }
}

