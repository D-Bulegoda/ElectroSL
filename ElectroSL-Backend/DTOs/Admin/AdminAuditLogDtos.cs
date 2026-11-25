using System;
using System.Collections.Generic;

namespace ElectroSL_Backend.DTOs.Admin;

/// <summary>
/// Data Transfer Object representing an administrative audit log entry.
/// </summary>
public class AdminAuditLogDto
{
    public long AuditLogId { get; set; }
    public int AdminUserId { get; set; }
    public string AdminName { get; set; } = string.Empty;
    public string AdminEmail { get; set; } = string.Empty;
    public string ActionType { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public string? Reason { get; set; }
    public string? IpAddress { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

/// <summary>
/// Query filters for the unified administrative audit log trail.
/// </summary>
public class AdminAuditLogFilterDto
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Search { get; set; }
    public string? ActionType { get; set; }
    public string? EntityType { get; set; }
    public int? AdminUserId { get; set; }
    public DateTime? StartDateUtc { get; set; }
    public DateTime? EndDateUtc { get; set; }
}

/// <summary>
/// Paginated response wrapper for administrative audit log queries.
/// </summary>
public class PaginatedAuditLogsResponseDto
{
    public List<AdminAuditLogDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;
    public bool HasPreviousPage => Page > 1;
    public bool HasNextPage => Page < TotalPages;
}

