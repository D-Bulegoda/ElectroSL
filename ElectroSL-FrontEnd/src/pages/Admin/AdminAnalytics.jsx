import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService from '../../services/adminService';
import { formatCurrency, formatDateTime } from '../../utils/formattingHelpers';
import {
  BiStatCard,
  BiMultiLineChart,
  ComparisonDeltaBadge,
  TopEquipmentBarWidget,
  JobVelocitySummaryWidget,
  PaymentMethodDonutChart
} from '../../components/admin/AdminCharts';
import {
  TrendingUpIcon,
  DollarSignIcon,
  BriefcaseIcon,
  UsersCheckIcon,
  TagIcon,
  ActivityIcon,
  RefreshCwIcon,
  AlertTriangleIcon,
  CalendarIcon,
  ArrowUpRightIcon,
  ShieldAlertIcon,
  ClockIcon
} from '../../components/admin/AdminIcons';

const DATE_RANGE_OPTIONS = [
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: '90d', label: 'Last 90 Days' },
  { id: 'this_year', label: 'This Year' },
  { id: 'all', label: 'All Time' }
];

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [activeTab, setActiveTab] = useState('financial');

  const [biData, setBiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchBiData = async (range = dateRange, from = customFrom, to = customTo) => {
    try {
      setRefreshing(true);
      setError(null);

      if (range === 'custom' && from && to && new Date(from) > new Date(to)) {
        setError("Invalid date range: 'From' date cannot be later than 'To' date.");
        setRefreshing(false);
        setLoading(false);
        return;
      }

      const res = await adminService.getAdvancedAnalytics(range, from, to);
      setBiData(res);
    } catch (err) {
      console.error('Failed to load advanced business intelligence:', err);
      setError('Unable to load authoritative intelligence dataset.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (dateRange !== 'custom') {
      fetchBiData(dateRange);
    }
  }, [dateRange]);

  const handleRangeChange = (newRange) => {
    setDateRange(newRange);
  };

  const handleApplyCustom = (e) => {
    e.preventDefault();
    if (!customFrom || !customTo) return;
    if (new Date(customFrom) > new Date(customTo)) {
      setError("Invalid custom range: 'From' date cannot be later than 'To' date.");
      return;
    }
    setError(null);
    fetchBiData('custom', customFrom, customTo);
  };

  const fin = biData?.financial || {};
  const jobs = biData?.jobs || {};
  const techs = biData?.technicians || {};
  const equip = biData?.equipment || {};
  const growth = biData?.growth || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1360px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* 1. Header & Navigation Controls */}
      <div className="admin-page-header" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <h1 className="admin-page-title" style={{ margin: 0, fontSize: '1.35rem' }}>
              Advanced Analytics & Business Intelligence
            </h1>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                color: '#1e40af',
                backgroundColor: '#dbeafe',
                padding: '0.15rem 0.5rem',
                borderRadius: '12px'
              }}
            >
              Authoritative BI Telemetry
            </span>
          </div>
          <p className="admin-page-subtitle" style={{ margin: 0 }}>
            Period-over-period financial reconciliation, job velocity, workforce participation, equipment claims economics, and platform growth curves.
          </p>
        </div>

        {/* Global Controls & Views */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {/* Quick link to Dashboard and Reports */}
          <button
            type="button"
            onClick={() => navigate('/admin/dashboard')}
            className="admin-btn admin-btn-secondary"
            style={{ fontSize: '0.78rem' }}
          >
            ← Live Operations Dashboard
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin/reports')}
            className="admin-btn admin-btn-secondary"
            style={{ fontSize: '0.78rem' }}
          >
            Export Reports
          </button>

          <button
            type="button"
            onClick={() => fetchBiData(dateRange, customFrom, customTo)}
            disabled={refreshing}
            className="admin-btn admin-btn-secondary"
            style={{ fontSize: '0.78rem' }}
          >
            <RefreshCwIcon size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            <span>{refreshing ? 'Updating...' : 'Refresh Feed'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '4px',
            color: '#991b1b',
            fontSize: '0.8125rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem'
          }}
        >
          <AlertTriangleIcon size={16} color="#dc2626" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Filter Bar with Period Presets & Custom Date Picker */}
      <div className="admin-card" style={{ padding: '0.85rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Section Navigation Tabs */}
          <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '2px' }}>
            {[
              { id: 'financial', label: 'Financial Performance', icon: <DollarSignIcon size={14} /> },
              { id: 'jobs', label: 'Job Dispatch & Velocity', icon: <BriefcaseIcon size={14} /> },
              { id: 'technicians', label: 'Technician Performance', icon: <UsersCheckIcon size={14} /> },
              { id: 'equipment', label: 'Equipment & Claims', icon: <TagIcon size={14} /> },
              { id: 'growth', label: 'Platform Growth & Demand', icon: <TrendingUpIcon size={14} /> }
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.45rem 0.85rem',
                    border: 'none',
                    borderRadius: '4px',
                    backgroundColor: active ? '#2563eb' : '#f1f5f9',
                    color: active ? '#ffffff' : '#334155',
                    fontWeight: active ? 600 : 500,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Period Selector Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Period:</span>
            <div
              style={{
                display: 'flex',
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '2px'
              }}
            >
              {DATE_RANGE_OPTIONS.map((opt) => {
                const active = dateRange === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleRangeChange(opt.id)}
                    style={{
                      border: 'none',
                      backgroundColor: active ? '#2563eb' : 'transparent',
                      color: active ? '#ffffff' : '#475569',
                      fontWeight: active ? 600 : 500,
                      fontSize: '0.75rem',
                      padding: '0.3rem 0.65rem',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setDateRange('custom')}
                style={{
                  border: 'none',
                  backgroundColor: dateRange === 'custom' ? '#2563eb' : 'transparent',
                  color: dateRange === 'custom' ? '#ffffff' : '#475569',
                  fontWeight: dateRange === 'custom' ? 600 : 500,
                  fontSize: '0.75rem',
                  padding: '0.3rem 0.65rem',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Custom
              </button>
            </div>
          </div>
        </div>

        {/* Custom Date Form */}
        {dateRange === 'custom' && (
          <form
            onSubmit={handleApplyCustom}
            style={{
              marginTop: '0.75rem',
              paddingTop: '0.75rem',
              borderTop: '1px dashed #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
              <span style={{ color: '#475569' }}>From:</span>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                style={{ padding: '0.3rem 0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.8rem' }}
                required
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
              <span style={{ color: '#475569' }}>To:</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                style={{ padding: '0.3rem 0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.8rem' }}
                required
              />
            </div>
            <button type="submit" className="admin-btn admin-btn-secondary admin-btn-sm">
              Apply Comparison Range
            </button>
          </form>
        )}
      </div>

      {/* 3. Executive Cross-Module KPI Cards with Previous-Period Comparison Badges */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '0.85rem'
        }}
      >
        <BiStatCard
          title="Gross Merchandise Value"
          value={fin.totalGmv || 0}
          priorValue={fin.priorGmv || 0}
          delta={fin.gmvChangePercentage}
          isCurrency={true}
          note="Full agreed job value"
          accentColor="#2563eb"
        />

        <BiStatCard
          title="Platform Commission (15%)"
          value={fin.platformCommission || 0}
          priorValue={fin.priorPlatformCommission || 0}
          delta={fin.commissionChangePercentage}
          isCurrency={true}
          note="Authoritative platform revenue"
          accentColor="#10b981"
        />

        <BiStatCard
          title="Electrician Earnings (85%)"
          value={fin.electricianEarnings || 0}
          priorValue={fin.priorElectricianEarnings || 0}
          delta={fin.earningsChangePercentage}
          isCurrency={true}
          note="Technician compensation"
          accentColor="#6366f1"
        />

        <BiStatCard
          title="Jobs Created in Period"
          value={jobs.totalJobsCreated || 0}
          priorValue={jobs.priorJobsCreated || 0}
          delta={jobs.jobsCreatedChangePercentage}
          note={`${jobs.completedJobs || 0} completed`}
          accentColor="#f59e0b"
        />

        <BiStatCard
          title="New Customer Registrations"
          value={growth.newCustomersInPeriod || 0}
          priorValue={growth.priorNewCustomers || 0}
          delta={growth.customerGrowthRate}
          note={`${growth.totalCustomers || 0} total customers`}
          accentColor="#06b6d4"
        />

        <div className="admin-card" style={{ padding: '1rem', borderTop: '3px solid #64748b', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                Wallet Liability (Snapshot)
              </span>
              <span style={{ fontSize: '0.68rem', backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px' }}>
                Current Balance
              </span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#334155', letterSpacing: '-0.02em', margin: '0.2rem 0' }}>
              {formatCurrency(fin.outstandingWalletLiability || 0)}
            </div>
          </div>
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem', marginTop: '0.5rem', fontSize: '0.72rem', color: '#64748b' }}>
            Active virtual balance owed to electricians
          </div>
        </div>
      </div>

      {/* 4. Tab 1: Financial Performance Insights */}
      {activeTab === 'financial' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Main Financial Curve */}
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <h2 className="admin-card-title">Financial Flow Telemetry Over Time</h2>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Gross Merchandise Value, Platform Commission (15%), Electrician Earnings (85%), and Inflow Collections
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600 }}>15% Commission Rate</span>
              </div>
            </div>

            <div style={{ padding: '0.5rem 0' }}>
              <BiMultiLineChart
                data={fin.trends || []}
                lines={[
                  { key: 'gmv', label: 'GMV (LKR)', color: '#2563eb', strokeWidth: 2.5 },
                  { key: 'electricianEarnings', label: 'Electrician Earnings (85%)', color: '#6366f1', strokeWidth: 2 },
                  { key: 'commission', label: 'Commission (15%)', color: '#10b981', strokeWidth: 2 },
                  { key: 'onlineCollections', label: 'Online Inflow', color: '#06b6d4', strokeWidth: 1.5, dashed: true },
                  { key: 'directCash', label: 'Direct Cash', color: '#f59e0b', strokeWidth: 1.5, dashed: true }
                ]}
                height={260}
                emptyMessage="No financial transaction records in the selected comparison window"
              />
            </div>
          </div>

          {/* Comparative Inflow vs Direct Cash Matrix */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.25rem' }}>
            <div className="admin-card">
              <div className="admin-card-header">
                <div>
                  <h3 className="admin-card-title">Online Collections vs Direct Cash Off-Platform</h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Authoritative CashSplit vs FullDigital Flow</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ padding: '0.75rem', backgroundColor: '#eff6ff', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1e40af' }}>Total Online Inflow (Collected via Gateway)</span>
                    <strong style={{ color: '#1d4ed8', fontSize: '0.9rem' }}>{formatCurrency(fin.onlineCollectionsTotal || 0)}</strong>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#475569' }}>
                    100% of FullDigital jobs + 15% ElectroSL platform commission on CashSplit jobs
                  </div>
                </div>

                <div style={{ padding: '0.75rem', backgroundColor: '#f0fdf4', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#166534' }}>Direct Cash Paid to Electricians</span>
                    <strong style={{ color: '#15803d', fontSize: '0.9rem' }}>{formatCurrency(fin.directCashPaidToElectricians || 0)}</strong>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#475569' }}>
                    85% technician compensation settled directly on-site in physical cash
                  </div>
                </div>

                <div style={{ padding: '0.75rem', backgroundColor: '#faf5ff', borderRadius: '4px', border: '1px solid #e9d5ff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#6b21a8' }}>Total Disbursed Bank Payouts in Period</span>
                    <strong style={{ color: '#7e22ce', fontSize: '0.9rem' }}>{formatCurrency(fin.totalRecordedPayouts || 0)}</strong>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Prior period: {formatCurrency(fin.priorRecordedPayouts || 0)}</span>
                    <ComparisonDeltaBadge delta={fin.payoutsChangePercentage} />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Volume & Distribution */}
            <div className="admin-card">
              <div className="admin-card-header">
                <div>
                  <h3 className="admin-card-title">Payment Model Share Comparison</h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>FullDigital (100% Online) vs CashSplit (15% Gateway / 85% Cash)</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', textAlign: 'center' }}>
                <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>FullDigital Jobs</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#2563eb', margin: '0.25rem 0' }}>
                    {fin.fullDigitalCount || 0}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#0f172a', fontWeight: 600 }}>
                    {formatCurrency(fin.fullDigitalGmv || 0)}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.2rem' }}>
                    100% gateway settled
                  </div>
                </div>

                <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>CashSplit Jobs</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#10b981', margin: '0.25rem 0' }}>
                    {fin.cashSplitCount || 0}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#0f172a', fontWeight: 600 }}>
                    {formatCurrency(fin.cashSplitGmv || 0)}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.2rem' }}>
                    15% online / 85% cash
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab 2: Job Dispatch & Velocity Telemetry */}
      {activeTab === 'jobs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Velocity KPI Cards */}
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <h3 className="admin-card-title">Job Dispatch & Resolution Velocity</h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Authoritative completion, cancellation, and dispute metrics with timestamp latency
                </span>
              </div>
            </div>

            <JobVelocitySummaryWidget
              completionRate={jobs.completionRate || 0}
              cancellationRate={jobs.cancellationRate || 0}
              disputeRate={jobs.disputeRate || 0}
              avgAssignmentMinutes={jobs.avgTimeToAssignmentMinutes}
              avgCompletionHours={jobs.avgTimeToCompletionHours}
            />
          </div>

          {/* Job Trends Over Time */}
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <h3 className="admin-card-title">Job Creation vs Completion Trajectory</h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Comparing demand volume vs operational resolution
                </span>
              </div>
            </div>

            <BiMultiLineChart
              data={jobs.trends || []}
              lines={[
                { key: 'createdCount', label: 'Jobs Created', color: '#2563eb', strokeWidth: 2 },
                { key: 'completedCount', label: 'Completed', color: '#10b981', strokeWidth: 2 },
                { key: 'cancelledCount', label: 'Cancelled', color: '#ef4444', strokeWidth: 1.5, dashed: true }
              ]}
              height={230}
              emptyMessage="No job volume trends in this selected window"
            />
          </div>

          {/* Job Type Distribution Table */}
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <h3 className="admin-card-title">Job Type Distribution</h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Maintenance vs New Construction Demand</span>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Job Type</th>
                    <th style={{ textAlign: 'right' }}>Total Volume</th>
                    <th style={{ textAlign: 'right' }}>Share (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {(jobs.types || []).map((t, i) => (
                    <tr key={`jobtype-${i}`}>
                      <td style={{ fontWeight: 600 }}>{t.jobType}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{t.count}</td>
                      <td style={{ textAlign: 'right' }}>{t.percentage}%</td>
                    </tr>
                  ))}
                  {(!jobs.types || jobs.types.length === 0) && (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', color: '#64748b', padding: '1.5rem' }}>
                        No jobs recorded in selected period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. Tab 3: Technician Workforce Performance */}
      {activeTab === 'technicians' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Workforce Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            <div className="admin-card" style={{ padding: '0.85rem', borderLeft: '3px solid #10b981' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Approved Technicians</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#047857', margin: '0.2rem 0' }}>
                {techs.approvedTechnicians || 0}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Fully verified workforce</div>
            </div>

            <div className="admin-card" style={{ padding: '0.85rem', borderLeft: '3px solid #2563eb' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Active with Assigned Jobs</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1d4ed8', margin: '0.2rem 0' }}>
                {techs.activeTechniciansWithJobs || 0}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Dispatched electricians</div>
            </div>

            <div className="admin-card" style={{ padding: '0.85rem', borderLeft: '3px solid #6366f1' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Workforce Utilization</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#4338ca', margin: '0.2rem 0' }}>
                {techs.technicianUtilizationRate || 0}%
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Active vs approved pool</div>
            </div>

            <div className="admin-card" style={{ padding: '0.85rem', borderLeft: '3px solid #f59e0b' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Pending Verifications</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#b45309', margin: '0.2rem 0' }}>
                {techs.pendingApprovals || 0}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Awaiting admin review</div>
            </div>
          </div>

          {/* Real Technician Dispatch & Performance Table */}
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <h3 className="admin-card-title">Approved Technician Activity & Dispatch Ledger</h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Real platform assignment telemetry — ratings and performance scores are strictly non-fabricated
                </span>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Profile ID</th>
                    <th>Technician Name</th>
                    <th>Email</th>
                    <th>Specialization</th>
                    <th style={{ textAlign: 'right' }}>Jobs Handled</th>
                    <th style={{ textAlign: 'right' }}>Completed</th>
                    <th style={{ textAlign: 'right' }}>In Progress</th>
                    <th style={{ textAlign: 'right' }}>Completion Rate</th>
                    <th style={{ textAlign: 'right' }}>App Wallet Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {(techs.leaderboard || []).map((t) => (
                    <tr key={`tech-${t.profileId}`}>
                      <td style={{ fontWeight: 600, color: '#64748b' }}>#{t.profileId}</td>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>{t.name}</td>
                      <td style={{ fontSize: '0.75rem', color: '#475569' }}>{t.email}</td>
                      <td>
                        <span style={{ fontSize: '0.72rem', padding: '2px 6px', backgroundColor: '#f1f5f9', borderRadius: '4px' }}>
                          {t.specialization}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{t.jobsHandled}</td>
                      <td style={{ textAlign: 'right', color: '#16a34a', fontWeight: 600 }}>{t.completedJobs}</td>
                      <td style={{ textAlign: 'right', color: '#2563eb', fontWeight: 600 }}>{t.inProgressJobs}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{t.completionRate}%</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        {formatCurrency(t.appWalletBalance)}
                      </td>
                    </tr>
                  ))}
                  {(!techs.leaderboard || techs.leaderboard.length === 0) && (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', color: '#64748b', padding: '1.5rem' }}>
                        No approved technician records available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. Tab 4: Equipment & Claims Economics */}
      {activeTab === 'equipment' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Top Equipment Bar & Claims Economics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.25rem' }}>
            <div className="admin-card">
              <div className="admin-card-header">
                <div>
                  <h3 className="admin-card-title">Most Frequently Claimed Equipment Items</h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Ranked by claim frequency and expenditure</span>
                </div>
              </div>

              <TopEquipmentBarWidget items={equip.topUsedEquipment || []} maxItems={8} />
            </div>

            {/* Claims Review Economics */}
            <div className="admin-card">
              <div className="admin-card-header">
                <div>
                  <h3 className="admin-card-title">Equipment Price Claim Review Velocity</h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Claims approval vs flagged price variance</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Total Claim Spending</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{formatCurrency(equip.totalEquipmentSpending || 0)}</div>
                  </div>
                  <ComparisonDeltaBadge delta={equip.spendingChangePercentage} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                  <div style={{ padding: '0.75rem', backgroundColor: '#f0fdf4', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
                    <div style={{ fontSize: '0.68rem', color: '#166534', fontWeight: 600 }}>Approved</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#15803d' }}>{equip.claimsApprovedCount || 0}</div>
                  </div>

                  <div style={{ padding: '0.75rem', backgroundColor: '#fffbeb', borderRadius: '4px', border: '1px solid #fde68a' }}>
                    <div style={{ fontSize: '0.68rem', color: '#92400e', fontWeight: 600 }}>Flagged</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#b45309' }}>{equip.claimsFlaggedCount || 0}</div>
                  </div>

                  <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', borderRadius: '4px', border: '1px solid #fecaca' }}>
                    <div style={{ fontSize: '0.68rem', color: '#991b1b', fontWeight: 600 }}>Rejected</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#dc2626' }}>{equip.claimsRejectedCount || 0}</div>
                  </div>
                </div>

                <div style={{ padding: '0.75rem', backgroundColor: '#eff6ff', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: '#1e40af' }}>
                    <span>Claim Approval Rate:</span>
                    <span>{equip.claimApprovalRate || 0}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Benchmark Price Changes Audit Table */}
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <h3 className="admin-card-title">Recent Equipment Benchmark Price Adjustments</h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Authoritative price modification audit trail</span>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Effective Date</th>
                    <th>Item Name</th>
                    <th style={{ textAlign: 'right' }}>Old Price</th>
                    <th style={{ textAlign: 'right' }}>New Benchmark</th>
                    <th style={{ textAlign: 'right' }}>% Change</th>
                    <th>Reason / Notes</th>
                    <th>Modified By</th>
                  </tr>
                </thead>
                <tbody>
                  {(equip.recentPriceChanges || []).map((c) => (
                    <tr key={`price-change-${c.id}`}>
                      <td style={{ fontSize: '0.75rem', color: '#64748b' }}>{formatDateTime(c.effectiveDateUtc)}</td>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>{c.itemName}</td>
                      <td style={{ textAlign: 'right', color: '#64748b' }}>{formatCurrency(c.oldPrice)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#2563eb' }}>{formatCurrency(c.newPrice)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 700, color: c.changePercentage > 0 ? '#16a34a' : '#dc2626' }}>
                          {c.changePercentage > 0 ? '+' : ''}{c.changePercentage.toFixed(1)}%
                        </span>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: '#475569' }}>{c.reason || 'Benchmark adjustment'}</td>
                      <td style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.changedByAdminName}</td>
                    </tr>
                  ))}
                  {(!equip.recentPriceChanges || equip.recentPriceChanges.length === 0) && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: '#64748b', padding: '1.5rem' }}>
                        No price change audit entries recorded in this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 8. Tab 5: Platform Growth & Demand Velocity */}
      {activeTab === 'growth' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Growth Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
            <BiStatCard
              title="Customer Registrations"
              value={growth.newCustomersInPeriod || 0}
              priorValue={growth.priorNewCustomers || 0}
              delta={growth.customerGrowthRate}
              note="New platform clients"
              accentColor="#06b6d4"
            />

            <BiStatCard
              title="Technician Applications"
              value={growth.newTechniciansInPeriod || 0}
              priorValue={growth.priorNewTechnicians || 0}
              delta={growth.technicianGrowthRate}
              note="Electrician intake"
              accentColor="#10b981"
            />

            <div className="admin-card" style={{ padding: '1rem', borderTop: '3px solid #2563eb', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                  Platform Account Lifecycle
                </span>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#16a34a' }}>{growth.activeAccounts || 0}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Active Accounts</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#dc2626' }}>{growth.inactiveOrSuspendedAccounts || 0}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Suspended / Inactive</div>
                  </div>
                </div>
              </div>
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.4rem', marginTop: '0.4rem', fontSize: '0.72rem', color: '#64748b' }}>
                Total registered userbase: <strong>{growth.totalUsers || 0}</strong>
              </div>
            </div>
          </div>

          {/* Growth Curve: Customers vs Technicians vs Jobs */}
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <h3 className="admin-card-title">User Acquisition vs Service Demand Inflow</h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Comparing onboarding volume against marketplace job creation</span>
              </div>
            </div>

            <BiMultiLineChart
              data={growth.trends || []}
              lines={[
                { key: 'newCustomers', label: 'New Customers', color: '#06b6d4', strokeWidth: 2 },
                { key: 'newTechnicians', label: 'New Technicians', color: '#10b981', strokeWidth: 2 },
                { key: 'newJobs', label: 'New Jobs Created', color: '#2563eb', strokeWidth: 2.5 }
              ]}
              height={240}
              emptyMessage="No onboarding or job creation records in this window"
            />
          </div>
        </div>
      )}
    </div>
  );
}

