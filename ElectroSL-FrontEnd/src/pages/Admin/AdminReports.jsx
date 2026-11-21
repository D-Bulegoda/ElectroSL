import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { formatCurrency, formatDateTime } from '../../utils/formattingHelpers';
import {
  FileTextIcon,
  DownloadIcon,
  PrinterIcon,
  RefreshCwIcon,
  CalendarIcon,
  CreditCardIcon,
  BriefcaseIcon,
  UsersCheckIcon,
  TagIcon,
  HistoryIcon,
  FilterIcon,
  TrendingUpIcon,
  DollarSignIcon,
  CheckIcon,
  AlertTriangleIcon
} from '../../components/admin/AdminIcons';

const DATE_RANGE_OPTIONS = [
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: '90d', label: 'Last 90 Days' },
  { id: 'this_year', label: 'This Year' },
  { id: 'all', label: 'All Time' },
  { id: 'custom', label: 'Custom Range' }
];

export default function AdminReports() {
  const [activeTab, setActiveTab] = useState('financial');
  const [dateRange, setDateRange] = useState('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Data states
  const [analytics, setAnalytics] = useState(null);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [jobSummary, setJobSummary] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [users, setUsers] = useState([]);
  const [catalogItems, setCatalogItems] = useState([]);
  const [claims, setClaims] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [exporting, setExporting] = useState(false);

  const loadReportData = async (range = dateRange, cFrom = customFrom, cTo = customTo) => {
    try {
      setRefreshing(true);
      setError(null);

      // Fetch consolidated analytics and supporting data in parallel
      const [
        analyticsData,
        finSummaryData,
        txData,
        jobSummaryData,
        jobsData,
        appsData,
        usersData,
        catalogData,
        claimsData,
        auditData
      ] = await Promise.all([
        adminService.getDashboardAnalytics(range, cFrom, cTo).catch(() => null),
        adminService.getFinancialSummary().catch(() => null),
        adminService.getFinancialTransactions({ pageSize: 100 }).catch(() => ({ items: [] })),
        adminService.getJobOperationalSummary().catch(() => null),
        adminService.getJobs({ pageSize: 100 }).catch(() => ({ items: [] })),
        adminService.getApplications('all').catch(() => []),
        adminService.getUsers().catch(() => []),
        adminService.getCatalogItems().catch(() => []),
        adminService.getEquipmentClaims().catch(() => []),
        adminService.getAdminAuditLogs({ 
          pageSize: 100,
          startDateUtc: range === 'custom' ? cFrom : '',
          endDateUtc: range === 'custom' ? cTo : ''
        }).catch(() => ({ items: [] }))
      ]);

      setAnalytics(analyticsData);
      setFinancialSummary(finSummaryData);
      setTransactions(txData?.items || []);
      setJobSummary(jobSummaryData);
      setJobs(jobsData?.items || []);
      setApplications(appsData || []);
      setUsers(usersData || []);
      setCatalogItems(catalogData || []);
      setClaims(claimsData || []);
      setAuditLogs(auditData?.items || []);
    } catch (err) {
      console.error('Failed to load reporting data:', err);
      setError('Unable to load authoritative report datasets.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReportData(dateRange);
  }, [dateRange]);

  const handleRangeChange = (rangeId) => {
    setDateRange(rangeId);
  };

  const handleApplyCustomRange = (e) => {
    e.preventDefault();
    if (!customFrom || !customTo) return;
    if (new Date(customFrom) > new Date(customTo)) {
      setError("Invalid custom range: 'From' date cannot be later than 'To' date.");
      return;
    }
    setError(null);
    loadReportData('custom', customFrom, customTo);
  };

  // Authoritative Backend Export (Excel .xlsx, PDF .pdf, CSV .csv)
  const handleExport = async (format) => {
    try {
      setExporting(true);
      setError(null);

      const tabMap = {
        financial: 'financial',
        jobs: 'jobs',
        technicians: 'technicians',
        equipment: 'equipment',
        activity: 'audits'
      };
      const reportType = tabMap[activeTab] || 'financial';
      const range = dateRange === 'custom' ? 'custom' : dateRange;

      if (dateRange === 'custom' && customFrom && customTo && new Date(customFrom) > new Date(customTo)) {
        setError("Invalid custom range: 'From' date cannot be later than 'To' date.");
        setExporting(false);
        return;
      }

      const resBlob = await adminService.exportReportBlob(reportType, range, format, customFrom, customTo);

      const ext = format === 'xlsx' ? 'xlsx' : format === 'pdf' ? 'pdf' : 'csv';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `ElectroSL_${reportType.toUpperCase()}_Report_${timestamp}.${ext}`;

      const mimeType = format === 'xlsx'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : format === 'pdf'
          ? 'application/pdf'
          : 'text/csv;charset=utf-8;';

      const blob = new Blob([resBlob], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`Export failed for format ${format}:`, err);
      setError(`Failed to export report in ${format.toUpperCase()} format.`);
    } finally {
      setExporting(false);
    }
  };

  // Helper to format CSV values
  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  // Trigger Excel (.csv) Export
  const handleExportCsv = () => {
    let csvContent = '\uFEFF'; // UTF-8 BOM for Microsoft Excel native compatibility
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    let filename = `ElectroSL_${activeTab.toUpperCase()}_Report_${timestamp}.csv`;

    const rangeLabel = DATE_RANGE_OPTIONS.find((r) => r.id === dateRange)?.label || dateRange;
    const headerMetadata = [
      `"ElectroSL Enterprise Reporting System"`,
      `"Report Type:","${activeTab.toUpperCase()} SUMMARY REPORT"`,
      `"Date Range:","${rangeLabel}"`,
      `"Generated At:","${new Date().toUTCString()}"`,
      `""`
    ].join('\r\n');

    if (activeTab === 'financial') {
      const gmv = analytics?.totalGmv || financialSummary?.totalGrossJobValue || 0;
      const commission = analytics?.platformCommission || financialSummary?.totalPlatformCommission || 0;
      const digital = analytics?.fullDigitalOnlineCollections || financialSummary?.totalCollectedOnline || 0;
      const cashSplit = analytics?.cashSplitOnlineCollections || 0;
      const directCash = analytics?.directCashPaidToElectricians || financialSummary?.totalDirectCashToElectricians || 0;
      const earnings = analytics?.electricianEarnings || financialSummary?.totalElectricianEarnings || 0;
      const liability = analytics?.outstandingWalletLiability || financialSummary?.outstandingWalletLiability || 0;
      const payouts = analytics?.totalRecordedPayouts || financialSummary?.totalRecordedPayouts || 0;

      const summaryBlock = [
        `"EXECUTIVE FINANCIAL SUMMARY"`,
        `"Metric","Amount (LKR)","Description"`,
        `"Total Gross Merchandise Value (GMV)",${gmv},"Total agreed job value including approved materials"`,
        `"Platform Commission Revenue (15%)",${commission},"ElectroSL authoritative 15% fee"`,
        `"FullDigital Online Collections",${digital},"100% online gateway collections"`,
        `"CashSplit Online Collections",${cashSplit},"15% platform fee collected online for split jobs"`,
        `"Direct Cash to Electricians",${directCash},"85% cash settled directly on site"`,
        `"Total Electrician Earnings",${earnings},"85% technician net compensation"`,
        `"Current Wallet Liability",${liability},"Sum of active technician virtual balances"`,
        `"Total Recorded Payouts",${payouts},"Disbursed out-of-band bank transfers"`,
        `""`,
        `"FINANCIAL TRANSACTION LEDGER"`
      ].join('\r\n');

      const headers = ['Transaction ID', 'Electrician', 'Email', 'Type', 'Amount (LKR)', 'Balance Before', 'Balance After', 'Date (UTC)', 'Description'];
      const rows = transactions.map((t) => [
        escapeCsv(t.transactionId),
        escapeCsv(t.electricianName),
        escapeCsv(t.electricianEmail),
        escapeCsv(t.transactionTypeName),
        t.amount,
        t.balanceBefore,
        t.balanceAfter,
        escapeCsv(t.createdAtUtc),
        escapeCsv(t.description)
      ].join(','));

      csvContent += `${headerMetadata}\r\n${summaryBlock}\r\n${headers.map(escapeCsv).join(',')}\r\n${rows.join('\r\n')}`;
    } else if (activeTab === 'jobs') {
      const summaryBlock = [
        `"JOB OPERATIONS SUMMARY"`,
        `"Total Jobs",${jobSummary?.totalJobs || jobs.length}`,
        `"In Progress",${jobSummary?.inProgressJobs || 0}`,
        `"Completed",${jobSummary?.completedJobs || 0}`,
        `"Cancelled",${jobSummary?.cancelledJobs || 0}`,
        `"Disputed",${jobSummary?.disputedJobs || 0}`,
        `"Emergency Jobs",${jobSummary?.emergencyJobs || 0}`,
        `"Unassigned Jobs",${jobSummary?.unassignedJobs || 0}`,
        `""`,
        `"DETAILED JOB DISPATCH REGISTER"`
      ].join('\r\n');

      const headers = ['Job ID', 'Job Type', 'Description', 'Client', 'Assigned Electrician', 'Status', 'Emergency', 'Created Date (UTC)'];
      const rows = jobs.map((j) => [
        escapeCsv(j.jobId),
        escapeCsv(j.jobType),
        escapeCsv(j.description),
        escapeCsv(j.customerName || j.customer?.name || 'Customer'),
        escapeCsv(j.electricianName || j.electrician?.name || 'Unassigned'),
        escapeCsv(j.status),
        escapeCsv(j.isEmergency ? 'YES' : 'NO'),
        escapeCsv(j.createdAt)
      ].join(','));

      csvContent += `${headerMetadata}\r\n${summaryBlock}\r\n${headers.map(escapeCsv).join(',')}\r\n${rows.join('\r\n')}`;
    } else if (activeTab === 'technicians') {
      const summaryBlock = [
        `"TECHNICIAN ACCREDITATION SUMMARY"`,
        `"Total Registered Technicians",${analytics?.technicianStats?.total || applications.length}`,
        `"Approved & Licensed",${analytics?.technicianStats?.approved || 0}`,
        `"Pending Review",${analytics?.technicianStats?.pending || 0}`,
        `"Rejected",${analytics?.technicianStats?.rejected || 0}`,
        `"Suspended / Inactive",${analytics?.technicianStats?.suspendedOrInactive || 0}`,
        `""`,
        `"TECHNICIAN DIRECTORY & ACCREDITATION REGISTER"`
      ].join('\r\n');

      const headers = ['Profile ID', 'Technician Name', 'Email', 'Specialization', 'Accreditation Status', 'Simulator Status', 'Wallet Balance (LKR)'];
      const rows = applications.map((a) => [
        escapeCsv(a.profileId),
        escapeCsv(a.name),
        escapeCsv(a.email),
        escapeCsv(a.specialization || 'General Electrician'),
        escapeCsv(a.verificationStatus),
        escapeCsv(a.simulatorPassed ? 'Passed' : 'Incomplete / Pending'),
        a.walletBalance || 0.00
      ].join(','));

      csvContent += `${headerMetadata}\r\n${summaryBlock}\r\n${headers.map(escapeCsv).join(',')}\r\n${rows.join('\r\n')}`;
    } else if (activeTab === 'equipment') {
      const summaryBlock = [
        `"EQUIPMENT CATALOG & BENCHMARK SUMMARY"`,
        `"Catalog Items",${catalogItems.length}`,
        `"Flagged Price Claims",${claims.length}`,
        `""`,
        `"EQUIPMENT CATALOG BENCHMARKS"`
      ].join('\r\n');

      const catHeaders = ['Item ID', 'Item Name', 'Category', 'Brand', 'Specification', 'Market Price (LKR)', 'Variance Threshold (%)', 'Active'];
      const catRows = catalogItems.map((c) => [
        escapeCsv(c.itemId),
        escapeCsv(c.itemName),
        escapeCsv(c.category),
        escapeCsv(c.brandName),
        escapeCsv(c.specification),
        c.standardMarketPrice,
        c.priceVarianceThreshold,
        escapeCsv(c.isActive ? 'Active' : 'Inactive')
      ].join(','));

      const claimHeaders = ['Claim ID', 'Job ID', 'Item Name', 'Claimed Price (LKR)', 'Benchmark Price (LKR)', 'Status', 'Reviewer Notes'];
      const claimRows = claims.map((cl) => [
        escapeCsv(cl.claimId),
        escapeCsv(cl.jobId),
        escapeCsv(cl.itemName),
        cl.claimedPrice,
        cl.standardMarketPrice,
        escapeCsv(cl.status),
        escapeCsv(cl.reviewerNotes || 'N/A')
      ].join(','));

      csvContent += `${headerMetadata}\r\n${summaryBlock}\r\n${catHeaders.map(escapeCsv).join(',')}\r\n${catRows.join('\r\n')}\r\n\r\n"FLAGGED EQUIPMENT PRICE CLAIMS"\r\n${claimHeaders.map(escapeCsv).join(',')}\r\n${claimRows.join('\r\n')}`;
    } else if (activeTab === 'activity') {
      const summaryBlock = [
        `"ADMINISTRATIVE AUDIT TRAIL SUMMARY"`,
        `"Total Logged Events",${auditLogs.length}`,
        `""`,
        `"AUDIT LOG EVENTS"`
      ].join('\r\n');

      const headers = ['Audit ID', 'Action Type', 'Entity Type', 'Entity ID', 'Admin Email', 'Description', 'Reason / Notes', 'IP Address', 'Timestamp (UTC)'];
      const rows = auditLogs.map((l) => [
        escapeCsv(l.auditLogId),
        escapeCsv(l.actionType),
        escapeCsv(l.entityType),
        escapeCsv(l.entityId),
        escapeCsv(l.adminEmail || 'System'),
        escapeCsv(l.description),
        escapeCsv(l.reason || 'None provided'),
        escapeCsv(l.ipAddress || 'Internal'),
        escapeCsv(l.createdAtUtc)
      ].join(','));

      csvContent += `${headerMetadata}\r\n${summaryBlock}\r\n${headers.map(escapeCsv).join(',')}\r\n${rows.join('\r\n')}`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger Print / Save as PDF
  const handlePrintPdf = () => {
    window.print();
  };

  const getActiveTabTitle = () => {
    switch (activeTab) {
      case 'financial': return 'Financial Summary & Reconciliation Report';
      case 'jobs': return 'Job Operations & Dispatch Telemetry Report';
      case 'technicians': return 'Technician Accreditation & Activity Report';
      case 'equipment': return 'Equipment Benchmarks & Claims Report';
      case 'activity': return 'Administrative Audit & Compliance Report';
      default: return 'Enterprise Operations Report';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1360px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Printable Official Header (Only rendered when printing to PDF) */}
      <div className="print-only" style={{ borderBottom: '2px solid #0f172a', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
              ElectroSL Operations & Analytics
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#475569', margin: 0 }}>
              Official Administrative & Compliance Dossier
            </p>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#64748b' }}>
            <div><strong>Report:</strong> {getActiveTabTitle()}</div>
            <div><strong>Window:</strong> {DATE_RANGE_OPTIONS.find((r) => r.id === dateRange)?.label}</div>
            <div><strong>Generated:</strong> {new Date().toUTCString()}</div>
          </div>
        </div>
      </div>

      {/* 1. Page Header (On Screen) */}
      <div className="admin-page-header no-print" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <FileTextIcon size={20} color="#2563eb" />
            <h1 className="admin-page-title" style={{ margin: 0, fontSize: '1.35rem' }}>
              Administrative Reports & Data Export
            </h1>
          </div>
          <p className="admin-page-subtitle" style={{ margin: 0 }}>
            Generate, filter, and export authoritative financial reconciliation, operations dispatch, technician compliance, and audit records.
          </p>
        </div>

        {/* Global Export Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => handleExport('xlsx')}
            disabled={loading || exporting}
            className="admin-btn admin-btn-secondary"
            title="Download genuine Microsoft Excel (.xlsx) workbook"
            style={{ fontWeight: 600, color: '#16a34a' }}
          >
            <DownloadIcon size={14} color="#16a34a" />
            <span>{exporting ? 'Exporting...' : 'Export Excel (.xlsx)'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleExport('pdf')}
            disabled={loading || exporting}
            className="admin-btn admin-btn-primary"
            title="Download formatted official PDF report document"
            style={{ fontWeight: 600 }}
          >
            <DownloadIcon size={14} color="#ffffff" />
            <span>{exporting ? 'Exporting...' : 'Export PDF (.pdf)'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleExport('csv')}
            disabled={loading || exporting}
            className="admin-btn admin-btn-secondary"
            title="Download UTF-8 BOM CSV data"
            style={{ fontSize: '0.8rem' }}
          >
            <DownloadIcon size={14} color="#64748b" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrintPdf}
            disabled={loading}
            className="admin-btn admin-btn-secondary"
            title="Open browser print dialog"
            style={{ fontSize: '0.8rem' }}
          >
            <PrinterIcon size={14} color="#475569" />
            <span>Print</span>
          </button>

          <button
            type="button"
            onClick={() => loadReportData(dateRange)}
            disabled={refreshing}
            className="admin-btn admin-btn-secondary"
          >
            <RefreshCwIcon size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            <span>{refreshing ? 'Updating...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* 2. Report Tabs & Date Filters Bar */}
      <div className="admin-card no-print" style={{ padding: '0.85rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '2px' }}>
            {[
              { id: 'financial', label: 'Financial Summary', icon: <CreditCardIcon size={14} /> },
              { id: 'jobs', label: 'Job Operations', icon: <BriefcaseIcon size={14} /> },
              { id: 'technicians', label: 'Technician Roster', icon: <UsersCheckIcon size={14} /> },
              { id: 'equipment', label: 'Equipment & Claims', icon: <TagIcon size={14} /> },
              { id: 'activity', label: 'Admin Audit Log', icon: <HistoryIcon size={14} /> }
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

          {/* Date Range Selector Pills */}
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
            </div>
          </div>
        </div>

        {/* Custom Range Inputs (Shown when custom is selected) */}
        {dateRange === 'custom' && (
          <form
            onSubmit={handleApplyCustomRange}
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
              Apply Custom Range
            </button>
          </form>
        )}
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', color: '#991b1b', fontSize: '0.8125rem' }}>
          {error}
        </div>
      )}

      {/* 3. REPORT TAB CONTENTS */}

      {/* --- TAB 1: FINANCIAL SUMMARY REPORT --- */}
      {activeTab === 'financial' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Executive KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
            <div className="admin-card" style={{ padding: '1rem', borderTop: '3px solid #2563eb' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total Gross Job Value (GMV)</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', margin: '0.35rem 0' }}>
                {formatCurrency(analytics?.totalGmv || financialSummary?.totalGrossJobValue || 0)}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Authoritative Labour + Approved Equipment</div>
            </div>

            <div className="admin-card" style={{ padding: '1rem', borderTop: '3px solid #10b981' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Platform Commission Revenue (15%)</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#065f46', margin: '0.35rem 0' }}>
                {formatCurrency(analytics?.platformCommission || financialSummary?.totalPlatformCommission || 0)}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#047857' }}>Net retained platform earnings</div>
            </div>

            <div className="admin-card" style={{ padding: '1rem', borderTop: '3px solid #3b82f6' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>FullDigital Online Collections</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#1e40af', margin: '0.35rem 0' }}>
                {formatCurrency(analytics?.fullDigitalOnlineCollections || financialSummary?.totalCollectedOnline || 0)}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>100% online inflow through gateway</div>
            </div>

            <div className="admin-card" style={{ padding: '1rem', borderTop: '3px solid #f59e0b' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>CashSplit Online Collections (15%)</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#92400e', margin: '0.35rem 0' }}>
                {formatCurrency(analytics?.cashSplitOnlineCollections || 0)}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Customer online commission fee</div>
            </div>

            <div className="admin-card" style={{ padding: '1rem', borderTop: '3px solid #84cc16' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Direct Cash Paid to Electricians</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#3f6212', margin: '0.35rem 0' }}>
                {formatCurrency(analytics?.directCashPaidToElectricians || financialSummary?.totalDirectCashToElectricians || 0)}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>85% on-site customer cash</div>
            </div>

            <div className="admin-card" style={{ padding: '1rem', borderTop: '3px solid #8b5cf6' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total Electrician Earnings (85%)</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#5b21b6', margin: '0.35rem 0' }}>
                {formatCurrency(analytics?.electricianEarnings || financialSummary?.totalElectricianEarnings || 0)}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Wallet credits + Direct on-site cash</div>
            </div>

            <div className="admin-card" style={{ padding: '1rem', borderTop: '3px solid #ef4444' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Current Wallet Liability</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#991b1b', margin: '0.35rem 0' }}>
                {formatCurrency(analytics?.outstandingWalletLiability || financialSummary?.outstandingWalletLiability || 0)}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Active virtual wallet sum</div>
            </div>

            <div className="admin-card" style={{ padding: '1rem', borderTop: '3px solid #06b6d4' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total Recorded Payouts</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0e7490', margin: '0.35rem 0' }}>
                {formatCurrency(analytics?.totalRecordedPayouts || financialSummary?.totalRecordedPayouts || 0)}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Disbursed bank transfers</div>
            </div>
          </div>

          {/* Periodic Revenue Table */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">Periodic Revenue Telemetry & Breakdown</h2>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Period: {DATE_RANGE_OPTIONS.find((r) => r.id === dateRange)?.label}
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th style={{ textAlign: 'right' }}>Total GMV</th>
                    <th style={{ textAlign: 'right' }}>15% Platform Commission</th>
                    <th style={{ textAlign: 'right' }}>85% Electrician Share</th>
                    <th style={{ textAlign: 'center' }}>Transactions</th>
                  </tr>
                </thead>
                <tbody>
                  {!analytics?.financialTrends || analytics.financialTrends.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                        No transactions recorded in the selected period.
                      </td>
                    </tr>
                  ) : (
                    analytics.financialTrends.map((pt, idx) => (
                      <tr key={`ft-${idx}`}>
                        <td style={{ fontWeight: 600, color: '#0f172a' }}>{pt.period}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(pt.gmv)}</td>
                        <td style={{ textAlign: 'right', color: '#065f46', fontWeight: 600 }}>{formatCurrency(pt.commission)}</td>
                        <td style={{ textAlign: 'right', color: '#5b21b6' }}>{formatCurrency(pt.electricianEarnings)}</td>
                        <td style={{ textAlign: 'center' }}>{pt.transactionCount}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: JOB OPERATIONS REPORT --- */}
      {activeTab === 'jobs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Operations Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
            <div className="admin-card" style={{ padding: '0.85rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total Jobs</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a' }}>{jobSummary?.totalJobs || jobs.length}</div>
            </div>
            <div className="admin-card" style={{ padding: '0.85rem', borderLeft: '4px solid #8b5cf6' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>In Progress</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#6d28d9' }}>{jobSummary?.inProgressJobs || 0}</div>
            </div>
            <div className="admin-card" style={{ padding: '0.85rem', borderLeft: '4px solid #22c55e' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Completed</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#15803d' }}>{jobSummary?.completedJobs || 0}</div>
            </div>
            <div className="admin-card" style={{ padding: '0.85rem', borderLeft: '4px solid #ef4444' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Disputed</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#b91c1c' }}>{jobSummary?.disputedJobs || 0}</div>
            </div>
            <div className="admin-card" style={{ padding: '0.85rem', borderLeft: '4px solid #f97316' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Emergency Dispatches</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#c2410c' }}>{jobSummary?.emergencyJobs || 0}</div>
            </div>
          </div>

          {/* Job Dispatch Table */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">Job Dispatch & Execution Register</h2>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Total entries: {jobs.length}</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Job ID</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Client</th>
                    <th>Electrician</th>
                    <th>Status</th>
                    <th>Created (UTC)</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                        No job dispatch records found.
                      </td>
                    </tr>
                  ) : (
                    jobs.map((j) => (
                      <tr key={`job-rep-${j.jobId}`}>
                        <td style={{ fontWeight: 600 }}>#{j.jobId}</td>
                        <td>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{j.jobType}</span>
                          {j.isEmergency && (
                            <span style={{ marginLeft: '0.35rem', fontSize: '0.65rem', backgroundColor: '#fee2e2', color: '#991b1b', padding: '0.1rem 0.35rem', borderRadius: '3px', fontWeight: 700 }}>
                              EMERGENCY
                            </span>
                          )}
                        </td>
                        <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.75rem', color: '#64748b' }}>
                          {j.description}
                        </td>
                        <td style={{ fontSize: '0.8rem' }}>{j.customerName || j.customer?.name || 'Customer'}</td>
                        <td style={{ fontSize: '0.8rem' }}>{j.electricianName || j.electrician?.name || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Unassigned</span>}</td>
                        <td>
                          <span style={{ fontSize: '0.6875rem', fontWeight: 600, padding: '0.15rem 0.45rem', borderRadius: '4px', backgroundColor: '#ede9fe', color: '#6d28d9' }}>
                            {j.status}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                          {formatDateTime(j.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: TECHNICIAN REPORT --- */}
      {activeTab === 'technicians' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
            <div className="admin-card" style={{ padding: '0.85rem', borderLeft: '4px solid #16a34a' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Licensed & Approved</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#15803d' }}>{analytics?.technicianStats?.approved || 0}</div>
            </div>
            <div className="admin-card" style={{ padding: '0.85rem', borderLeft: '4px solid #d97706' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Pending Verification</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#b45309' }}>{analytics?.technicianStats?.pending || 0}</div>
            </div>
            <div className="admin-card" style={{ padding: '0.85rem', borderLeft: '4px solid #dc2626' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Rejected Applications</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#b91c1c' }}>{analytics?.technicianStats?.rejected || 0}</div>
            </div>
            <div className="admin-card" style={{ padding: '0.85rem', borderLeft: '4px solid #64748b' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total Electricians</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a' }}>{analytics?.technicianStats?.total || applications.length}</div>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">Technician Accreditation & Licensing Dossiers</h2>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Records: {applications.length}</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Profile ID</th>
                    <th>Technician</th>
                    <th>Specialization</th>
                    <th>Simulator Test</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Wallet Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                        No technician profiles available.
                      </td>
                    </tr>
                  ) : (
                    applications.map((app) => (
                      <tr key={`app-rep-${app.profileId}`}>
                        <td style={{ fontWeight: 600 }}>#{app.profileId}</td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{app.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{app.email}</div>
                        </td>
                        <td>{app.specialization || 'General Electrician'}</td>
                        <td>
                          {app.simulatorPassed ? (
                            <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.75rem' }}>✓ Passed</span>
                          ) : (
                            <span style={{ color: '#d97706', fontWeight: 600, fontSize: '0.75rem' }}>⏳ Incomplete</span>
                          )}
                        </td>
                        <td>
                          <span style={{
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            backgroundColor: app.verificationStatus === 'Approved' ? '#dcfce7' : '#fffbeb',
                            color: app.verificationStatus === 'Approved' ? '#15803d' : '#b45309'
                          }}>
                            {app.verificationStatus}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          {formatCurrency(app.walletBalance || 0)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 4: EQUIPMENT REPORT --- */}
      {activeTab === 'equipment' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Catalog Benchmarks */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">Standard Equipment Price Benchmarks</h2>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Items: {catalogItems.length}</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Item ID</th>
                    <th>Item Name</th>
                    <th>Category</th>
                    <th>Brand & Model</th>
                    <th style={{ textAlign: 'right' }}>Standard Price</th>
                    <th style={{ textAlign: 'right' }}>Threshold</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {catalogItems.map((c) => (
                    <tr key={`cat-rep-${c.itemId}`}>
                      <td style={{ fontWeight: 600 }}>#{c.itemId}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{c.itemName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.specification}</div>
                      </td>
                      <td>{c.category}</td>
                      <td>{c.brandName}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(c.standardMarketPrice)}</td>
                      <td style={{ textAlign: 'right', color: '#64748b' }}>±{c.priceVarianceThreshold}%</td>
                      <td>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 600, padding: '0.1rem 0.4rem', borderRadius: '3px', backgroundColor: c.isActive ? '#dcfce7' : '#f1f5f9', color: c.isActive ? '#15803d' : '#64748b' }}>
                          {c.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Flagged Claims */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">Flagged Equipment Price Claims</h2>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Total claims: {claims.length}</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Claim ID</th>
                    <th>Job ID</th>
                    <th>Material</th>
                    <th style={{ textAlign: 'right' }}>Claimed Price</th>
                    <th style={{ textAlign: 'right' }}>Benchmark</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
                        No flagged price claims recorded.
                      </td>
                    </tr>
                  ) : (
                    claims.map((cl) => (
                      <tr key={`claim-rep-${cl.claimId}`}>
                        <td style={{ fontWeight: 600 }}>#{cl.claimId}</td>
                        <td>#{cl.jobId}</td>
                        <td style={{ fontWeight: 500 }}>{cl.itemName}</td>
                        <td style={{ textAlign: 'right', color: '#991b1b', fontWeight: 600 }}>{formatCurrency(cl.claimedPrice)}</td>
                        <td style={{ textAlign: 'right', color: '#475569' }}>{formatCurrency(cl.standardMarketPrice)}</td>
                        <td>
                          <span style={{ fontSize: '0.6875rem', fontWeight: 600, padding: '0.1rem 0.4rem', borderRadius: '3px', backgroundColor: '#fef2f2', color: '#991b1b' }}>
                            {cl.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 5: ADMIN ACTIVITY REPORT --- */}
      {activeTab === 'activity' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">Administrative Audit & Compliance Trail</h2>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Immutable events: {auditLogs.length}</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Audit ID</th>
                    <th>Action</th>
                    <th>Target Entity</th>
                    <th>Administrator</th>
                    <th>Description</th>
                    <th>Reason / Notes</th>
                    <th>Timestamp (UTC)</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                        No administrative audit logs recorded.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={`aud-rep-${log.auditLogId}`}>
                        <td style={{ fontWeight: 600 }}>#{log.auditLogId}</td>
                        <td>
                          <span style={{ fontSize: '0.6875rem', fontWeight: 600, padding: '0.15rem 0.45rem', borderRadius: '4px', backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
                            {log.actionType}
                          </span>
                        </td>
                        <td><strong>{log.entityType}</strong> #{log.entityId}</td>
                        <td style={{ fontSize: '0.75rem' }}>{log.adminEmail || 'System'}</td>
                        <td style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.75rem', color: '#475569' }}>
                          {log.description}
                        </td>
                        <td style={{ fontSize: '0.75rem', color: '#64748b' }}>{log.reason || '—'}</td>
                        <td style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                          {formatDateTime(log.createdAtUtc)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

