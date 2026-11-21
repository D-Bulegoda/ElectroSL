import React, { useState } from 'react';
import adminService from '../../services/adminService';
import { XIcon, ShieldAlertIcon, AlertTriangleIcon } from './AdminIcons';

export default function JobCancelModal({ job, onClose, onSuccess }) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [concurrencyError, setConcurrencyError] = useState(null);

  const hasPayment = !!job.payment;
  const isReasonValid = reason.trim().length >= 10;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (hasPayment) {
      setError('Cannot cancel: A payment transaction exists for this job. Administrative cancellation cannot modify financial ledgers automatically.');
      return;
    }

    if (!isReasonValid) {
      setError('A cancellation reason of at least 10 characters is mandatory.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setConcurrencyError(null);

      await adminService.cancelJob(job.jobId, {
        reason: reason.trim(),
        concurrencyVersion: job.concurrencyVersion
      });

      onSuccess(`Job #${job.jobId} cancelled successfully.`);
      onClose();
    } catch (err) {
      console.error('Failed to cancel job:', err);
      if (err.status === 409) {
        setConcurrencyError(err.message || 'Concurrency conflict: This job was updated by another process. Please refresh and review.');
      } else {
        setError(err.message || 'Failed to cancel job.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(11, 21, 40, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '1.5rem',
        backdropFilter: 'blur(2px)'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '540px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#fef2f2',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ShieldAlertIcon size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#991b1b', margin: 0 }}>
                Cancel Job Order
              </h2>
              <div style={{ fontSize: '0.75rem', color: '#7f1d1d' }}>
                Job #{job.jobId} &bull; Status: {job.status} &bull; Concurrency v{job.concurrencyVersion}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#991b1b',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '4px'
            }}
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
            {concurrencyError && (
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '6px',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  color: '#92400e',
                  fontSize: '0.8125rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.6rem'
                }}
              >
                <AlertTriangleIcon size={18} color="#b45309" />
                <div>
                  <div style={{ fontWeight: 600 }}>Concurrency Token Conflict</div>
                  <div>{concurrencyError}</div>
                  <div style={{ marginTop: '0.35rem', fontSize: '0.75rem' }}>
                    Please close this modal, refresh the job dossier, and retry with the updated state.
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '6px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  fontSize: '0.8125rem',
                  marginBottom: '1rem'
                }}
              >
                {error}
              </div>
            )}

            {/* Financial Safety Guard Notice */}
            {hasPayment ? (
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '6px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fca5a5',
                  color: '#991b1b',
                  fontSize: '0.8125rem',
                  marginBottom: '1.25rem',
                  lineHeight: 1.45
                }}
              >
                <strong>Financial Action Blocked:</strong> A recorded payment transaction of LKR {job.payment.totalAmount?.toLocaleString()} exists for this job. Administrative cancellation cannot automatically reverse, refund, or alter financial ledgers. This job must be settled or audited through financial management.
              </div>
            ) : (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '6px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: '#475569',
                  fontSize: '0.8125rem',
                  marginBottom: '1.25rem',
                  lineHeight: 1.45
                }}
              >
                <strong>Operational Warning:</strong> Administrative cancellation is non-reversible and applies strictly to Pending or Assigned jobs prior to execution. No financial refund or adjustment will be initiated.
              </div>
            )}

            {/* Mandatory Cancellation Reason */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
                  Cancellation Reason <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <span style={{ fontSize: '0.75rem', color: isReasonValid ? '#16a34a' : '#ef4444' }}>
                  {reason.trim().length}/10 characters minimum
                </span>
              </div>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={hasPayment}
                placeholder="State the detailed reason for cancellation (e.g. Customer cancelled appointment due to scheduling conflict)..."
                rows={3}
                maxLength={500}
                required
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  fontSize: '0.8125rem',
                  borderRadius: '6px',
                  border: `1px solid ${reason && !isReasonValid ? '#fca5a5' : '#cbd5e1'}`,
                  outline: 'none',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  backgroundColor: hasPayment ? '#f1f5f9' : '#ffffff'
                }}
              />
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                The cancellation reason and timestamp will be permanently attached to the job record.
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              backgroundColor: '#f8fafc',
              borderBottomLeftRadius: '8px',
              borderBottomRightRadius: '8px'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#64748b',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              Close
            </button>
            <button
              type="submit"
              disabled={submitting || hasPayment || !isReasonValid || !!concurrencyError}
              style={{
                padding: '0.5rem 1.25rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#ffffff',
                backgroundColor: submitting || hasPayment || !isReasonValid || !!concurrencyError ? '#94a3b8' : '#dc2626',
                border: 'none',
                borderRadius: '6px',
                cursor: submitting || hasPayment || !isReasonValid || !!concurrencyError ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              {submitting ? 'Cancelling...' : 'Confirm Job Cancellation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
