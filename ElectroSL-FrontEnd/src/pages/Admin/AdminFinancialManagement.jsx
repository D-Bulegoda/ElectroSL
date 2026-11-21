import React, { useState, useEffect, useCallback } from 'react';
import adminService from '../../services/adminService';
import { formatCurrency, formatDateTime } from '../../utils/formattingHelpers';
import {
  CreditCardIcon,
  WalletIcon,
  TrendingUpIcon,
  ArrowUpRightIcon,
  ArrowDownLeftIcon,
  DollarSignIcon,
  SearchIcon,
  RefreshCwIcon,
  CheckIcon,
  XIcon,
  AlertTriangleIcon,
  EyeIcon,
  FilterIcon,
  BriefcaseIcon
} from '../../components/admin/AdminIcons';
import StatsCard from '../../components/admin/StatsCard';
import './admin.css';

const MASKED_ACCOUNT_REGEX = /^[\*X]{3,}[0-9]{3,}$|^[0-9]{3,4}$|^\*{2,}[0-9]{3,4}$/;

const AdminFinancialManagement = () => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'ledger' | 'technicians' | 'payouts' | 'adjustments'

  // Global Financial Summary
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

  // Global Approved Technicians Directory (for dropdowns)
  const [technicians, setTechnicians] = useState([]);
  const [techLoading, setTechLoading] = useState(false);

  // Transaction Ledger State
  const [ledgerItems, setLedgerItems] = useState([]);
  const [ledgerPagination, setLedgerPagination] = useState({
    page: 1,
    pageSize: 15,
    totalCount: 0,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false
  });
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerFilters, setLedgerFilters] = useState({
    searchQuery: '',
    transactionType: '',
    electricianProfileId: '',
    startDateUtc: '',
    endDateUtc: ''
  });

  // Technician Wallet State
  const [selectedTechId, setSelectedTechId] = useState('');
  const [techWallet, setTechWallet] = useState(null);
  const [techWalletLoading, setTechWalletLoading] = useState(false);
  const [techWalletError, setTechWalletError] = useState(null);

  // Record Payout Form State
  const [payoutForm, setPayoutForm] = useState({
    electricianProfileId: '',
    amount: '',
    bankName: '',
    accountNumberMasked: '',
    bankTransferReference: '',
    adminNotes: '',
    confirmBankTransferCompleted: false
  });
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState(null);
  const [payoutError, setPayoutError] = useState(null);

  // Reversal Modal State
  const [reversalModalOpen, setReversalModalOpen] = useState(false);
  const [payoutToReverse, setPayoutToReverse] = useState(null);
  const [reversalForm, setReversalForm] = useState({
    reversalReason: '',
    bankNoticeReference: ''
  });
  const [reversalSubmitting, setReversalSubmitting] = useState(false);
  const [reversalError, setReversalError] = useState(null);

  // Adjustment Form State
  const [adjustmentForm, setAdjustmentForm] = useState({
    electricianProfileId: '',
    type: 'Credit',
    amount: '',
    reason: '',
    externalReferenceNumber: ''
  });
  const [adjustmentSubmitting, setAdjustmentSubmitting] = useState(false);
  const [adjustmentSuccess, setAdjustmentSuccess] = useState(null);
  const [adjustmentError, setAdjustmentError] = useState(null);
  const [adjustmentConfirmOpen, setAdjustmentConfirmOpen] = useState(false);

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------

  const fetchSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);
      setSummaryError(null);
      const data = await adminService.getFinancialSummary();
      setSummary(data);
    } catch (err) {
      console.error('Failed to load financial summary:', err);
      setSummaryError(err.message || 'Failed to load financial summary.');
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const fetchTechnicians = useCallback(async () => {
    try {
      setTechLoading(true);
      const list = await adminService.getApplications('Approved');
      setTechnicians(list || []);
    } catch (err) {
      console.error('Failed to load approved technicians:', err);
    } finally {
      setTechLoading(false);
    }
  }, []);

  const fetchLedger = useCallback(async (page = 1) => {
    try {
      setLedgerLoading(true);
      const res = await adminService.getFinancialTransactions({
        page,
        pageSize: ledgerPagination.pageSize,
        electricianProfileId: ledgerFilters.electricianProfileId || null,
        transactionType: ledgerFilters.transactionType || '',
        startDateUtc: ledgerFilters.startDateUtc || '',
        endDateUtc: ledgerFilters.endDateUtc || '',
        searchQuery: ledgerFilters.searchQuery || ''
      });

      if (res) {
        setLedgerItems(res.items || []);
        setLedgerPagination({
          page: res.page || page,
          pageSize: res.pageSize || 15,
          totalCount: res.totalCount || 0,
          totalPages: res.totalPages || 0,
          hasPreviousPage: res.hasPreviousPage || false,
          hasNextPage: res.hasNextPage || false
        });
      }
    } catch (err) {
      console.error('Failed to load ledger transactions:', err);
    } finally {
      setLedgerLoading(false);
    }
  }, [ledgerPagination.pageSize, ledgerFilters]);

  const fetchTechnicianWallet = useCallback(async (profileId) => {
    if (!profileId) {
      setTechWallet(null);
      return;
    }
    try {
      setTechWalletLoading(true);
      setTechWalletError(null);
      const data = await adminService.getTechnicianWallet(profileId);
      setTechWallet(data);
    } catch (err) {
      console.error('Failed to load technician wallet:', err);
      setTechWalletError(err.message || 'Unable to retrieve technician wallet details.');
      setTechWallet(null);
    } finally {
      setTechWalletLoading(false);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    fetchSummary();
    fetchTechnicians();
  }, [fetchSummary, fetchTechnicians]);

  // Tab change triggers
  useEffect(() => {
    if (activeTab === 'ledger') {
      fetchLedger(1);
    } else if (activeTab === 'overview') {
      fetchSummary();
    }
  }, [activeTab, fetchLedger, fetchSummary]);

  // When selected technician changes in wallet tab
  useEffect(() => {
    if (selectedTechId) {
      fetchTechnicianWallet(selectedTechId);
    }
  }, [selectedTechId, fetchTechnicianWallet]);

  // ---------------------------------------------------------------------------
  // Action Handlers
  // ---------------------------------------------------------------------------

  const handleRecordPayout = async (e) => {
    e.preventDefault();
    setPayoutError(null);
    setPayoutSuccess(null);

    const profileId = parseInt(payoutForm.electricianProfileId, 10);
    const amount = parseFloat(payoutForm.amount);

    if (!profileId) {
      setPayoutError('Please select a technician.');
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      setPayoutError('Payout amount must be greater than zero.');
      return;
    }
    if (!MASKED_ACCOUNT_REGEX.test(payoutForm.accountNumberMasked.trim())) {
      setPayoutError('Account number must be masked (e.g. ****1234 or XXXX5678). Raw account numbers are prohibited.');
      return;
    }
    if (!payoutForm.bankName.trim()) {
      setPayoutError('Bank name is required.');
      return;
    }
    if (payoutForm.bankTransferReference.trim().length < 3) {
      setPayoutError('Bank transfer reference must be at least 3 characters.');
      return;
    }
    if (payoutForm.adminNotes.trim().length < 5) {
      setPayoutError('Administrative notes must be at least 5 characters.');
      return;
    }
    if (!payoutForm.confirmBankTransferCompleted) {
      setPayoutError('You must explicitly confirm that the external bank transfer has already been completed.');
      return;
    }

    try {
      setPayoutSubmitting(true);
      const res = await adminService.recordPayout({
        electricianProfileId: profileId,
        amount: amount,
        bankName: payoutForm.bankName.trim(),
        accountNumberMasked: payoutForm.accountNumberMasked.trim(),
        bankTransferReference: payoutForm.bankTransferReference.trim(),
        adminNotes: payoutForm.adminNotes.trim(),
        confirmBankTransferCompleted: true
      });

      setPayoutSuccess(`Payout #${res.payoutId} recorded successfully. Debited ${formatCurrency(amount)}. New Balance: ${formatCurrency(res.newWalletBalance)}.`);
      setPayoutForm({
        electricianProfileId: '',
        amount: '',
        bankName: '',
        accountNumberMasked: '',
        bankTransferReference: '',
        adminNotes: '',
        confirmBankTransferCompleted: false
      });

      // Refresh summary & technician wallet if active
      fetchSummary();
      if (selectedTechId && parseInt(selectedTechId, 10) === profileId) {
        fetchTechnicianWallet(profileId);
      }
    } catch (err) {
      console.error('Failed to record payout:', err);
      setPayoutError(err.message || 'Failed to record payout.');
    } finally {
      setPayoutSubmitting(false);
    }
  };

  const handleOpenReversalModal = (payout) => {
    setPayoutToReverse(payout);
    setReversalForm({ reversalReason: '', bankNoticeReference: '' });
    setReversalError(null);
    setReversalModalOpen(true);
  };

  const handleConfirmReversal = async (e) => {
    e.preventDefault();
    if (!payoutToReverse) return;

    if (reversalForm.reversalReason.trim().length < 10) {
      setReversalError('A meaningful administrative reversal reason of at least 10 characters is required.');
      return;
    }

    try {
      setReversalSubmitting(true);
      setReversalError(null);
      const res = await adminService.reversePayout(payoutToReverse.payoutId, {
        reversalReason: reversalForm.reversalReason.trim(),
        bankNoticeReference: reversalForm.bankNoticeReference.trim() || null
      });

      setReversalModalOpen(false);
      setPayoutToReverse(null);

      // Refresh relevant views
      fetchSummary();
      if (selectedTechId) {
        fetchTechnicianWallet(selectedTechId);
      }
      if (activeTab === 'ledger') {
        fetchLedger(ledgerPagination.page);
      }
      alert(`Payout reversal successful. Credited ${formatCurrency(res.newWalletBalance ? res.newWalletBalance : payoutToReverse.amount)} back to technician wallet.`);
    } catch (err) {
      console.error('Failed to reverse payout:', err);
      setReversalError(err.message || 'Failed to reverse payout.');
    } finally {
      setReversalSubmitting(false);
    }
  };

  const handleInitiateAdjustment = (e) => {
    e.preventDefault();
    setAdjustmentError(null);
    setAdjustmentSuccess(null);

    const profileId = parseInt(adjustmentForm.electricianProfileId, 10);
    const amount = parseFloat(adjustmentForm.amount);

    if (!profileId) {
      setAdjustmentError('Please select a technician.');
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      setAdjustmentError('Adjustment amount must be greater than zero.');
      return;
    }
    if (adjustmentForm.reason.trim().length < 10) {
      setAdjustmentError('Administrative reason must be at least 10 characters.');
      return;
    }

    setAdjustmentConfirmOpen(true);
  };

  const handleExecuteAdjustment = async () => {
    const profileId = parseInt(adjustmentForm.electricianProfileId, 10);
    const amount = parseFloat(adjustmentForm.amount);

    try {
      setAdjustmentSubmitting(true);
      setAdjustmentError(null);
      const res = await adminService.adjustWallet(profileId, {
        type: adjustmentForm.type,
        amount: amount,
        reason: adjustmentForm.reason.trim(),
        externalReferenceNumber: adjustmentForm.externalReferenceNumber.trim() || null
      });

      setAdjustmentSuccess(`Adjustment successful (${adjustmentForm.type} of ${formatCurrency(amount)}). Previous: ${formatCurrency(res.previousBalance)}, New Balance: ${formatCurrency(res.newWalletBalance)}.`);
      setAdjustmentConfirmOpen(false);
      setAdjustmentForm({
        electricianProfileId: '',
        type: 'Credit',
        amount: '',
        reason: '',
        externalReferenceNumber: ''
      });

      fetchSummary();
      if (selectedTechId && parseInt(selectedTechId, 10) === profileId) {
        fetchTechnicianWallet(profileId);
      }
    } catch (err) {
      console.error('Failed to adjust wallet:', err);
      setAdjustmentError(err.message || 'Failed to adjust wallet balance.');
      setAdjustmentConfirmOpen(false);
    } finally {
      setAdjustmentSubmitting(false);
    }
  };

  // Helper for Transaction Badges
  const renderTransactionTypeBadge = (typeName) => {
    switch (typeName) {
      case 'DigitalJobEarning':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600, backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>
            <ArrowDownLeftIcon size={12} color="#059669" /> Digital Job Earning
          </span>
        );
      case 'PayoutDisbursed':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600, backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
            <ArrowUpRightIcon size={12} color="#2563eb" /> Payout Disbursed
          </span>
        );
      case 'PayoutReversal':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600, backgroundColor: '#faf5ff', color: '#6b21a8', border: '1px solid #e9d5ff' }}>
            <RefreshCwIcon size={12} color="#7e22ce" /> Payout Reversal
          </span>
        );
      case 'AdminAdjustmentCredit':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600, backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
            + Admin Credit
          </span>
        );
      case 'AdminAdjustmentDebit':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600, backgroundColor: '#fff1f2', color: '#9f1239', border: '1px solid #fecdd3' }}>
            - Admin Debit
          </span>
        );
      default:
        return (
          <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600, backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' }}>
            {typeName}
          </span>
        );
    }
  };

  // Helper for signed amount format
  const renderSignedAmount = (item) => {
    const isCredit = item.transactionTypeName === 'DigitalJobEarning' ||
                     item.transactionTypeName === 'PayoutReversal' ||
                     item.transactionTypeName === 'AdminAdjustmentCredit' ||
                     item.amount > 0 && item.transactionTypeName !== 'PayoutDisbursed' && item.transactionTypeName !== 'AdminAdjustmentDebit';

    const color = isCredit ? '#16a34a' : '#dc2626';
    const sign = isCredit ? '+' : '-';

    return (
      <span style={{ fontWeight: 700, color: color }}>
        {sign} {formatCurrency(Math.abs(item.amount))}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1400px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CreditCardIcon size={22} color="#2563eb" />
            Financial Operations & Wallet Management
          </h1>
          <p className="admin-page-subtitle">
            Enterprise financial ledger, authoritative GMV tracking, bank payout execution, and audited wallet controls.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={() => {
              fetchSummary();
              if (activeTab === 'ledger') fetchLedger(ledgerPagination.page);
              if (selectedTechId) fetchTechnicianWallet(selectedTechId);
            }}
            disabled={summaryLoading || ledgerLoading}
          >
            <RefreshCwIcon size={14} />
            Refresh Ledger Data
          </button>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '0.25rem',
          borderBottom: '2px solid #e2e8f0',
          paddingBottom: '0.25rem'
        }}
      >
        {[
          { id: 'overview', label: 'Financial Overview', icon: <TrendingUpIcon size={15} /> },
          { id: 'ledger', label: 'Transaction Ledger', icon: <DollarSignIcon size={15} /> },
          { id: 'technicians', label: 'Technician Wallets', icon: <WalletIcon size={15} /> },
          { id: 'payouts', label: 'Payout Management', icon: <ArrowUpRightIcon size={15} /> },
          { id: 'adjustments', label: 'Wallet Adjustments', icon: <CreditCardIcon size={15} /> }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.6rem 1.1rem',
                fontSize: '0.8125rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#2563eb' : '#64748b',
                backgroundColor: isActive ? '#eff6ff' : 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid #2563eb' : '2px solid transparent',
                borderRadius: '4px 4px 0 0',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                marginBottom: '-0.25rem'
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ------------------------------------------------------------------------
          TAB 1: FINANCIAL OVERVIEW
          ------------------------------------------------------------------------ */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {summaryError && (
            <div style={{ padding: '0.85rem 1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangleIcon size={16} color="#dc2626" />
              <span>{summaryError}</span>
            </div>
          )}

          {/* Primary Top Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
            <StatsCard
              title="Gross Merchandise Value (GMV)"
              value={formatCurrency(summary?.totalGrossJobValue || 0)}
              subtitle="Labour + Approved Equipment"
              color="blue"
              icon={<TrendingUpIcon size={18} color="#2563eb" />}
            />
            <StatsCard
              title="Platform Commission (15%)"
              value={formatCurrency(summary?.totalPlatformCommission || 0)}
              subtitle="Authoritative ElectroSL Revenue"
              color="green"
              icon={<DollarSignIcon size={18} color="#10b981" />}
            />
            <StatsCard
              title="Online Collected Volume"
              value={formatCurrency(summary?.totalCollectedOnline || 0)}
              subtitle="100% Digital + 15% CashSplit Fees"
              color="purple"
              icon={<CreditCardIcon size={18} color="#8b5cf6" />}
            />
            <StatsCard
              title="Direct Cash to Technicians"
              value={formatCurrency(summary?.totalDirectCashToElectricians || 0)}
              subtitle="85% Paid On-Site by Customers"
              color="yellow"
              icon={<WalletIcon size={18} color="#f59e0b" />}
            />
          </div>

          {/* Secondary Metric Cards: Liability & Disbursed Payouts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
            <StatsCard
              title="Total Technician Earnings"
              value={formatCurrency(summary?.totalElectricianEarnings || 0)}
              subtitle="85% Net Job Value Across All Jobs"
              color="green"
              icon={<ArrowDownLeftIcon size={18} color="#10b981" />}
            />
            <StatsCard
              title="Outstanding Wallet Liability"
              value={formatCurrency(summary?.outstandingWalletLiability || 0)}
              subtitle="Pending Virtual Wallet Claims"
              color="red"
              icon={<AlertTriangleIcon size={18} color="#ef4444" />}
            />
            <StatsCard
              title="Net Disbursed Bank Payouts"
              value={formatCurrency(summary?.netDisbursedPayouts || 0)}
              subtitle={`Recorded: ${formatCurrency(summary?.totalRecordedPayouts || 0)} | Reversed: ${formatCurrency(summary?.totalReversedPayouts || 0)}`}
              color="blue"
              icon={<ArrowUpRightIcon size={18} color="#2563eb" />}
            />
            <StatsCard
              title="Technicians with Wallet Balance"
              value={`${summary?.techniciansWithPositiveBalanceCount || 0} / ${summary?.totalTechnicianCount || 0}`}
              subtitle={`${summary?.totalWalletLedgerTransactionsCount || 0} ledger mutations recorded`}
              color="purple"
              icon={<BriefcaseIcon size={18} color="#8b5cf6" />}
            />
          </div>

          {/* Architectural Financial Rules & Governance Explainer */}
          <div className="admin-card" style={{ backgroundColor: '#ffffff', borderLeft: '4px solid #2563eb' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              Authoritative ElectroSL Financial Model Invariants
            </h3>
            <p style={{ fontSize: '0.8125rem', color: '#475569', lineHeight: 1.6, margin: '0 0 1rem 0' }}>
              Every financial transaction on the ElectroSL platform adheres to strict mathematical determinism, ACID database row locking, and immutable ledger accounting:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '0.85rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.3rem', fontSize: '0.8125rem' }}>
                  FullDigital Payment Flow
                </span>
                <span style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.5 }}>
                  Customer pays 100% online through ElectroSL payment gateway. ElectroSL retains 15% platform commission and immediately credits 85% directly to the technician's virtual wallet.
                </span>
              </div>
              <div style={{ padding: '0.85rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.3rem', fontSize: '0.8125rem' }}>
                  CashSplit Payment Flow
                </span>
                <span style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.5 }}>
                  Customer pays 15% online as ElectroSL's platform commission. Customer pays remaining 85% directly to the technician in cash on-site. Zero wallet deduction, zero technician commission debt.
                </span>
              </div>
              <div style={{ padding: '0.85rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.3rem', fontSize: '0.8125rem' }}>
                  Bank Payout Governance
                </span>
                <span style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.5 }}>
                  Admin verifies out-of-band bank transfer (SLIPS/CEFT) before recording. Requires explicit confirmation checkbox and masked account format. Debits virtual wallet balance with row-level lock.
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={() => setActiveTab('payouts')}
            >
              <ArrowUpRightIcon size={14} color="#ffffff" />
              Record Completed Bank Payout
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={() => setActiveTab('adjustments')}
            >
              <CreditCardIcon size={14} />
              Perform Audited Wallet Adjustment
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={() => setActiveTab('ledger')}
            >
              <DollarSignIcon size={14} />
              Inspect Full Ledger
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------
          TAB 2: TRANSACTION LEDGER
          ------------------------------------------------------------------------ */}
      {activeTab === 'ledger' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Filters Toolbar */}
          <div className="admin-card" style={{ padding: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', alignItems: 'end' }}>
              
              {/* Search text */}
              <div className="admin-form-group">
                <label className="admin-label">Search</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="Search technician, description..."
                    value={ledgerFilters.searchQuery}
                    onChange={(e) => setLedgerFilters({ ...ledgerFilters, searchQuery: e.target.value })}
                  />
                </div>
              </div>

              {/* Transaction Type Filter */}
              <div className="admin-form-group">
                <label className="admin-label">Transaction Type</label>
                <select
                  className="admin-select"
                  value={ledgerFilters.transactionType}
                  onChange={(e) => setLedgerFilters({ ...ledgerFilters, transactionType: e.target.value })}
                >
                  <option value="">All Transaction Types</option>
                  <option value="DigitalJobEarning">Digital Job Earning (+)</option>
                  <option value="PayoutDisbursed">Payout Disbursed (-)</option>
                  <option value="PayoutReversal">Payout Reversal (+)</option>
                  <option value="AdminAdjustmentCredit">Admin Credit Adjustment (+)</option>
                  <option value="AdminAdjustmentDebit">Admin Debit Adjustment (-)</option>
                </select>
              </div>

              {/* Technician Profile Filter */}
              <div className="admin-form-group">
                <label className="admin-label">Technician</label>
                <select
                  className="admin-select"
                  value={ledgerFilters.electricianProfileId}
                  onChange={(e) => setLedgerFilters({ ...ledgerFilters, electricianProfileId: e.target.value })}
                >
                  <option value="">All Technicians</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name || `Technician #${t.id}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  style={{ flex: 1 }}
                  onClick={() => fetchLedger(1)}
                  disabled={ledgerLoading}
                >
                  <FilterIcon size={14} color="#ffffff" />
                  Apply Filters
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => {
                    setLedgerFilters({
                      searchQuery: '',
                      transactionType: '',
                      electricianProfileId: '',
                      startDateUtc: '',
                      endDateUtc: ''
                    });
                  }}
                  title="Reset Filters"
                >
                  Reset
                </button>
              </div>

            </div>
          </div>

          {/* Ledger Table */}
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Txn ID</th>
                  <th style={{ width: '150px' }}>Timestamp (UTC)</th>
                  <th>Technician</th>
                  <th style={{ width: '100px' }}>Job ID</th>
                  <th style={{ width: '170px' }}>Type</th>
                  <th style={{ textAlign: 'right', width: '130px' }}>Amount</th>
                  <th style={{ textAlign: 'right', width: '200px' }}>Balance Progression</th>
                  <th>Description & Audit Reference</th>
                </tr>
              </thead>
              <tbody>
                {ledgerLoading ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                      <RefreshCwIcon size={18} color="#2563eb" style={{ animation: 'spin 1s linear infinite', marginRight: '0.5rem' }} />
                      Loading financial ledger entries...
                    </td>
                  </tr>
                ) : ledgerItems.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                      No wallet transactions recorded matching the selected filter criteria.
                    </td>
                  </tr>
                ) : (
                  ledgerItems.map((item) => (
                    <tr key={item.transactionId}>
                      <td style={{ fontWeight: 600, color: '#334155' }}>
                        #{item.transactionId}
                      </td>
                      <td style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {formatDateTime(item.createdAtUtc)}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>
                          {item.electricianName || `Profile #${item.electricianProfileId}`}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          Profile #{item.electricianProfileId}
                        </div>
                      </td>
                      <td>
                        {item.jobId ? (
                          <span style={{ padding: '0.15rem 0.4rem', backgroundColor: '#f1f5f9', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600, color: '#334155' }}>
                            Job #{item.jobId}
                          </span>
                        ) : (
                          <span style={{ color: '#cbd5e1' }}>—</span>
                        )}
                      </td>
                      <td>
                        {renderTransactionTypeBadge(item.transactionTypeName)}
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {renderSignedAmount(item)}
                      </td>
                      <td style={{ textAlign: 'right', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        <span style={{ color: '#64748b' }}>{formatCurrency(item.balanceBefore)}</span>
                        <span style={{ color: '#94a3b8', margin: '0 0.35rem' }}>→</span>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatCurrency(item.balanceAfter)}</span>
                      </td>
                      <td style={{ fontSize: '0.75rem' }}>
                        <div style={{ color: '#334155', fontWeight: 500 }}>{item.description}</div>
                        {item.externalReferenceNumber && (
                          <div style={{ color: '#64748b', fontSize: '0.7rem' }}>
                            Ref: <code style={{ backgroundColor: '#f1f5f9', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>{item.externalReferenceNumber}</code>
                          </div>
                        )}
                        {item.initiatedByAdminName && (
                          <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                            Admin: {item.initiatedByAdminName}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Showing page {ledgerPagination.page} of {Math.max(1, ledgerPagination.totalPages)} ({ledgerPagination.totalCount} total entries)
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                  disabled={!ledgerPagination.hasPreviousPage || ledgerLoading}
                  onClick={() => fetchLedger(ledgerPagination.page - 1)}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                  disabled={!ledgerPagination.hasNextPage || ledgerLoading}
                  onClick={() => fetchLedger(ledgerPagination.page + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------------------
          TAB 3: TECHNICIAN WALLETS
          ------------------------------------------------------------------------ */}
      {activeTab === 'technicians' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Technician Selector Card */}
          <div className="admin-card">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ minWidth: '300px', flex: 1 }}>
                <label className="admin-label" style={{ marginBottom: '0.35rem', display: 'block' }}>
                  Select Technician to Inspect Wallet
                </label>
                <select
                  className="admin-select"
                  value={selectedTechId}
                  onChange={(e) => setSelectedTechId(e.target.value)}
                  style={{ fontWeight: 600 }}
                >
                  <option value="">-- Choose an Approved Technician --</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} • Profile #{t.id} ({t.specialization || 'General'})
                    </option>
                  ))}
                </select>
              </div>

              {selectedTechId && techWallet && (
                <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'flex-end' }}>
                  <button
                    type="button"
                    className="admin-btn admin-btn-primary"
                    onClick={() => {
                      setPayoutForm((prev) => ({ ...prev, electricianProfileId: selectedTechId }));
                      setActiveTab('payouts');
                    }}
                  >
                    <ArrowUpRightIcon size={14} color="#ffffff" />
                    Record Payout for {techWallet.name}
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary"
                    onClick={() => {
                      setAdjustmentForm((prev) => ({ ...prev, electricianProfileId: selectedTechId }));
                      setActiveTab('adjustments');
                    }}
                  >
                    <CreditCardIcon size={14} />
                    Adjust Wallet
                  </button>
                </div>
              )}
            </div>
          </div>

          {techWalletLoading && (
            <div className="admin-card" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <RefreshCwIcon size={24} color="#2563eb" style={{ animation: 'spin 1s linear infinite', marginBottom: '0.5rem' }} />
              <div>Retrieving authoritative wallet balance and ledger records...</div>
            </div>
          )}

          {techWalletError && (
            <div style={{ padding: '1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#991b1b' }}>
              {techWalletError}
            </div>
          )}

          {/* Selected Technician Detail View */}
          {techWallet && !techWalletLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Profile & Big Balance Banner */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '1rem'
                }}
              >
                {/* Profile Card */}
                <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                        Technician Dossier
                      </span>
                      <span style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600, backgroundColor: techWallet.isOnline ? '#ecfdf5' : '#f1f5f9', color: techWallet.isOnline ? '#065f46' : '#64748b', border: `1px solid ${techWallet.isOnline ? '#a7f3d0' : '#cbd5e1'}` }}>
                        {techWallet.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
                      {techWallet.name}
                    </h2>
                    <div style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '0.75rem' }}>
                      {techWallet.email} • {techWallet.phone}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#334155' }}>
                      <strong>Specialization:</strong> {techWallet.specialization || 'General Electrician'}
                    </div>
                  </div>
                  <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9', fontSize: '0.7rem', color: '#94a3b8' }}>
                    Profile ID #{techWallet.profileId} • User ID #{techWallet.userId}
                  </div>
                </div>

                {/* Big Wallet Balance Card */}
                <div
                  className="admin-card"
                  style={{
                    backgroundColor: '#0b1528',
                    color: '#ffffff',
                    border: '1px solid #1e293b',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>
                        Current Wallet Balance
                      </span>
                      <WalletIcon size={20} color="#38bdf8" />
                    </div>
                    <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#38bdf8', margin: '0.5rem 0', letterSpacing: '-0.02em' }}>
                      {formatCurrency(techWallet.currentWalletBalance)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Audited Virtual Balance (immutable ledger row-locked)
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button
                      type="button"
                      className="admin-btn admin-btn-sm"
                      style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', flex: 1 }}
                      onClick={() => {
                        setPayoutForm((prev) => ({ ...prev, electricianProfileId: techWallet.profileId }));
                        setActiveTab('payouts');
                      }}
                    >
                      Record Payout
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn-sm"
                      style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)', flex: 1 }}
                      onClick={() => {
                        setAdjustmentForm((prev) => ({ ...prev, electricianProfileId: techWallet.profileId }));
                        setActiveTab('adjustments');
                      }}
                    >
                      Adjust
                    </button>
                  </div>
                </div>

                {/* Lifetime Metrics Summary */}
                <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', paddingBottom: '0.35rem', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b' }}>Lifetime Job Earnings:</span>
                    <span style={{ fontWeight: 700, color: '#16a34a' }}>+{formatCurrency(techWallet.lifetimeDigitalEarnings)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', paddingBottom: '0.35rem', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b' }}>Gross Bank Payouts:</span>
                    <span style={{ fontWeight: 700, color: '#dc2626' }}>-{formatCurrency(techWallet.lifetimeGrossPayouts)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', paddingBottom: '0.35rem', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b' }}>Reversed Payouts:</span>
                    <span style={{ fontWeight: 700, color: '#7e22ce' }}>+{formatCurrency(techWallet.lifetimeReversedPayouts)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', paddingBottom: '0.35rem', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b' }}>Net Disbursed Payouts:</span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatCurrency(techWallet.lifetimeNetPayouts)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                    <span style={{ color: '#64748b' }}>Manual Adjustments (Net):</span>
                    <span style={{ fontWeight: 600, color: techWallet.lifetimeAdjustmentsCredit >= techWallet.lifetimeAdjustmentsDebit ? '#16a34a' : '#dc2626' }}>
                      {formatCurrency(techWallet.lifetimeAdjustmentsCredit - techWallet.lifetimeAdjustmentsDebit)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Transactions Table for Selected Technician */}
              <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Recent Wallet Ledger Entries ({techWallet.recentTransactions?.length || 0})
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Authoritative Before / After Balance Progression
                  </span>
                </div>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>Txn ID</th>
                      <th style={{ width: '140px' }}>Timestamp (UTC)</th>
                      <th style={{ width: '90px' }}>Job ID</th>
                      <th style={{ width: '160px' }}>Transaction Type</th>
                      <th style={{ textAlign: 'right', width: '120px' }}>Amount</th>
                      <th style={{ textAlign: 'right', width: '180px' }}>Balance Progression</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!techWallet.recentTransactions || techWallet.recentTransactions.length === 0) ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                          No ledger transactions recorded for this technician.
                        </td>
                      </tr>
                    ) : (
                      techWallet.recentTransactions.map((tx) => (
                        <tr key={tx.transactionId}>
                          <td style={{ fontWeight: 600, color: '#334155' }}>#{tx.transactionId}</td>
                          <td style={{ fontSize: '0.75rem', color: '#64748b' }}>{formatDateTime(tx.createdAtUtc)}</td>
                          <td>
                            {tx.jobId ? (
                              <span style={{ padding: '0.15rem 0.4rem', backgroundColor: '#f1f5f9', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600, color: '#334155' }}>
                                Job #{tx.jobId}
                              </span>
                            ) : (
                              <span style={{ color: '#cbd5e1' }}>—</span>
                            )}
                          </td>
                          <td>{renderTransactionTypeBadge(tx.transactionTypeName)}</td>
                          <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{renderSignedAmount(tx)}</td>
                          <td style={{ textAlign: 'right', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                            <span style={{ color: '#64748b' }}>{formatCurrency(tx.balanceBefore)}</span>
                            <span style={{ color: '#94a3b8', margin: '0 0.35rem' }}>→</span>
                            <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatCurrency(tx.balanceAfter)}</span>
                          </td>
                          <td style={{ fontSize: '0.75rem', color: '#334155' }}>
                            <div>{tx.description}</div>
                            {tx.externalReferenceNumber && (
                              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Ref: {tx.externalReferenceNumber}</div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Recorded Payouts Table for Selected Technician */}
              {techWallet.recentPayouts && techWallet.recentPayouts.length > 0 && (
                <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                      Bank Payout Disbursements ({techWallet.recentPayouts.length})
                    </h3>
                  </div>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th style={{ width: '80px' }}>Payout ID</th>
                        <th style={{ width: '140px' }}>Disbursed Date</th>
                        <th style={{ textAlign: 'right', width: '120px' }}>Amount</th>
                        <th>Bank & Masked Account</th>
                        <th>Bank Transfer Ref</th>
                        <th>Admin Notes</th>
                        <th style={{ width: '110px' }}>Status</th>
                        <th style={{ width: '120px', textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {techWallet.recentPayouts.map((po) => (
                        <tr key={po.payoutId}>
                          <td style={{ fontWeight: 600 }}>#{po.payoutId}</td>
                          <td style={{ fontSize: '0.75rem', color: '#64748b' }}>{formatDateTime(po.disbursedAtUtc)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: po.isReversed ? '#94a3b8' : '#dc2626' }}>
                            {formatCurrency(po.amount)}
                          </td>
                          <td style={{ fontSize: '0.75rem' }}>
                            <strong>{po.bankName}</strong>
                            <div style={{ color: '#64748b' }}>{po.accountNumberMasked}</div>
                          </td>
                          <td style={{ fontSize: '0.75rem' }}>
                            <code style={{ backgroundColor: '#f1f5f9', padding: '0.15rem 0.35rem', borderRadius: '3px' }}>
                              {po.bankTransferReference}
                            </code>
                          </td>
                          <td style={{ fontSize: '0.75rem', color: '#334155' }}>
                            {po.adminNotes}
                            {po.isReversed && (
                              <div style={{ color: '#991b1b', marginTop: '0.2rem' }}>
                                <strong>Reversal Reason:</strong> {po.reversalReason}
                              </div>
                            )}
                          </td>
                          <td>
                            {po.isReversed ? (
                              <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600, backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
                                Reversed
                              </span>
                            ) : (
                              <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600, backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>
                                Disbursed
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {!po.isReversed ? (
                              <button
                                type="button"
                                className="admin-btn admin-btn-danger admin-btn-sm"
                                onClick={() => handleOpenReversalModal(po)}
                              >
                                Reverse
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Reversed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          )}

          {!selectedTechId && !techWalletLoading && (
            <div className="admin-card" style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94a3b8' }}>
              <WalletIcon size={36} color="#cbd5e1" style={{ marginBottom: '0.75rem' }} />
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#475569' }}>
                No Technician Selected
              </div>
              <div style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                Please choose a technician from the selector above to inspect their virtual wallet balance, lifetime metrics, and immutable ledger history.
              </div>
            </div>
          )}

        </div>
      )}

      {/* ------------------------------------------------------------------------
          TAB 4: PAYOUT MANAGEMENT
          ------------------------------------------------------------------------ */}
      {activeTab === 'payouts' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
          
          {/* Record Payout Form Card */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ArrowUpRightIcon size={18} color="#2563eb" />
                Record Confirmed Bank Payout
              </h3>
            </div>

            <p style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '1.25rem' }}>
              Record an external bank transfer (SLIPS/CEFT) that has already been executed via your banking portal. The technician's wallet balance will be debited immediately.
            </p>

            {payoutSuccess && (
              <div style={{ padding: '0.85rem', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px', color: '#065f46', marginBottom: '1rem', fontSize: '0.8125rem' }}>
                <CheckIcon size={14} color="#059669" style={{ marginRight: '0.35rem' }} />
                {payoutSuccess}
              </div>
            )}

            {payoutError && (
              <div style={{ padding: '0.85rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#991b1b', marginBottom: '1rem', fontSize: '0.8125rem' }}>
                <AlertTriangleIcon size={14} color="#dc2626" style={{ marginRight: '0.35rem' }} />
                {payoutError}
              </div>
            )}

            <form onSubmit={handleRecordPayout} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Technician Dropdown */}
              <div className="admin-form-group">
                <label className="admin-label">Technician *</label>
                <select
                  className="admin-select"
                  value={payoutForm.electricianProfileId}
                  onChange={(e) => {
                    const pid = e.target.value;
                    setPayoutForm({ ...payoutForm, electricianProfileId: pid });
                    if (pid) fetchTechnicianWallet(pid);
                  }}
                  required
                >
                  <option value="">-- Select Technician --</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (Profile #{t.id})
                    </option>
                  ))}
                </select>
                {techWallet && payoutForm.electricianProfileId && (
                  <div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600, marginTop: '0.2rem' }}>
                    Available Wallet Balance: {formatCurrency(techWallet.currentWalletBalance)}
                  </div>
                )}
              </div>

              {/* Amount */}
              <div className="admin-form-group">
                <label className="admin-label">Payout Amount (LKR) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="admin-input"
                  placeholder="e.g. 15000.00"
                  value={payoutForm.amount}
                  onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                  required
                />
              </div>

              {/* Bank Name */}
              <div className="admin-form-group">
                <label className="admin-label">Bank Name *</label>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="e.g. Commercial Bank of Ceylon / Bank of Ceylon"
                  value={payoutForm.bankName}
                  onChange={(e) => setPayoutForm({ ...payoutForm, bankName: e.target.value })}
                  required
                />
              </div>

              {/* Masked Account Number */}
              <div className="admin-form-group">
                <label className="admin-label">Masked Account Number *</label>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="e.g. ****1234 or XXXX5678"
                  value={payoutForm.accountNumberMasked}
                  onChange={(e) => setPayoutForm({ ...payoutForm, accountNumberMasked: e.target.value })}
                  required
                />
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  Raw account numbers are strictly prohibited. Enforce masking pattern (e.g. <code>****1234</code>).
                </span>
              </div>

              {/* Bank Transfer Reference */}
              <div className="admin-form-group">
                <label className="admin-label">Bank Transfer Reference (SLIPS / CEFT) *</label>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="e.g. CEFT-20261121-889102"
                  value={payoutForm.bankTransferReference}
                  onChange={(e) => setPayoutForm({ ...payoutForm, bankTransferReference: e.target.value })}
                  required
                />
              </div>

              {/* Administrative Notes */}
              <div className="admin-form-group">
                <label className="admin-label">Administrative Notes (Min 5 chars) *</label>
                <textarea
                  className="admin-textarea"
                  rows="3"
                  placeholder="Provide audit notes regarding the payment verification..."
                  value={payoutForm.adminNotes}
                  onChange={(e) => setPayoutForm({ ...payoutForm, adminNotes: e.target.value })}
                  required
                />
              </div>

              {/* Explicit Confirmation Checkbox (Mandatory boolean) */}
              <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem', color: '#0f172a' }}>
                  <input
                    type="checkbox"
                    checked={payoutForm.confirmBankTransferCompleted}
                    onChange={(e) => setPayoutForm({ ...payoutForm, confirmBankTransferCompleted: e.target.checked })}
                    style={{ marginTop: '0.2rem' }}
                    required
                  />
                  <span>
                    <strong>Mandatory Payout Confirmation:</strong> I explicitly confirm that the external bank transfer has already been completed via banking portal.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="admin-btn admin-btn-primary"
                style={{ marginTop: '0.5rem', padding: '0.65rem 1rem' }}
                disabled={payoutSubmitting || !payoutForm.confirmBankTransferCompleted}
              >
                {payoutSubmitting ? 'Recording & Debiting...' : 'Record Confirmed Bank Payout'}
              </button>

            </form>
          </div>

          {/* Operational Instructions & Safety Invariants */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="admin-card" style={{ borderLeft: '4px solid #f59e0b' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
                Payout Safety & Anti-Fraud Invariants
              </h3>
              <ul style={{ fontSize: '0.78rem', color: '#475569', paddingLeft: '1.25rem', lineHeight: 1.6, margin: 0 }}>
                <li>
                  <strong>Out-of-Band Disbursal:</strong> ElectroSL does not store debit cards or initiate direct ACH debits. All technician payouts are disbursed out-of-band via Sri Lankan banking rails (CEFT/SLIPS/RTGS).
                </li>
                <li>
                  <strong>Negative Balance Prevention:</strong> Payout recording fails with HTTP 400 if the payout amount exceeds the technician's available virtual wallet balance.
                </li>
                <li>
                  <strong>Mandatory Confirmation:</strong> The backend strictly rejects requests where <code>ConfirmBankTransferCompleted</code> is false or missing.
                </li>
                <li>
                  <strong>Account Masking:</strong> Full bank account numbers must never be entered or stored in plain text to protect technician PII.
                </li>
              </ul>
            </div>

            <div className="admin-card">
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
                Handling Bounced or Failed Payouts
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.5, margin: '0 0 0.75rem 0' }}>
                If a bank transfer bounces or is rejected by the beneficiary bank, administrators can execute an audited <strong>Payout Reversal</strong>.
              </p>
              <p style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                Reversals acquire a row-level database lock, verify the payout has not already been reversed, and credit the funds back to the technician's wallet with an immutable ledger entry.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------------------
          TAB 5: WALLET ADJUSTMENTS
          ------------------------------------------------------------------------ */}
      {activeTab === 'adjustments' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
          
          {/* Adjustment Form Card */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCardIcon size={18} color="#2563eb" />
                Audited Wallet Balance Adjustment
              </h3>
            </div>

            <p style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '1.25rem' }}>
              Perform an authorized balance adjustment (Credit or Debit) for a technician. Every adjustment requires a mandatory administrative audit reason and is permanently recorded in the ledger.
            </p>

            {adjustmentSuccess && (
              <div style={{ padding: '0.85rem', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px', color: '#065f46', marginBottom: '1rem', fontSize: '0.8125rem' }}>
                <CheckIcon size={14} color="#059669" style={{ marginRight: '0.35rem' }} />
                {adjustmentSuccess}
              </div>
            )}

            {adjustmentError && (
              <div style={{ padding: '0.85rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#991b1b', marginBottom: '1rem', fontSize: '0.8125rem' }}>
                <AlertTriangleIcon size={14} color="#dc2626" style={{ marginRight: '0.35rem' }} />
                {adjustmentError}
              </div>
            )}

            <form onSubmit={handleInitiateAdjustment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Technician Dropdown */}
              <div className="admin-form-group">
                <label className="admin-label">Technician *</label>
                <select
                  className="admin-select"
                  value={adjustmentForm.electricianProfileId}
                  onChange={(e) => {
                    const pid = e.target.value;
                    setAdjustmentForm({ ...adjustmentForm, electricianProfileId: pid });
                    if (pid) fetchTechnicianWallet(pid);
                  }}
                  required
                >
                  <option value="">-- Select Technician --</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (Profile #{t.id})
                    </option>
                  ))}
                </select>
                {techWallet && adjustmentForm.electricianProfileId && (
                  <div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600, marginTop: '0.2rem' }}>
                    Current Wallet Balance: {formatCurrency(techWallet.currentWalletBalance)}
                  </div>
                )}
              </div>

              {/* Adjustment Type */}
              <div className="admin-form-group">
                <label className="admin-label">Adjustment Type *</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.8125rem' }}>
                    <input
                      type="radio"
                      name="adjustmentType"
                      value="Credit"
                      checked={adjustmentForm.type === 'Credit'}
                      onChange={() => setAdjustmentForm({ ...adjustmentForm, type: 'Credit' })}
                    />
                    <strong style={{ color: '#16a34a' }}>Credit (+)</strong> (Add funds to wallet)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.8125rem' }}>
                    <input
                      type="radio"
                      name="adjustmentType"
                      value="Debit"
                      checked={adjustmentForm.type === 'Debit'}
                      onChange={() => setAdjustmentForm({ ...adjustmentForm, type: 'Debit' })}
                    />
                    <strong style={{ color: '#dc2626' }}>Debit (-)</strong> (Deduct funds from wallet)
                  </label>
                </div>
              </div>

              {/* Amount */}
              <div className="admin-form-group">
                <label className="admin-label">Adjustment Amount (LKR) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="admin-input"
                  placeholder="e.g. 5000.00"
                  value={adjustmentForm.amount}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, amount: e.target.value })}
                  required
                />
              </div>

              {/* Reason (Min 10 characters) */}
              <div className="admin-form-group">
                <label className="admin-label">Administrative Reason (Min 10 chars) *</label>
                <textarea
                  className="admin-textarea"
                  rows="3"
                  placeholder="Document the operational or dispute justification for this adjustment..."
                  value={adjustmentForm.reason}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })}
                  required
                />
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  {adjustmentForm.reason.length}/10 characters minimum.
                </span>
              </div>

              {/* External Reference Number */}
              <div className="admin-form-group">
                <label className="admin-label">External Reference Number (Optional)</label>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="e.g. DISPUTE-TICKET-44829 or AUDIT-2026-11"
                  value={adjustmentForm.externalReferenceNumber}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, externalReferenceNumber: e.target.value })}
                />
              </div>

              {/* Projected Balance Preview Banner */}
              {techWallet && adjustmentForm.amount && !isNaN(parseFloat(adjustmentForm.amount)) && (
                <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.78rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ color: '#64748b' }}>Current Balance:</span>
                    <strong>{formatCurrency(techWallet.currentWalletBalance)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ color: '#64748b' }}>Adjustment:</span>
                    <strong style={{ color: adjustmentForm.type === 'Credit' ? '#16a34a' : '#dc2626' }}>
                      {adjustmentForm.type === 'Credit' ? '+' : '-'} {formatCurrency(parseFloat(adjustmentForm.amount))}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.25rem', borderTop: '1px solid #cbd5e1' }}>
                    <span style={{ color: '#0f172a', fontWeight: 600 }}>Projected New Balance:</span>
                    <strong style={{ color: '#0f172a' }}>
                      {formatCurrency(
                        adjustmentForm.type === 'Credit'
                          ? techWallet.currentWalletBalance + parseFloat(adjustmentForm.amount)
                          : techWallet.currentWalletBalance - parseFloat(adjustmentForm.amount)
                      )}
                    </strong>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="admin-btn admin-btn-primary"
                style={{ marginTop: '0.5rem', padding: '0.65rem 1rem' }}
                disabled={adjustmentSubmitting}
              >
                Review & Authorize Adjustment
              </button>

            </form>
          </div>

          {/* Operational Policy Card */}
          <div className="admin-card" style={{ borderLeft: '4px solid #2563eb' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              Adjustment Governance & Audit Policy
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.6, margin: '0 0 0.75rem 0' }}>
              Manual adjustments are reserved for administrative dispute resolutions, bank fee reimbursements, or verified operational errors.
            </p>
            <ul style={{ fontSize: '0.78rem', color: '#475569', paddingLeft: '1.25rem', lineHeight: 1.6, margin: 0 }}>
              <li>Direct balance modification is strictly prohibited. Every balance mutation creates an audited <code>WalletTransaction</code> record.</li>
              <li>A Debit adjustment that would result in a negative balance is automatically rejected by backend business rules.</li>
              <li>The Admin User ID, exact UTC timestamp, and justification notes are permanently stored.</li>
            </ul>
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------------------
          MODAL: PAYOUT REVERSAL CONFIRMATION
          ------------------------------------------------------------------------ */}
      {reversalModalOpen && payoutToReverse && (
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
              maxWidth: '520px',
              width: '100%',
              backgroundColor: '#ffffff',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div className="admin-card-header">
              <h3 className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#991b1b' }}>
                <AlertTriangleIcon size={18} color="#dc2626" />
                Confirm Payout Reversal
              </h3>
              <button
                type="button"
                className="admin-btn admin-btn-ghost admin-btn-sm"
                onClick={() => setReversalModalOpen(false)}
              >
                <XIcon size={16} />
              </button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.8125rem', color: '#475569', margin: '0 0 0.75rem 0' }}>
                You are about to reverse bank payout <strong>#{payoutToReverse.payoutId}</strong> for <strong>{payoutToReverse.amount ? formatCurrency(payoutToReverse.amount) : ''}</strong>.
              </p>
              <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', fontSize: '0.75rem', color: '#991b1b', lineHeight: 1.5 }}>
                <strong>Warning:</strong> Reversing this payout will instantly credit the funds back to the technician's wallet and create an immutable reversal entry in the ledger. This action cannot be undone.
              </div>
            </div>

            {reversalError && (
              <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', color: '#991b1b', marginBottom: '1rem', fontSize: '0.78rem' }}>
                {reversalError}
              </div>
            )}

            <form onSubmit={handleConfirmReversal} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div className="admin-form-group">
                <label className="admin-label">Administrative Reversal Reason (Min 10 chars) *</label>
                <textarea
                  className="admin-textarea"
                  rows="3"
                  placeholder="Specify why this bank transfer was rejected or bounced (e.g. beneficiary account closed/invalid account number)..."
                  value={reversalForm.reversalReason}
                  onChange={(e) => setReversalForm({ ...reversalForm, reversalReason: e.target.value })}
                  required
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Bank Notice Reference (Optional)</label>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="e.g. SLIPS-BOUNCE-99281"
                  value={reversalForm.bankNoticeReference}
                  onChange={(e) => setReversalForm({ ...reversalForm, bankNoticeReference: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setReversalModalOpen(false)}
                  disabled={reversalSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-danger"
                  disabled={reversalSubmitting || reversalForm.reversalReason.trim().length < 10}
                >
                  {reversalSubmitting ? 'Processing Reversal...' : 'Confirm Reversal & Credit Wallet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------
          MODAL: ADJUSTMENT AUTHORIZATION CONFIRMATION
          ------------------------------------------------------------------------ */}
      {adjustmentConfirmOpen && (
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
              maxWidth: '480px',
              width: '100%',
              backgroundColor: '#ffffff',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div className="admin-card-header">
              <h3 className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCardIcon size={18} color="#2563eb" />
                Authorize Wallet Balance Mutation
              </h3>
              <button
                type="button"
                className="admin-btn admin-btn-ghost admin-btn-sm"
                onClick={() => setAdjustmentConfirmOpen(false)}
              >
                <XIcon size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem', fontSize: '0.8125rem' }}>
              <p style={{ margin: 0, color: '#334155' }}>
                Please review the proposed adjustment details before signing and committing:
              </p>
              
              <div style={{ padding: '0.85rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div><strong>Technician:</strong> Profile #{adjustmentForm.electricianProfileId}</div>
                <div><strong>Action:</strong> <span style={{ color: adjustmentForm.type === 'Credit' ? '#16a34a' : '#dc2626', fontWeight: 700 }}>{adjustmentForm.type.toUpperCase()}</span></div>
                <div><strong>Amount:</strong> {formatCurrency(parseFloat(adjustmentForm.amount))}</div>
                <div><strong>Audit Reason:</strong> {adjustmentForm.reason}</div>
                {adjustmentForm.externalReferenceNumber && (
                  <div><strong>Reference:</strong> {adjustmentForm.externalReferenceNumber}</div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => setAdjustmentConfirmOpen(false)}
                disabled={adjustmentSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={handleExecuteAdjustment}
                disabled={adjustmentSubmitting}
              >
                {adjustmentSubmitting ? 'Mutating Ledger...' : 'Confirm & Commit Mutation'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminFinancialManagement;

