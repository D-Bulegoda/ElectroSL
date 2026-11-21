import React, { useState, useEffect, useCallback } from 'react';
import adminService from '../../services/adminService';
import StatusBadge from '../../components/admin/StatusBadge';
import JobDetailModal from '../../components/admin/JobDetailModal';
import { formatDateTime } from '../../utils/formattingHelpers';
import {
  BriefcaseIcon,
  SearchIcon,
  RefreshCwIcon,
  EyeIcon,
  AlertTriangleIcon,
  CheckIcon,
  ShieldAlertIcon,
  ClockIcon,
  MapPinIcon
} from '../../components/admin/AdminIcons';

export default function AdminJobManagement() {
  // Operational Summary State
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Job Listing State
  const [jobs, setJobs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [tableLoading, setTableLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('');
  const [emergencyFilter, setEmergencyFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Modal State
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedJobDetail, setSelectedJobDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // 1. Load Operational Summary
  const loadSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);
      const data = await adminService.getJobOperationalSummary();
      setSummary(data);
    } catch (err) {
      console.error('Failed to load operational summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  // 2. Load Jobs
  const loadJobs = useCallback(async () => {
    try {
      setTableLoading(true);
      setError(null);
      const isEmergencyParam = emergencyFilter === 'true' ? true : emergencyFilter === 'false' ? false : null;
      const resp = await adminService.getAdminJobs({
        status: statusFilter,
        jobType: jobTypeFilter,
        isEmergency: isEmergencyParam,
        search: searchQuery,
        page,
        pageSize
      });

      setJobs(resp.items || []);
      setTotalCount(resp.totalCount || 0);
      setTotalPages(resp.totalPages || 1);
    } catch (err) {
      console.error('Failed to load jobs:', err);
      setError(err.message || 'Unable to fetch job listings.');
    } finally {
      setTableLoading(false);
    }
  }, [statusFilter, jobTypeFilter, emergencyFilter, searchQuery, page, pageSize]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // Handle Search Submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearchQuery(searchInput.trim());
  };

  const handleResetFilters = () => {
    setStatusFilter('');
    setJobTypeFilter('');
    setEmergencyFilter('');
    setSearchQuery('');
    setSearchInput('');
    setPage(1);
  };

  // Open Dossier
  const handleOpenDossier = async (jobId) => {
    try {
      setSelectedJobId(jobId);
      setDetailLoading(true);
      const detail = await adminService.getAdminJobDetail(jobId);
      setSelectedJobDetail(detail);
    } catch (err) {
      console.error('Failed to load job dossier:', err);
      setFeedback({ type: 'error', message: err.message || 'Unable to load complete job dossier.' });
      setSelectedJobId(null);
      setSelectedJobDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  // Refresh Single Job Dossier (e.g. for concurrency conflict recovery)
  const handleRefreshDossier = async (jobId) => {
    try {
      const detail = await adminService.getAdminJobDetail(jobId);
      setSelectedJobDetail(detail);
      loadJobs();
      loadSummary();
    } catch (err) {
      console.error('Failed to refresh job dossier:', err);
      throw err;
    }
  };

  const handleActionSuccess = (msg) => {
    setFeedback({ type: 'success', message: msg });
    if (selectedJobId) {
      handleRefreshDossier(selectedJobId);
    }
    loadJobs();
    loadSummary();
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Page Title & Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <BriefcaseIcon size={18} />
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Job Operations & Dispatch
            </h1>
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>
            Central administration console for job tracking, manual dispatch, reassignments, and dispute resolution.
          </div>
        </div>

        <button
          type="button"
          onClick={() => { loadSummary(); loadJobs(); }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 0.85rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: '#334155',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          <RefreshCwIcon size={14} />
          Refresh Console
        </button>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            marginBottom: '1.25rem',
            fontSize: '0.8125rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: feedback.type === 'error' ? '#fef2f2' : '#ecfdf5',
            border: `1px solid ${feedback.type === 'error' ? '#fecaca' : '#a7f3d0'}`,
            color: feedback.type === 'error' ? '#991b1b' : '#065f46'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {feedback.type === 'error' ? <AlertTriangleIcon size={16} /> : <CheckIcon size={16} />}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.1rem' }}
          >
            &times;
          </button>
        </div>
      )}

      {/* 1. OPERATIONAL SUMMARY METRICS GRID */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1.5rem'
        }}
      >
        {[
          { label: 'Total Jobs', key: 'totalJobs', color: '#0f172a', bg: '#f8fafc', border: '#e2e8f0', filter: '' },
          { label: 'Pending', key: 'pendingJobs', color: '#b45309', bg: '#fffbeb', border: '#fde68a', filter: 'Pending' },
          { label: 'Unassigned', key: 'unassignedJobs', color: '#d97706', bg: '#fffbeb', border: '#fed7aa', filter: 'Pending' },
          { label: 'Assigned', key: 'assignedJobs', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', filter: 'Assigned' },
          { label: 'In Progress', key: 'inProgressJobs', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', filter: 'InProgress' },
          { label: 'Completed', key: 'completedJobs', color: '#0f766e', bg: '#f0fdfa', border: '#99f6e4', filter: 'Completed' },
          { label: 'Disputed', key: 'disputedJobs', color: '#be123c', bg: '#fff1f2', border: '#fecdd3', filter: 'Disputed' },
          { label: 'Cancelled', key: 'cancelledJobs', color: '#991b1b', bg: '#fef2f2', border: '#fecaca', filter: 'Cancelled' },
          { label: 'Emergency SOS', key: 'emergencyJobs', color: '#b91c1c', bg: '#fef2f2', border: '#fca5a5', emergency: 'true' },
          { label: 'Stuck Assigned', key: 'stuckAssignedJobs', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', filter: 'Assigned' },
          { label: 'Overdue Work', key: 'overdueInProgressJobs', color: '#c2410c', bg: '#fff7ed', border: '#ffedd5', filter: 'InProgress' }
        ].map((metric) => {
          const value = summary ? summary[metric.key] : 0;
          const isActiveFilter = metric.filter !== undefined && metric.filter === statusFilter;
          return (
            <div
              key={metric.key}
              onClick={() => {
                if (metric.emergency) {
                  setEmergencyFilter(metric.emergency);
                  setStatusFilter('');
                } else if (metric.filter !== undefined) {
                  setStatusFilter(metric.filter);
                  setEmergencyFilter('');
                }
                setPage(1);
              }}
              style={{
                padding: '0.75rem',
                borderRadius: '6px',
                backgroundColor: metric.bg,
                border: `1px solid ${isActiveFilter ? metric.color : metric.border}`,
                boxShadow: isActiveFilter ? `0 0 0 2px ${metric.border}` : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {metric.label}
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 700, color: metric.color, marginTop: '0.2rem' }}>
                {summaryLoading ? '-' : value}
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. FILTER & SEARCH CONTROL BAR */}
      <div
        style={{
          padding: '1rem',
          borderRadius: '8px',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          marginBottom: '1rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem'
        }}
      >
        {/* Left: Search input */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 280px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
            <span style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
              <SearchIcon size={14} />
            </span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by job ID, customer, electrician, notes..."
              style={{
                width: '100%',
                padding: '0.45rem 0.65rem 0.45rem 2rem',
                fontSize: '0.8125rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                outline: 'none'
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: '0.45rem 0.85rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: '#ffffff',
              backgroundColor: '#2563eb',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Search
          </button>
        </form>

        {/* Right: Dropdown Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{
              padding: '0.45rem 0.65rem',
              fontSize: '0.8125rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#334155'
            }}
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Assigned">Assigned</option>
            <option value="InProgress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Disputed">Disputed</option>
          </select>

          {/* Job Type Dropdown */}
          <select
            value={jobTypeFilter}
            onChange={(e) => { setJobTypeFilter(e.target.value); setPage(1); }}
            style={{
              padding: '0.45rem 0.65rem',
              fontSize: '0.8125rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#334155'
            }}
          >
            <option value="">All Job Types</option>
            <option value="Maintenance">Maintenance</option>
            <option value="NewConstruction">New Construction</option>
          </select>

          {/* Emergency Dropdown */}
          <select
            value={emergencyFilter}
            onChange={(e) => { setEmergencyFilter(e.target.value); setPage(1); }}
            style={{
              padding: '0.45rem 0.65rem',
              fontSize: '0.8125rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#334155'
            }}
          >
            <option value="">All Priorities</option>
            <option value="true">Emergency SOS Only</option>
            <option value="false">Standard Priority</option>
          </select>

          {/* Reset Filters Button */}
          {(statusFilter || jobTypeFilter || emergencyFilter || searchQuery) && (
            <button
              type="button"
              onClick={handleResetFilters}
              style={{
                padding: '0.45rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#64748b',
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* 3. JOBS DATA TABLE */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
        }}
      >
        {tableLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>
            Loading job listings...
          </div>
        ) : error ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: '#dc2626' }}>
            <div style={{ fontWeight: 600 }}>Error loading jobs</div>
            <div style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>{error}</div>
          </div>
        ) : jobs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>No jobs found</div>
            <div style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: '0.25rem' }}>
              No job records match the selected status, category, or search criteria.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Job ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Type & Details</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Customer</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Assigned Electrician</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Created</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Location</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr
                    key={job.jobId}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background-color 0.1s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                  >
                    {/* Job ID & Priority */}
                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>#{job.jobId}</span>
                        {job.isEmergency && (
                          <span
                            style={{
                              fontSize: '0.625rem',
                              fontWeight: 700,
                              padding: '0.1rem 0.35rem',
                              borderRadius: '3px',
                              backgroundColor: '#fee2e2',
                              color: '#b91c1c',
                              border: '1px solid #fca5a5'
                            }}
                          >
                            SOS
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>v{job.concurrencyVersion}</span>
                    </td>

                    {/* Type & Description */}
                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle', maxWidth: '240px' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{job.jobType}</div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: '#64748b',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={job.description}
                      >
                        {job.description || 'No description'}
                      </div>
                    </td>

                    {/* Customer */}
                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{job.customerName}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{job.customerPhone || job.customerEmail}</div>
                    </td>

                    {/* Assigned Electrician */}
                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }}>
                      {job.electricianName ? (
                        <div>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{job.electricianName}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            {job.electricianSpecialization || job.electricianPhone}
                          </div>
                        </div>
                      ) : (
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            backgroundColor: '#fffbeb',
                            color: '#92400e',
                            border: '1px solid #fde68a'
                          }}
                        >
                          Unassigned
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }}>
                      <StatusBadge status={job.status} />
                    </td>

                    {/* Created Date */}
                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle', whiteSpace: 'nowrap', color: '#475569', fontSize: '0.75rem' }}>
                      {formatDateTime(job.createdAt)}
                    </td>

                    {/* Location */}
                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle', color: '#64748b', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                      {job.locationLat?.toFixed(3)}, {job.locationLng?.toFixed(3)}
                    </td>

                    {/* Action */}
                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenDossier(job.jobId)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.35rem 0.65rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: '#2563eb',
                          backgroundColor: '#eff6ff',
                          border: '1px solid #bfdbfe',
                          borderRadius: '5px',
                          cursor: 'pointer'
                        }}
                      >
                        <EyeIcon size={13} />
                        Dossier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div
          style={{
            padding: '0.75rem 1rem',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#f8fafc',
            fontSize: '0.8125rem',
            color: '#64748b'
          }}
        >
          <div>
            Showing {jobs.length > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, totalCount)} of {totalCount} jobs
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: page <= 1 ? '#94a3b8' : '#334155',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                cursor: page <= 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Previous
            </button>

            <span style={{ fontSize: '0.75rem', color: '#475569' }}>
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: page >= totalPages ? '#94a3b8' : '#334155',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* 4. JOB DETAIL / DOSSIER MODAL */}
      {selectedJobDetail && (
        <JobDetailModal
          job={selectedJobDetail}
          onClose={() => { setSelectedJobId(null); setSelectedJobDetail(null); }}
          onRefresh={handleRefreshDossier}
          onActionSuccess={handleActionSuccess}
        />
      )}
    </div>
  );
}
