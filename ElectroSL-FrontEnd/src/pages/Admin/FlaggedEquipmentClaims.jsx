import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import ClaimReviewModal from '../../components/admin/ClaimReviewModal';
import DocumentViewer from '../../components/admin/DocumentViewer';
import { formatCurrency, formatDateTime } from '../../utils/formattingHelpers';
import {
  SearchIcon,
  RefreshCwIcon,
  CheckIcon,
  XIcon,
  EyeIcon,
  FileTextIcon,
  ShieldAlertIcon,
  AlertTriangleIcon
} from '../../components/admin/AdminIcons';

const FlaggedEquipmentClaims = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('FlaggedForReview');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Modals
  const [reviewModalState, setReviewModalState] = useState({ isOpen: false, action: 'approve', claim: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewerState, setViewerState] = useState({ isOpen: false, url: null, title: '' });

  const fetchClaims = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getEquipmentClaims(statusFilter, search, selectedCategory);
      setClaims(data || []);
    } catch (err) {
      console.error('Failed to load equipment claims:', err);
      setError(err.message || 'Unable to load equipment claims. Please ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [statusFilter, selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchClaims();
  };

  const handleReviewConfirm = async (reviewNotes) => {
    const { action, claim } = reviewModalState;
    if (!claim) return;

    try {
      setIsSubmitting(true);
      if (action === 'approve') {
        await adminService.approveEquipmentClaim(claim.id, reviewNotes);
        setFeedback({
          type: 'success',
          text: `Claim #${claim.id} ("${claim.itemName}") has been approved.`
        });
      } else {
        await adminService.rejectEquipmentClaim(claim.id, reviewNotes);
        setFeedback({
          type: 'success',
          text: `Claim #${claim.id} ("${claim.itemName}") has been rejected.`
        });
      }
      setReviewModalState({ isOpen: false, action: 'approve', claim: null });
      fetchClaims();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.message || 'Review action failed.'
      });
      // If conflict (already reviewed), refresh claims
      if (err.status === 409 || (err.message && err.message.toLowerCase().includes('conflict'))) {
        fetchClaims();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Derive categories for filter dropdown
  const categories = Array.from(new Set(claims.map((c) => c.category).filter(Boolean)));

  const flaggedCount = claims.filter((c) => c.status === 'FlaggedForReview').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1280px' }}>
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1 className="admin-page-title">Flagged Equipment Claims Review</h1>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                backgroundColor: statusFilter === 'FlaggedForReview' ? '#fef2f2' : '#f1f5f9',
                color: statusFilter === 'FlaggedForReview' ? '#991b1b' : '#475569',
                border: `1px solid ${statusFilter === 'FlaggedForReview' ? '#fecaca' : '#cbd5e1'}`,
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              {statusFilter === 'FlaggedForReview' && <AlertTriangleIcon size={12} color="#dc2626" />}
              {claims.length} {statusFilter === 'FlaggedForReview' ? 'Flagged Claims' : 'Claims'}
            </span>
          </div>
          <p className="admin-page-subtitle">
            Review electrician material invoice line-items that exceed benchmark catalog variance thresholds. Approved claims validate invoice amounts without bypassing customer bill acceptance.
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={fetchClaims}
            disabled={loading}
            className="admin-btn admin-btn-secondary"
          >
            <RefreshCwIcon size={14} /> Refresh Queue
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          style={{
            padding: '0.65rem 1rem',
            borderRadius: '4px',
            fontSize: '0.8125rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: feedback.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${feedback.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            color: feedback.type === 'success' ? '#166534' : '#991b1b'
          }}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div style={{ padding: '0.65rem 1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', color: '#991b1b', fontSize: '0.8125rem' }}>
          {error}
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem' }}>
        <button
          type="button"
          onClick={() => setStatusFilter('FlaggedForReview')}
          className={`admin-btn admin-btn-sm ${statusFilter === 'FlaggedForReview' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
          style={{ position: 'relative' }}
        >
          Flagged For Review
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('AdminApproved')}
          className={`admin-btn admin-btn-sm ${statusFilter === 'AdminApproved' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
        >
          Admin Approved
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('AdminRejected')}
          className={`admin-btn admin-btn-sm ${statusFilter === 'AdminRejected' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
        >
          Admin Rejected
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('All')}
          className={`admin-btn admin-btn-sm ${statusFilter === 'All' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
        >
          All Claims
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="admin-toolbar" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '260px' }}>
          <div className="admin-search-box" style={{ flex: 1 }}>
            <span className="admin-search-icon">
              <SearchIcon size={14} />
            </span>
            <input
              type="text"
              placeholder="Search by equipment, job #, or technician..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-search-input"
            />
          </div>
          <button type="submit" className="admin-btn admin-btn-secondary">
            Search
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="admin-select"
            style={{ width: 'auto', minWidth: '150px' }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Claims Table */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>Claim</th>
              <th>Equipment Item</th>
              <th>Job & Technician</th>
              <th>Claimed Amount</th>
              <th>Benchmark & Variance</th>
              <th>Receipt</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Review Decision</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                  Loading flagged equipment claims...
                </td>
              </tr>
            ) : claims.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: '3.5rem', textAlign: 'center', color: '#94a3b8' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.35rem' }}>🛡️</div>
                  <p style={{ fontWeight: 600, color: '#64748b', margin: '0 0 0.25rem 0' }}>
                    {statusFilter === 'FlaggedForReview'
                      ? 'No Flagged Equipment Claims'
                      : 'No Claims Matching Criteria'}
                  </p>
                  <p style={{ fontSize: '0.75rem', margin: 0 }}>
                    {statusFilter === 'FlaggedForReview'
                      ? 'All submitted equipment invoice claims comply within benchmark catalog thresholds.'
                      : 'Try resetting filters or search keywords.'}
                  </p>
                </td>
              </tr>
            ) : (
              claims.map((claim) => {
                const variance = claim.variancePercentage || 0;
                const isOver = variance > 0;
                const threshold = claim.priceVarianceThreshold || 5.0;
                const isFlagged = claim.status === 'FlaggedForReview';

                return (
                  <tr key={claim.id}>
                    {/* Claim ID & Date */}
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.75rem' }}>
                        #{claim.id}
                      </div>
                      <span style={{ fontSize: '0.6875rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        {formatDateTime(claim.jobCreatedAt)}
                      </span>
                    </td>

                    {/* Equipment Item */}
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>
                        {claim.itemName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        <span style={{ backgroundColor: '#f1f5f9', padding: '0.1rem 0.35rem', borderRadius: '3px', fontWeight: 600, color: '#334155' }}>
                          {claim.category}
                        </span>
                        {' '}&bull; {claim.quantity} {claim.unit || 'units'}
                      </div>
                    </td>

                    {/* Job & Electrician */}
                    <td>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a' }}>
                        Job #{claim.jobId} &bull; {claim.jobType}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Tech: <strong style={{ color: '#334155' }}>{claim.electricianName}</strong>
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>
                        Customer: {claim.customerName}
                      </div>
                    </td>

                    {/* Claimed Amount */}
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem' }}>
                        {formatCurrency(claim.totalClaimedAmount)}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                        {claim.quantity} &times; {formatCurrency(claim.claimedPrice)}
                      </div>
                    </td>

                    {/* Benchmark & Variance */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.45rem',
                            borderRadius: '3px',
                            backgroundColor: isOver ? '#fee2e2' : '#fef3c7',
                            color: isOver ? '#991b1b' : '#92400e'
                          }}
                        >
                          {isOver ? `+${variance.toFixed(2)}%` : `${variance.toFixed(2)}%`}
                        </span>
                        <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                          (Allowed: &plusmn;{threshold}%)
                        </span>
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: '0.15rem' }}>
                        Catalog: {formatCurrency(claim.standardMarketPrice)}
                      </div>
                    </td>

                    {/* Receipt */}
                    <td>
                      {claim.receiptImageUrl ? (
                        <button
                          type="button"
                          onClick={() =>
                            setViewerState({
                              isOpen: true,
                              url: `/job/receipts/${encodeURIComponent(claim.receiptImageUrl)}`,
                              title: `Hardware Receipt - Claim #${claim.id}`
                            })
                          }
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                          style={{ fontSize: '0.6875rem', padding: '0.2rem 0.5rem' }}
                        >
                          <EyeIcon size={12} /> View Receipt
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>None Attached</span>
                      )}
                    </td>

                    {/* Status & Review Notes */}
                    <td>
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '12px',
                          display: 'inline-block',
                          backgroundColor:
                            claim.status === 'FlaggedForReview'
                              ? '#fef2f2'
                              : claim.status === 'AdminApproved'
                              ? '#ecfdf5'
                              : claim.status === 'AdminRejected'
                              ? '#fff1f2'
                              : '#f1f5f9',
                          color:
                            claim.status === 'FlaggedForReview'
                              ? '#991b1b'
                              : claim.status === 'AdminApproved'
                              ? '#065f46'
                              : claim.status === 'AdminRejected'
                              ? '#9f1239'
                              : '#475569',
                          border: `1px solid ${
                            claim.status === 'FlaggedForReview'
                              ? '#fecaca'
                              : claim.status === 'AdminApproved'
                              ? '#a7f3d0'
                              : claim.status === 'AdminRejected'
                              ? '#fecdd3'
                              : '#cbd5e1'
                          }`
                        }}
                      >
                        {claim.status === 'FlaggedForReview'
                          ? 'Flagged'
                          : claim.status === 'AdminApproved'
                          ? 'Approved'
                          : claim.status === 'AdminRejected'
                          ? 'Rejected'
                          : claim.status}
                      </span>

                      {claim.adminReviewNotes && (
                        <div
                          style={{
                            fontSize: '0.6875rem',
                            color: '#475569',
                            marginTop: '0.25rem',
                            maxWidth: '180px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={claim.adminReviewNotes}
                        >
                          Note: {claim.adminReviewNotes}
                        </div>
                      )}
                    </td>

                    {/* Review Actions */}
                    <td style={{ textAlign: 'right' }}>
                      {isFlagged ? (
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={() =>
                              setReviewModalState({ isOpen: true, action: 'approve', claim })
                            }
                            className="admin-btn admin-btn-primary admin-btn-sm"
                            title="Approve this claim"
                          >
                            <CheckIcon size={12} /> Approve
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setReviewModalState({ isOpen: true, action: 'reject', claim })
                            }
                            className="admin-btn admin-btn-danger admin-btn-sm"
                            title="Reject this claim with reason"
                          >
                            <XIcon size={12} /> Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>
                          {claim.reviewedAt ? `Reviewed ${formatDateTime(claim.reviewedAt)}` : 'Processed'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Review Action Modal (Approve / Reject) */}
      <ClaimReviewModal
        isOpen={reviewModalState.isOpen}
        action={reviewModalState.action}
        claim={reviewModalState.claim}
        onClose={() => setReviewModalState({ isOpen: false, action: 'approve', claim: null })}
        onConfirm={handleReviewConfirm}
        isSubmitting={isSubmitting}
      />

      {/* Document Viewer Modal for Hardware Receipts */}
      <DocumentViewer
        isOpen={viewerState.isOpen}
        onClose={() => setViewerState({ isOpen: false, url: null, title: '' })}
        title={viewerState.title}
        documentUrl={viewerState.url}
      />
    </div>
  );
};

export default FlaggedEquipmentClaims;
