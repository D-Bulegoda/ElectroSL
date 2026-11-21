using System;
using System.Collections.Generic;

namespace ElectroSL_Backend.DTOs.Admin;

public class UserDetailDto : UserSummaryDto
{
    // Customer specific detail metrics
    public int TotalCustomerJobs { get; set; }
    public int TotalJobsPosted { get => TotalCustomerJobs; set => TotalCustomerJobs = value; }
    public int ActiveCustomerJobs { get; set; }
    public int CompletedCustomerJobs { get; set; }
    public decimal TotalCustomerSpend { get; set; }
    public List<CustomerJobSummaryDto> RecentCustomerJobs { get; set; } = new();

    // Electrician specific detail metrics
    public int TotalElectricianBids { get; set; }
    public int AssignedJobsCount { get; set; }
    public int CompletedElectricianJobs { get; set; }
    public double AverageRating { get; set; }
    public int TotalReviewsCount { get; set; }
    public string? NicDocumentUrl { get; set; }
    public string? NvqCertificateUrl { get; set; }
    public List<ElectricianJobSummaryDto> RecentAssignedJobs { get; set; } = new();
}

public class CustomerJobSummaryDto
{
    public int JobId { get; set; }
    public string JobType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int? ElectricianId { get; set; }
    public string? ElectricianName { get; set; }
}

public class ElectricianJobSummaryDto
{
    public int JobId { get; set; }
    public string JobType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
}
