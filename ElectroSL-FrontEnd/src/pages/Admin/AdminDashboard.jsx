import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService from '../../services/adminService';
import { formatDateTime } from '../../utils/formattingHelpers';
import { MonthlyJobActivityLineChart } from '../../components/admin/AdminCharts';
import {
  BriefcaseIcon,
  UsersCheckIcon,
  ClipboardCheckIcon,
  TagIcon,
  CreditCardIcon,
  FileTextIcon,
  AlertTriangleIcon,
  RefreshCwIcon,
  ArrowRightIcon,
  CheckIcon,
  ClockIcon
} from '../../components/admin/AdminIcons';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      setError(null);
      // Fetch year-to-date data so monthly job activity has complete trend points
      const data = await adminService.getDashboardAnalytics('this_year');
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Unable to load dashboard data from server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Compute Core Metrics
  const totalJobs = analytics?.jobStatuses?.total || 0;
  const totalCustomers = analytics?.totalCustomers || 0;
  const totalTechnicians = analytics?.totalTechnicians || 0;
  const registeredUsers = totalCustomers + totalTechnicians;

  const pendingTechs = analytics?.pendingTechnicianVerifications || 0;
  const pendingJobs = analytics?.jobStatuses?.pending || 0;
  const flaggedClaims = analytics?.flaggedEquipmentClaims || 0;
  const itemsRequiringAttention = pendingTechs + pendingJobs + flaggedClaims;

  // Quick access shortcuts
  const shortcuts = [
    { label: 'Manage Jobs', path: '/admin/jobs', icon: <BriefcaseIcon size={18} color="#2563eb" />, count: `${totalJobs} Jobs` },
    { label: 'Manage Users', path: '/admin/users', icon: <UsersCheckIcon size={18} color="#059669" />, count: `${registeredUsers} Users` },
    { label: 'Technicians', path: '/admin/technicians', icon: <ClipboardCheckIcon size={18} color="#7c3aed" />, count: `${totalTechnicians} Techs` },
    { label: 'Equipment', path: '/admin/equipment', icon: <TagIcon size={18} color="#d97706" />, count: 'Price Catalog' },
    { label: 'Finance', path: '/admin/finance', icon: <CreditCardIcon size={18} color="#0284c7" />, count: 'Ledger & Payouts' },
    { label: 'Reports', path: '/admin/reports', icon: <FileTextIcon size={18} color="#475569" />, count: 'Exports' }
  ];

  // Latest 3 Audit Activities
  const recentActivities = (analytics?.recentAudits || []).slice(0, 3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1280px', margin: '0 auto', paddingBottom: '1.5rem' }}>
      
      {/* 1. Welcome / Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Dashboard
          </h1>
          <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
            Welcome to the ElectroSL administration overview. Monitor system activity and access management tools.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchDashboardData}
          disabled={refreshing}
          className="admin-btn admin-btn-secondary"
          style={{ height: '32px', fontSize: '0.78rem' }}
        >
          <RefreshCwIcon size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          <span>{refreshing ? 'Updating...' : 'Refresh'}</span>
        </button>
      </div>

      {error && (
        <div style={{ padding: '0.65rem 1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#991b1b', fontSize: '0.8125rem' }}>
          {error}
        </div>
      )}

      {/* 2. Four Compact KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '0.85rem'
        }}
      >
        {/* Total Jobs */}
        <div className="admin-card" style={{ padding: '0.9rem 1.1rem', borderLeft: '4px solid #2563eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.72rem', fontWeight: 600 }}>
            <span>TOTAL JOBS</span>
            <BriefcaseIcon size={16} color="#2563eb" />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0 0.1rem 0' }}>
            {loading ? '—' : totalJobs}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
            Active: <strong>{analytics?.activeJobs || 0}</strong> · Pending: <strong>{pendingJobs}</strong>
          </div>
        </div>

        {/* Registered Users */}
        <div className="admin-card" style={{ padding: '0.9rem 1.1rem', borderLeft: '4px solid #059669' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.72rem', fontWeight: 600 }}>
            <span>REGISTERED USERS</span>
            <UsersCheckIcon size={16} color="#059669" />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#065f46', margin: '0.25rem 0 0.1rem 0' }}>
            {loading ? '—' : registeredUsers}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
            {totalCustomers} Customers · {totalTechnicians} Technicians
          </div>
        </div>

        {/* Total Technicians */}
        <div className="admin-card" style={{ padding: '0.9rem 1.1rem', borderLeft: '4px solid #7c3aed' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.72rem', fontWeight: 600 }}>
            <span>TOTAL TECHNICIANS</span>
            <ClipboardCheckIcon size={16} color="#7c3aed" />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#5b21b6', margin: '0.25rem 0 0.1rem 0' }}>
            {loading ? '—' : totalTechnicians}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
            Approved: <strong>{analytics?.technicianStats?.approved || 0}</strong> · Pending: <strong>{pendingTechs}</strong>
          </div>
        </div>

        {/* Items Requiring Attention */}
        <div
          className="admin-card"
          style={{
            padding: '0.9rem 1.1rem',
            borderLeft: `4px solid ${itemsRequiringAttention > 0 ? '#d97706' : '#10b981'}`,
            backgroundColor: itemsRequiringAttention > 0 ? '#fffbeb' : '#f0fdf4'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: itemsRequiringAttention > 0 ? '#92400e' : '#166534',
              fontSize: '0.72rem',
              fontWeight: 600
            }}
          >
            <span>ITEMS REQUIRING ATTENTION</span>
            <AlertTriangleIcon size={16} color={itemsRequiringAttention > 0 ? '#d97706' : '#10b981'} />
          </div>
          <div
            style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              color: itemsRequiringAttention > 0 ? '#b45309' : '#15803d',
              margin: '0.25rem 0 0.1rem 0'
            }}
          >
            {loading ? '—' : itemsRequiringAttention}
          </div>
          <div style={{ fontSize: '0.72rem', color: itemsRequiringAttention > 0 ? '#92400e' : '#166534' }}>
            {itemsRequiringAttention === 0 ? 'All items up to date' : `${pendingTechs} Techs · ${pendingJobs} Jobs · ${flaggedClaims} Claims`}
          </div>
        </div>
      </div>

      {/* 3. Quick Access (Six Navigation Shortcuts) */}
      <div>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
          Quick Access
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.75rem'
          }}
        >
          {shortcuts.map((sc) => (
            <div
              key={sc.label}
              onClick={() => navigate(sc.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 0.9rem',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#2563eb';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(37,99,235,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.02)';
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  backgroundColor: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #f1f5f9'
                }}
              >
                {sc.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.825rem', fontWeight: 600, color: '#0f172a' }}>{sc.label}</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{sc.count}</div>
              </div>
              <ArrowRightIcon size={13} color="#94a3b8" />
            </div>
          ))}
        </div>
      </div>

      {/* 4. Middle Section: (Left) Monthly Job Activity & (Right) Needs Attention */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.25rem',
          alignItems: 'stretch'
        }}
      >
        {/* EXACTLY ONE GRAPH: Monthly Job Activity */}
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="admin-card-header" style={{ padding: '0.85rem 1.1rem' }}>
            <div>
              <h2 className="admin-card-title" style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                Monthly Job Activity
              </h2>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Job creation volume over recent months from real platform records
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/jobs')}
              className="admin-btn admin-btn-ghost admin-btn-sm"
              style={{ fontSize: '0.75rem', color: '#2563eb' }}
            >
              View Jobs →
            </button>
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0.5rem 1rem 1rem 1rem' }}>
            <MonthlyJobActivityLineChart data={analytics?.jobTrends || []} height={160} />
          </div>
        </div>

        {/* Needs Attention Panel */}
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="admin-card-header" style={{ padding: '0.85rem 1.1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <AlertTriangleIcon size={16} color="#d97706" />
              <h2 className="admin-card-title" style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                Needs Attention
              </h2>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
              Action Required
            </span>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '0.85rem 1.1rem' }}>
            {itemsRequiringAttention === 0 ? (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1.5rem',
                  backgroundColor: '#f0fdf4',
                  border: '1px dashed #bbf7d0',
                  borderRadius: '6px',
                  color: '#166534',
                  textAlign: 'center'
                }}
              >
                <CheckIcon size={22} color="#16a34a" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '0.35rem' }}>
                  All Operational Items Up to Date
                </span>
                <span style={{ fontSize: '0.75rem', color: '#15803d' }}>
                  No pending verifications, unassigned emergency jobs, or flagged claims.
                </span>
              </div>
            ) : (
              <>
                {/* 1. Pending Technician Applications */}
                {pendingTechs > 0 && (
                  <div
                    onClick={() => navigate('/admin/technicians')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      backgroundColor: '#fffbeb',
                      border: '1px solid #fde68a',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#d97706')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#fde68a')}
                  >
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#92400e' }}>
                        {pendingTechs} Technician Application{pendingTechs === 1 ? '' : 's'} Pending
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#b45309' }}>
                        Awaiting TVEC NVQ Level 4 & NIC accreditation review
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600 }}>Review →</span>
                  </div>
                )}

                {/* 2. Pending Jobs Requiring Action */}
                {pendingJobs > 0 && (
                  <div
                    onClick={() => navigate('/admin/jobs')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      backgroundColor: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#2563eb')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#bfdbfe')}
                  >
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e40af' }}>
                        {pendingJobs} Job{pendingJobs === 1 ? '' : 's'} Awaiting Dispatch / Action
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#3b82f6' }}>
                        Customer jobs awaiting quotation bids or electrician assignment
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600 }}>Inspect →</span>
                  </div>
                )}

                {/* 3. Flagged Equipment Claims */}
                {flaggedClaims > 0 && (
                  <div
                    onClick={() => navigate('/admin/equipment')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#dc2626')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#fecaca')}
                  >
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#991b1b' }}>
                        {flaggedClaims} Equipment Price Claim{flaggedClaims === 1 ? '' : 's'} Flagged
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#b91c1c' }}>
                        Material price exceeds catalog threshold by &gt; 20%
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600 }}>Verify →</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 5. Recent Activity (Latest 3 items) */}
      <div className="admin-card" style={{ padding: '0.85rem 1.1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <ClockIcon size={15} color="#64748b" />
            <h2 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Recent Activity
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin/audit-logs')}
            className="admin-btn admin-btn-ghost admin-btn-sm"
            style={{ fontSize: '0.75rem', color: '#2563eb' }}
          >
            View full Audit Logs →
          </button>
        </div>

        {recentActivities.length === 0 ? (
          <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.78rem' }}>
            No recent administrative activities recorded.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {recentActivities.map((act, idx) => (
              <div
                key={act.auditLogId || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.45rem 0.75rem',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #f1f5f9',
                  borderRadius: '4px',
                  fontSize: '0.78rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      color: '#1e40af',
                      backgroundColor: '#dbeafe',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '3px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {act.actionType || 'AdminAction'}
                  </span>
                  <span style={{ color: '#334155', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {act.description || `${act.actionType} on ${act.entityType} #${act.entityId}`}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                    {act.adminEmail || 'admin'}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                    {formatDateTime(act.createdAtUtc)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
