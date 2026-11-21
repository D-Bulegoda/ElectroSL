import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { formatCurrency } from '../../utils/formattingHelpers';

const ClaimReviewModal = ({ isOpen, onClose, onConfirm, action, claim, isSubmitting }) => {
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const isApprove = action === 'approve';

  useEffect(() => {
    setNotes('');
    setError('');
  }, [isOpen, action, claim]);

  if (!isOpen || !claim) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isApprove) {
      if (!notes || notes.trim().length < 10) {
        setError('A specific rejection explanation of at least 10 characters is mandatory for the audit record.');
        return;
      }
    }
    setError('');
    onConfirm(notes.trim());
  };

  const handleClose = () => {
    setNotes('');
    setError('');
    onClose();
  };

  const basePrice = claim.standardMarketPrice || 0;
  const claimedPrice = claim.claimedPrice || 0;
  const variance = claim.variancePercentage || 0;
  const threshold = claim.priceVarianceThreshold || 5.0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isApprove ? 'Approve Flagged Equipment Claim' : 'Reject Flagged Equipment Claim'}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Claim Summary Card */}
        <div
          style={{
            padding: '0.75rem 0.85rem',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
            fontSize: '0.8125rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, color: '#0f172a' }}>
              Claim #{claim.id} &bull; Job #{claim.jobId}
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.15rem 0.5rem',
                borderRadius: '3px',
                backgroundColor: '#fee2e2',
                color: '#991b1b'
              }}
            >
              Variance: {variance > 0 ? `+${variance.toFixed(2)}%` : `${variance.toFixed(2)}%`} (Threshold: ±{threshold}%)
            </span>
          </div>

          <div style={{ color: '#334155' }}>
            <strong>Equipment:</strong> {claim.itemName} ({claim.quantity} {claim.unit || 'units'})
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.2rem', color: '#475569', fontSize: '0.75rem' }}>
            <div>
              Claimed: <strong style={{ color: '#0f172a' }}>{formatCurrency(claimedPrice)}</strong>
            </div>
            <div>
              Catalog Baseline: <strong style={{ color: '#0f172a' }}>{formatCurrency(basePrice)}</strong>
            </div>
            <div>
              Technician: <strong style={{ color: '#0f172a' }}>{claim.electricianName || `Electrician #${claim.electricianId}`}</strong>
            </div>
          </div>
        </div>

        {/* Action description */}
        <p style={{ margin: 0, fontSize: '0.8125rem', color: '#475569', lineHeight: 1.5 }}>
          {isApprove ? (
            <>
              Approving this claim will change its status to <strong style={{ color: '#047857' }}>AdminApproved</strong>,
              allowing the claimed price for this job invoice. This does not replace customer bill approval.
            </>
          ) : (
            <>
              Rejecting this claim will change its status to <strong style={{ color: '#b91c1c' }}>AdminRejected</strong>.
              A mandatory explanation must be provided for the technician and audit log.
            </>
          )}
        </p>

        {/* Notes / Reason field */}
        <div className="admin-form-group">
          <label className="admin-label">
            {isApprove ? 'Review Notes (Optional)' : 'Rejection Explanation *'}
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              if (error) setError('');
            }}
            placeholder={
              isApprove
                ? 'e.g. Verified genuine receipt from authorized hardware supplier; material specification matches job requirement...'
                : 'e.g. Claimed unit price of LKR 850 exceeds local retail price by 35% with unverified receipt; please resubmit with supplier invoice...'
            }
            className="admin-textarea"
            style={{
              borderColor: error ? '#ef4444' : '#cbd5e1'
            }}
          />
          {error && (
            <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem', marginBottom: 0 }}>
              {error}
            </p>
          )}
          {!isApprove && (
            <span style={{ fontSize: '0.6875rem', color: '#94a3b8', alignSelf: 'flex-end', marginTop: '0.15rem' }}>
              Min 10 characters ({notes.trim().length} entered)
            </span>
          )}
        </div>

        {/* Modal Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
          <button
            type="button"
            onClick={handleClose}
            className="admin-btn admin-btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`admin-btn ${isApprove ? 'admin-btn-primary' : 'admin-btn-danger'}`}
          >
            {isSubmitting
              ? 'Processing Decision...'
              : isApprove
              ? 'Approve Claim'
              : 'Reject Claim'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ClaimReviewModal;
