import React, { useState, useEffect, useCallback } from 'react';
import adminService from '../../services/adminService';
import { formatDateTime } from '../../utils/formattingHelpers';
import {
  HistoryIcon,
  SearchIcon,
  RefreshCwIcon,
  FilterIcon,
  EyeIcon,
  XIcon,
  AlertTriangleIcon,
  CheckIcon
} from '../../components/admin/AdminIcons';
import './admin.css';

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters state
  const [filters, setFilters] = useState({
    search: '',
    actionType: '',
    entityType: '',
    adminUserId: '',
    startDateUtc: '',
    endDateUtc: ''
  });

  // Selected Log Detail Modal
  const [selectedLog, setSelectedLog] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchAuditLogs = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getAdminAuditLogs({
        page,
        pageSize: pagination.pageSize,
        search: filters.search.trim(),
        actionType: filters.actionType,
        entityType: filters.entityType,
        adminUserId: filters.adminUserId ? parseInt(filters.adminUserId, 10) : null,
        startDateUtc: filters.startDateUtc,
        endDateUtc: filters.endDateUtc
      });

      if (res) {
        setLogs(res.items || []);
        setPagination({
          page: res.page || page,
          pageSize: res.pageSize || 20,
          totalCount: res.totalCount || 0,
          totalPages: res.totalPages || 0,
          hasPreviousPage: res.hasPreviousPage || false,
          hasNextPage: res.hasNextPage || false
        });
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setError(err.message || 'Failed to retrieve administrative audit logs.');
    } finally {
      setLoading(false);
    }
  }, [pagination.pageSize, filters]);

  useEffect(() => {
    fetchAuditLogs(1);
  }, [fetchAuditLogs]);

  const handleResetFilters = () => {
    setFilters({
      search: '',
      actionType: '',
      entityType: '',
      adminUserId: '',
      startDateUtc: '',
      endDateUtc: ''
    });
  };

  const handleOpenDetailModal = (log) => {
    setSelectedLog(log);
    setModalOpen(true);
  };

  // Helper for rendering Action Type Badges
  const renderActionBadge = (actionType) => {
    let bg = '#eff6ff';
    let text = '#1d4ed8';
    let border = '#bfdbfe';

    // Users
    if (actionType === 'UserActivated' || actionType === 'UserRestored') {
      bg = '#ecfdf5'; text = '#065f46'; border = '#a7f3d0';
    } else if (actionType === 'UserDeactivated' || actionType === 'UserSuspended') {
      bg = '#fef2f2'; text = '#991b1b'; border = '#fecaca';
    }
    // Technicians
    else if (actionType === 'TechnicianApproved' || actionType === 'SimulatorOverrideApproved') {
      bg = '#f0fdf4'; text = '#15803d'; border = '#bbf7d0';
    } else if (actionType === 'TechnicianRejected' || actionType === 'TechnicianRevoked') {
      bg = '#fff1f2'; text = '#be123c'; border = '#fecdd3';
    }
    // Catalog & Claims
    else if (actionType === 'CatalogItemCreated' || actionType === 'CatalogItemActivated' || actionType === 'ClaimApproved') {
      bg = '#ecfeff'; text = '#0e7490'; border = '#a5f3fc';
    } else if (actionType === 'CatalogPriceChanged') {
      bg = '#fffbeb'; text = '#b45309'; border = '#fde68a';
    } else if (actionType === 'CatalogItemDeactivated' || actionType === 'ClaimRejected') {
      bg = '#fef2f2'; text = '#991b1b'; border = '#fecaca';
    }
    // Jobs
    else if (actionType === 'JobAssigned' || actionType === 'JobReassigned') {
      bg = '#eff6ff'; text = '#2563eb'; border = '#bfdbfe';
    } else if (actionType === 'JobCancelled') {
      bg = '#fef2f2'; text = '#dc2626'; border = '#fecaca';
    } else if (actionType === 'JobDisputeResolved') {
      bg = '#faf5ff'; text = '#6b21a8'; border = '#e9d5ff';
    } else if (actionType === 'JobAgreedLabourSet') {
      bg = '#f0fdfa'; text = '#0f766e'; border = '#99f6e4';
    }
    // Financial
    else if (actionType === 'PayoutRecorded') {
      bg = '#eff6ff'; text = '#1e40af'; border = '#93c5fd';
    } else if (actionType === 'PayoutReversed') {
      bg = '#f3e8ff'; text = '#6b21a8'; border = '#d8b4fe';
    } else if (actionType === 'WalletAdjustedCredit') {
      bg = '#ecfdf5'; text = '#047857'; border = '#6ee7b7';
    } else if (actionType === 'WalletAdjustedDebit') {
      bg = '#ffe4e6'; text = '#9f1239'; border = '#fda4af';
    }

    return (
      <span
        style={{
          display: 'inline-block',
          padding: '0.2rem 0.5rem',
          borderRadius: '4px',
          fontSize: '0.72rem',
          fontWeight: 600,
          backgroundColor: bg,
          color: text,
          border: `1px solid ${border}`,
          whiteSpace: 'nowrap'
        }}
      >
        {actionType}
      </span>
    );
  };

  // Helper for rendering JSON strings safely
  const renderFormattedJson = (jsonString) => {
    if (!jsonString) return <span style={{ color: '#94a3b8' }}>None</span>;
    try {
      const parsed = JSON.parse(jsonString);
      return (
        <pre
          style={{
            margin: 0,
            padding: '0.65rem 0.85rem',
            backgroundColor: '#0b1528',
            color: '#38bdf8',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontFamily: 'Consolas, monospace',
            overflowX: 'auto',
            maxHeight: '220px'
          }}
        >
          {JSON.stringify(parsed, null, 2)}
        </pre>
      );
    } catch {
      return (
        <pre
          style={{
            margin: 0,
            padding: '0.65rem 0.85rem',
            backgroundColor: '#f1f5f9',
            color: '#334155',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontFamily: 'Consolas, monospace',
            overflowX: 'auto'
          }}
        >
          {jsonString}
        </pre>
      );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1440px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <HistoryIcon size={22} color="#2563eb" />
            Administrative Audit Trail
          </h1>
          <p className="admin-page-subtitle">
            Unified, immutable, append-only security log recording sensitive administrative state mutations across all platform subsystems.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={() => fetchAuditLogs(pagination.page)}
            disabled={loading}
          >
            <RefreshCwIcon size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh Audit Logs
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.85rem 1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangleIcon size={16} color="#dc2626" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="admin-card" style={{ padding: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', alignItems: 'end' }}>
          
          {/* Search */}
          <div className="admin-form-group">
            <label className="admin-label">Search</label>
            <input
              type="text"
              className="admin-input"
              placeholder="Search description, admin, ID, reason..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onKeyDown={(e) => { if (e.key === 'Enter') fetchAuditLogs(1); }}
            />
          </div>

          {/* Action Type */}
          <div className="admin-form-group">
            <label className="admin-label">Action Type</label>
            <select
              className="admin-select"
              value={filters.actionType}
              onChange={(e) => setFilters({ ...filters, actionType: e.target.value })}
            >
              <option value="">All Action Types</option>
              <optgroup label="User Account Operations">
                <option value="UserActivated">User Activated</option>
                <option value="UserDeactivated">User Deactivated</option>
                <option value="UserSuspended">User Suspended</option>
                <option value="UserRestored">User Restored</option>
              </optgroup>
              <optgroup label="Technician Review Operations">
                <option value="TechnicianApproved">Technician Approved</option>
                <option value="SimulatorOverrideApproved">Simulator Override Approved</option>
                <option value="TechnicianRejected">Technician Rejected</option>
                <option value="TechnicianRevoked">Technician Revoked</option>
              </optgroup>
              <optgroup label="Equipment & Catalog Operations">
                <option value="CatalogItemCreated">Catalog Item Created</option>
                <option value="CatalogItemUpdated">Catalog Item Updated</option>
                <option value="CatalogPriceChanged">Catalog Price Changed</option>
                <option value="CatalogItemDeactivated">Catalog Item Deactivated</option>
                <option value="CatalogItemActivated">Catalog Item Activated</option>
                <option value="ClaimApproved">Equipment Claim Approved</option>
                <option value="ClaimRejected">Equipment Claim Rejected</option>
              </optgroup>
              <optgroup label="Job Dispatch Operations">
                <option value="JobAssigned">Job Assigned</option>
                <option value="JobReassigned">Job Reassigned</option>
                <option value="JobCancelled">Job Cancelled</option>
                <option value="JobDisputeResolved">Job Dispute Resolved</option>
                <option value="JobAgreedLabourSet">Job Agreed Labour Set</option>
              </optgroup>
              <optgroup label="Financial & Wallet Operations">
                <option value="PayoutRecorded">Bank Payout Recorded</option>
                <option value="PayoutReversed">Bank Payout Reversed</option>
                <option value="WalletAdjustedCredit">Wallet Credit Adjustment</option>
                <option value="WalletAdjustedDebit">Wallet Debit Adjustment</option>
              </optgroup>
            </select>
          </div>

          {/* Entity Type */}
          <div className="admin-form-group">
            <label className="admin-label">Entity Subsystem</label>
            <select
              className="admin-select"
              value={filters.entityType}
              onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
            >
              <option value="">All Entity Subsystems</option>
              <option value="User">User</option>
              <option value="ElectricianProfile">ElectricianProfile</option>
              <option value="EquipmentCatalog">EquipmentCatalog</option>
              <option value="JobUsedEquipment">JobUsedEquipment</option>
              <option value="Job">Job</option>
              <option value="TechnicianPayoutRecord">TechnicianPayoutRecord</option>
              <option value="WalletTransaction">WalletTransaction</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="admin-form-group">
            <label className="admin-label">From Date (UTC)</label>
            <input
              type="date"
              className="admin-input"
              value={filters.startDateUtc}
              onChange={(e) => setFilters({ ...filters, startDateUtc: e.target.value })}
            />
          </div>

          {/* End Date */}
          <div className="admin-form-group">
            <label className="admin-label">To Date (UTC)</label>
            <input
              type="date"
              className="admin-input"
              value={filters.endDateUtc}
              onChange={(e) => setFilters({ ...filters, endDateUtc: e.target.value })}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              style={{ flex: 1 }}
              onClick={() => fetchAuditLogs(1)}
              disabled={loading}
            >
              <FilterIcon size={14} color="#ffffff" />
              Apply
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={handleResetFilters}
            >
              Reset
            </button>
          </div>

        </div>
      </div>

      {/* Audit Log Table */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>Log ID</th>
              <th style={{ width: '160px' }}>Timestamp (Local)</th>
              <th style={{ width: '180px' }}>Administrator</th>
              <th style={{ width: '180px' }}>Action Type</th>
              <th style={{ width: '160px' }}>Target Entity</th>
              <th>Description</th>
              <th style={{ width: '140px' }}>Client IP</th>
              <th style={{ width: '80px', textAlign: 'center' }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                  <RefreshCwIcon size={18} color="#2563eb" style={{ animation: 'spin 1s linear infinite', marginRight: '0.5rem' }} />
                  Retrieving immutable administrative audit logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  No administrative audit records found matching the specified filters.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.auditLogId}>
                  <td style={{ fontWeight: 600, color: '#334155' }}>
                    #{log.auditLogId}
                  </td>
                  <td style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap' }} title={`UTC: ${log.createdAtUtc}`}>
                    {formatDateTime(log.createdAtUtc)}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>
                      {log.AdminName || `Admin #${log.AdminUserId}`}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      {log.AdminEmail || `User ID: ${log.AdminUserId}`}
                    </div>
                  </td>
                  <td>
                    {renderActionBadge(log.actionType)}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '0.78rem', color: '#334155' }}>
                      {log.entityType}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      ID: <code style={{ backgroundColor: '#f1f5f9', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>{log.entityId}</code>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.78rem' }}>
                    <div style={{ color: '#1e293b', fontWeight: 500 }}>
                      {log.description}
                    </div>
                    {log.reason && (
                      <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: '0.2rem' }}>
                        <strong>Reason:</strong> {log.reason}
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                    {log.ipAddress ? (
                      <code style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.1rem 0.35rem', borderRadius: '3px' }}>
                        {log.ipAddress}
                      </code>
                    ) : (
                      <span style={{ color: '#cbd5e1' }}>—</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      className="admin-btn admin-btn-secondary admin-btn-sm"
                      onClick={() => handleOpenDetailModal(log)}
                      title="Inspect full audit record"
                    >
                      <EyeIcon size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Showing page {pagination.page} of {Math.max(1, pagination.totalPages)} ({pagination.totalCount} total audit entries)
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="admin-btn admin-btn-secondary admin-btn-sm"
              disabled={!pagination.hasPreviousPage || loading}
              onClick={() => fetchAuditLogs(pagination.page - 1)}
            >
              Previous
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-secondary admin-btn-sm"
              disabled={!pagination.hasNextPage || loading}
              onClick={() => fetchAuditLogs(pagination.page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Detail Inspection Modal */}
      {modalOpen && selectedLog && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            className="admin-card"
            style={{
              maxWidth: '680px',
              width: '100%',
              backgroundColor: '#ffffff',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Modal Header */}
            <div className="admin-card-header" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HistoryIcon size={18} color="#2563eb" />
                <h3 className="admin-card-title">
                  Audit Record #{selectedLog.auditLogId}
                </h3>
              </div>
              <button
                type="button"
                className="admin-btn admin-btn-ghost admin-btn-sm"
                onClick={() => setModalOpen(false)}
              >
                <XIcon size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.8125rem' }}>
              
              {/* Meta Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', padding: '0.75rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Administrator</span>
                  <strong>{selectedLog.adminName || `Admin #${selectedLog.adminUserId}`}</strong>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{selectedLog.adminEmail}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Action Type</span>
                  <div>{renderActionBadge(selectedLog.actionType)}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Affected Entity</span>
                  <strong>{selectedLog.entityType}</strong> (ID: {selectedLog.entityId})
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Originating Client IP</span>
                  <code>{selectedLog.ipAddress || 'Unavailable / Internal'}</code>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Local Timestamp</span>
                  <span>{formatDateTime(selectedLog.createdAtUtc)}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Exact UTC Timestamp</span>
                  <code style={{ fontSize: '0.72rem' }}>{selectedLog.createdAtUtc}</code>
                </div>
              </div>

              {/* Description */}
              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Description</span>
                <div style={{ padding: '0.5rem 0.75rem', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', marginTop: '0.25rem' }}>
                  {selectedLog.description}
                </div>
              </div>

              {/* Administrative Reason */}
              {selectedLog.reason && (
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Administrative Reason / Audit Justification</span>
                  <div style={{ padding: '0.5rem 0.75rem', backgroundColor: '#fefce8', border: '1px solid #fde047', borderRadius: '4px', marginTop: '0.25rem', color: '#713f12' }}>
                    {selectedLog.reason}
                  </div>
                </div>
              )}

              {/* Old Values Diff */}
              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Previous State (Old Values)</span>
                <div style={{ marginTop: '0.25rem' }}>
                  {renderFormattedJson(selectedLog.oldValues)}
                </div>
              </div>

              {/* New Values Diff */}
              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Committed State (New Values)</span>
                <div style={{ marginTop: '0.25rem' }}>
                  {renderFormattedJson(selectedLog.newValues)}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => setModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminAuditLogs;

