import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatsCard from '../../components/admin/StatsCard';
import StatusBadge from '../../components/admin/StatusBadge';
import adminService from '../../services/adminService';
import { formatCurrency, formatDateTime } from '../../utils/formattingHelpers';
import {
  ClipboardCheckIcon,
  UsersCheckIcon,
  UserXIcon,
  TagIcon,
  RefreshCwIcon,
  ArrowLeftIcon,
  CheckIcon,
  ShieldAlertIcon
} from '../../components/admin/AdminIcons';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalElectricians: 0,
    pendingApprovals: 0,
    approvedCount: 0,
    rejectedCount: 0,
    activeJobs: 0,
    totalCommissionCollected: 0,
    flaggedEquipmentClaims: 0
  });
  const [pendingQueue, setPendingQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const [statsData, pendingData] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getApplications('Pending').catch(() => [])
      ]);
      setStats(statsData || {});
      setPendingQueue(pendingData || []);
    } catch (err) {
      console.warn('Dashboard data fetch note:', err);
      setError('Operating with current database records.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1280px' }}>
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Operations & Compliance Dashboard</h1>
          <p className="admin-page-subtitle">
            Centralized monitoring of technician licensing, accreditation checks, and price benchmark controls.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchDashboardData}
          disabled={refreshing}
          className="admin-btn admin-btn-secondary"
        >
          <RefreshCwIcon size={14} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Feed'}</span>
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: '0.65rem 1rem',
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '4px',
            color: '#92400e',
            fontSize: '0.8125rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span>ℹ️</span>
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stats Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem'
        }}
      >
        <StatsCard
          title="Pending Approvals"
          value={loading ? '—' : stats.pendingApprovals ?? 0}
          subtitle="Requires credential review"
          color="yellow"
          icon={<ClipboardCheckIcon size={18} />}
          onClick={() => navigate('/admin/approvals')}
        />
        <StatsCard
          title="Approved Electricians"
          value={loading ? '—' : stats.approvedCount ?? 0}
          subtitle="Authorized on platform"
          color="green"
          icon={<UsersCheckIcon size={18} />}
          onClick={() => navigate('/admin/approved')}
        />
        <StatsCard
          title="Rejected Applications"
          value={loading ? '—' : stats.rejectedCount ?? 0}
          subtitle="Non-compliant submissions"
          color="red"
          icon={<UserXIcon size={18} />}
          onClick={() => navigate('/admin/rejected')}
        />
        <StatsCard
          title="Total Commission"
          value={loading ? '—' : formatCurrency(stats.totalCommissionCollected || 0)}
          subtitle="15% platform earnings"
          color="blue"
          icon={<TagIcon size={18} />}
        />
        <StatsCard
          title="Total Customers"
          value={loading ? '—' : stats.totalCustomers ?? 0}
          subtitle="Registered clients"
          color="blue"
          icon={<UsersCheckIcon size={18} />}
          onClick={() => navigate('/admin/users')}
        />
        <StatsCard
          title="Suspended Accounts"
          value={loading ? '—' : stats.totalSuspendedAccounts ?? 0}
          subtitle="Access revoked"
          color="red"
          icon={<ShieldAlertIcon size={18} />}
          onClick={() => navigate('/admin/users')}
        />
      </div>

      {/* Main Grid: Pending Queue (65%) & Compliance Controls (35%) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.25rem',
          alignItems: 'start'
        }}
      >
        {/* Left: Pending Verification Queue */}
        <div className="admin-card" style={{ flex: 1 }}>
          <div className="admin-card-header">
            <div>
              <h2 className="admin-card-title">Pending Verification Queue</h2>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Electricians awaiting credential validation before licensing
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/approvals')}
              className="admin-btn admin-btn-ghost admin-btn-sm"
            >
              View All ({stats.pendingApprovals ?? 0}) →
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Specialization</th>
                  <th>Simulator</th>
                  <th>Documents</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8' }}>
                      Loading verification queue...
                    </td>
                  </tr>
                ) : pendingQueue.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                      <span style={{ display: 'block', fontSize: '1.25rem', marginBottom: '0.25rem' }}>✓</span>
                      No pending applications awaiting review.
                    </td>
                  </tr>
                ) : (
                  pendingQueue.slice(0, 5).map((app) => (
                    <tr key={app.profileId}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{app.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{app.email}</div>
                      </td>
                      <td style={{ color: '#334155' }}>
                        {app.specialization || 'General Electrician'}
                      </td>
                      <td>
                        {app.simulatorPassed ? (
                          <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.75rem' }}>
                            ✓ Passed
                          </span>
                        ) : (
                          <span style={{ color: '#d97706', fontWeight: 600, fontSize: '0.75rem' }}>
                            ⏳ Incomplete
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              padding: '0.1rem 0.35rem',
                              borderRadius: '3px',
                              backgroundColor: app.nicDocumentUrl ? '#ecfdf5' : '#fef2f2',
                              color: app.nicDocumentUrl ? '#065f46' : '#991b1b',
                              border: `1px solid ${app.nicDocumentUrl ? '#a7f3d0' : '#fecaca'}`,
                              fontWeight: 600
                            }}
                          >
                            NIC
                          </span>
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              padding: '0.1rem 0.35rem',
                              borderRadius: '3px',
                              backgroundColor: app.nvqCertificateUrl ? '#ecfdf5' : '#fef2f2',
                              color: app.nvqCertificateUrl ? '#065f46' : '#991b1b',
                              border: `1px solid ${app.nvqCertificateUrl ? '#a7f3d0' : '#fecaca'}`,
                              fontWeight: 600
                            }}
                          >
                            NVQ
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/applications/${app.profileId}`)}
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                        >
                          Review Dossier
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Operational Controls & Compliance Policy */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Equipment Price Baseline & Claims */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">Equipment Price Control</h2>
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#475569', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
              Standard retail baselines for electrical materials. Technician invoice line-items exceeding allowable variance are automatically flagged for administrator review.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => navigate('/admin/equipment-claims')}
                className="admin-btn admin-btn-danger"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <ShieldAlertIcon size={15} />
                <span>Review Flagged Claims ({stats.flaggedEquipmentClaims || 0})</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/catalog')}
                className="admin-btn admin-btn-secondary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <TagIcon size={15} />
                <span>Manage Equipment Catalog</span>
              </button>
            </div>
          </div>

          {/* Licensing Policy Standards */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">Onboarding Compliance Criteria</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✓</span>
                <div>
                  <strong style={{ color: '#0f172a' }}>Accredited NVQ Level 4</strong>
                  <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Certified by TVEC or recognized institute.</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✓</span>
                <div>
                  <strong style={{ color: '#0f172a' }}>National Identity Verification</strong>
                  <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Legitimate Sri Lankan NIC document copy.</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✓</span>
                <div>
                  <strong style={{ color: '#0f172a' }}>Circuit Simulator Test</strong>
                  <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Passing score (≥ 75%) without critical wiring faults.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
