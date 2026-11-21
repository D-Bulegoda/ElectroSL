using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using ElectroSL_Backend.Data;
using ElectroSL_Backend.DTOs.Admin;
using ElectroSL_Backend.Models;
using ElectroSL_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ElectroSL_Backend.Services.Implementations;

/// <summary>
/// Implementation of immutable, append-only administrative audit logging.
/// Updates and deletes are intentionally omitted to maintain audit log immutability.
/// </summary>
public class AdminAuditService : IAdminAuditService
{
    private readonly ElectroSLDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<AdminAuditService> _logger;

    public AdminAuditService(
        ElectroSLDbContext context,
        IHttpContextAccessor httpContextAccessor,
        ILogger<AdminAuditService> logger)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    public async Task<AdminAuditLog> LogActionAsync(
        int adminUserId,
        string actionType,
        string entityType,
        string entityId,
        string description,
        string? oldValues = null,
        string? newValues = null,
        string? reason = null,
        string? ipAddress = null,
        CancellationToken ct = default)
    {
        var entry = CreateAuditEntry(
            adminUserId,
            actionType,
            entityType,
            entityId,
            description,
            oldValues,
            newValues,
            reason,
            ipAddress);

        _context.AdminAuditLogs.Add(entry);
        await _context.SaveChangesAsync(ct);

        _logger.LogInformation(
            "[AdminAudit] Admin #{AdminUserId} performed {ActionType} on {EntityType} #{EntityId}. Description: {Description}",
            adminUserId, actionType, entityType, entityId, description);

        return entry;
    }

    public AdminAuditLog CreateAuditEntry(
        int adminUserId,
        string actionType,
        string entityType,
        string entityId,
        string description,
        string? oldValues = null,
        string? newValues = null,
        string? reason = null,
        string? ipAddress = null)
    {
        var resolvedIp = ipAddress ?? ResolveClientIpAddress();

        return new AdminAuditLog
        {
            AdminUserId = adminUserId,
            ActionType = actionType.Trim(),
            EntityType = entityType.Trim(),
            EntityId = entityId.Trim(),
            Description = description.Trim(),
            OldValues = oldValues,
            NewValues = newValues,
            Reason = reason?.Trim(),
            IpAddress = resolvedIp,
            CreatedAtUtc = DateTime.UtcNow
        };
    }

    public async Task<PaginatedAuditLogsResponseDto> GetAuditLogsAsync(
        AdminAuditLogFilterDto filter,
        CancellationToken ct = default)
    {
        int page = filter.Page < 1 ? 1 : filter.Page;
        int pageSize = filter.PageSize < 1 ? 20 : (filter.PageSize > 100 ? 100 : filter.PageSize);

        var query = _context.AdminAuditLogs
            .AsNoTracking()
            .Include(a => a.AdminUser)
            .AsQueryable();

        // 1. Filter by Action Type
        if (!string.IsNullOrWhiteSpace(filter.ActionType))
        {
            var action = filter.ActionType.Trim().ToLower();
            query = query.Where(a => a.ActionType.ToLower() == action);
        }

        // 2. Filter by Entity Type
        if (!string.IsNullOrWhiteSpace(filter.EntityType))
        {
            var entityType = filter.EntityType.Trim().ToLower();
            query = query.Where(a => a.EntityType.ToLower() == entityType);
        }

        // 3. Filter by Admin User ID
        if (filter.AdminUserId.HasValue && filter.AdminUserId.Value > 0)
        {
            query = query.Where(a => a.AdminUserId == filter.AdminUserId.Value);
        }

        // 4. Date range filters
        if (filter.StartDateUtc.HasValue)
        {
            query = query.Where(a => a.CreatedAtUtc >= filter.StartDateUtc.Value);
        }
        if (filter.EndDateUtc.HasValue)
        {
            query = query.Where(a => a.CreatedAtUtc <= filter.EndDateUtc.Value);
        }

        // 5. Search text
        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var s = filter.Search.Trim().ToLower();
            query = query.Where(a =>
                a.Description.ToLower().Contains(s) ||
                (a.Reason != null && a.Reason.ToLower().Contains(s)) ||
                a.EntityId.ToLower().Contains(s) ||
                a.ActionType.ToLower().Contains(s) ||
                a.EntityType.ToLower().Contains(s) ||
                (a.AdminUser != null && (
                    a.AdminUser.Name.ToLower().Contains(s) ||
                    a.AdminUser.Email.ToLower().Contains(s)
                ))
            );
        }

        int totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(a => a.CreatedAtUtc)
            .ThenByDescending(a => a.AuditLogId)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AdminAuditLogDto
            {
                AuditLogId = a.AuditLogId,
                AdminUserId = a.AdminUserId,
                AdminName = a.AdminUser != null ? a.AdminUser.Name : $"Admin #{a.AdminUserId}",
                AdminEmail = a.AdminUser != null ? a.AdminUser.Email : string.Empty,
                ActionType = a.ActionType,
                EntityType = a.EntityType,
                EntityId = a.EntityId,
                Description = a.Description,
                OldValues = a.OldValues,
                NewValues = a.NewValues,
                Reason = a.Reason,
                IpAddress = a.IpAddress,
                CreatedAtUtc = a.CreatedAtUtc
            })
            .ToListAsync(ct);

        return new PaginatedAuditLogsResponseDto
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<AdminAuditLogDto?> GetAuditLogDetailAsync(
        long auditLogId,
        CancellationToken ct = default)
    {
        var log = await _context.AdminAuditLogs
            .AsNoTracking()
            .Include(a => a.AdminUser)
            .FirstOrDefaultAsync(a => a.AuditLogId == auditLogId, ct);

        if (log == null) return null;

        return new AdminAuditLogDto
        {
            AuditLogId = log.AuditLogId,
            AdminUserId = log.AdminUserId,
            AdminName = log.AdminUser != null ? log.AdminUser.Name : $"Admin #{log.AdminUserId}",
            AdminEmail = log.AdminUser != null ? log.AdminUser.Email : string.Empty,
            ActionType = log.ActionType,
            EntityType = log.EntityType,
            EntityId = log.EntityId,
            Description = log.Description,
            OldValues = log.OldValues,
            NewValues = log.NewValues,
            Reason = log.Reason,
            IpAddress = log.IpAddress,
            CreatedAtUtc = log.CreatedAtUtc
        };
    }

    private string? ResolveClientIpAddress()
    {
        try
        {
            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext == null) return null;

            if (httpContext.Request.Headers.TryGetValue("X-Forwarded-For", out var forwardedFor) && !string.IsNullOrWhiteSpace(forwardedFor))
            {
                var ips = forwardedFor.ToString().Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                if (ips.Length > 0)
                {
                    return ips[0];
                }
            }

            return httpContext.Connection.RemoteIpAddress?.ToString();
        }
        catch
        {
            return null;
        }
    }
}

