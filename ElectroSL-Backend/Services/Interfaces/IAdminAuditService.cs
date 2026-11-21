using System.Threading;
using System.Threading.Tasks;
using ElectroSL_Backend.DTOs.Admin;
using ElectroSL_Backend.Models;

namespace ElectroSL_Backend.Services.Interfaces;

/// <summary>
/// Service contract for append-only, immutable administrative audit logging.
/// Updates and deletions are strictly excluded by design.
/// </summary>
public interface IAdminAuditService
{
    /// <summary>
    /// Records an administrative action to the immutable audit log and persists it to the database.
    /// If an external transaction is active on DbContext, this call participates in that transaction.
    /// </summary>
    Task<AdminAuditLog> LogActionAsync(
        int adminUserId,
        string actionType,
        string entityType,
        string entityId,
        string description,
        string? oldValues = null,
        string? newValues = null,
        string? reason = null,
        string? ipAddress = null,
        CancellationToken ct = default);

    /// <summary>
    /// Instantiates an AdminAuditLog entity populated with contextual metadata (such as resolved client IP)
    /// without immediately calling SaveChangesAsync. Use this when batching multiple entities into a single unit of work.
    /// </summary>
    AdminAuditLog CreateAuditEntry(
        int adminUserId,
        string actionType,
        string entityType,
        string entityId,
        string description,
        string? oldValues = null,
        string? newValues = null,
        string? reason = null,
        string? ipAddress = null);

    /// <summary>
    /// Retrieves a filtered, paginated view of administrative audit log entries.
    /// </summary>
    Task<PaginatedAuditLogsResponseDto> GetAuditLogsAsync(
        AdminAuditLogFilterDto filter,
        CancellationToken ct = default);

    /// <summary>
    /// Retrieves full details for a specific administrative audit log entry.
    /// </summary>
    Task<AdminAuditLogDto?> GetAuditLogDetailAsync(
        long auditLogId,
        CancellationToken ct = default);
}

