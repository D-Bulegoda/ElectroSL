import React, { useState } from 'react';
import adminService from '../../services/adminService';
import { XIcon, ShieldAlertIcon, AlertTriangleIcon } from './AdminIcons';

export default function JobDisputeModal({ job, onClose, onSuccess }) {
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [concurrencyError, setConcurrencyError] = useState(null);

  const isNotesValid = resolutionNotes.trim().length >= 10;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isNotesValid) {
      setError('A resolution explanation of at least 10 characters is mandatory.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setConcurrencyError(null);

      await adminService.resolveJobDispute(job.jobId, {
        resolutionNotes: resolutionNotes.trim(),
        concurrencyVersion: job.concurrencyVersion
      });

      onSuccess(`Dispute for Job #${job.jobId} resolved successfully.`);
      onClose();
    } catch (err) {
      console.error('Failed to resolve dispute:', err);
      if (err.status === 409) {
        setConcurrencyError(err.message || 'Concurrency conflict: This job was updated by another process. Please refresh and review.');
      } else {
        setError(err.message || 'Failed to resolve dispute.');
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
          maxWidth: '560px',
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
            backgroundColor: '#fff1f2',
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
                backgroundColor: '#ffe4e6',
                color: '#e11d48',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ShieldAlertIcon size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#9f1239', margin: 0 }}>
                Mediate & Resolve Dispute
              </h2>
              <div style={{ fontSize: '0.75rem', color: '#be123c' }}>
                Job #{job.jobId} &bull; Concurrency v{job.concurrencyVersion}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#9f1239',
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

            {/* Existing Dispute Reason */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                Customer / Operational Dispute Reason
              </label>
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '6px',
                  backgroundColor: '#fff1f2',
                  border: '1px solid #fecdd3',
                  color: '#881337',
                  fontSize: '0.8125rem',
                  lineHeight: 1.45
                }}
              >
                {job.disputeReason || 'No specific customer dispute details recorded.'}
              </div>
            </div>

            {/* Dispute Policy Guidance */}
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
              <strong>Audit Policy:</strong> Resolving this dispute records official resolution notes and timestamp. Per operational policy, the job status remains <code>Disputed</code> to preserve historical dispute auditability.
            </div>

            {/* Mandatory Resolution Notes */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
                  Resolution Findings & Mediation Notes <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <span style={{ fontSize: '0.75rem', color: isNotesValid ? '#16a34a' : '#ef4444' }}>
                  {resolutionNotes.trim().length}/10 characters minimum
                </span>
              </div>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Detail the mediation outcome and agreed corrective actions (e.g. Mediated agreement: customer agreed to catalog baseline price adjustments)..."
                rows={4}
                maxLength={1000}
                required
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  fontSize: '0.8125rem',
                  borderRadius: '6px',
                  border: `1px solid ${resolutionNotes && !isNotesValid ? '#fca5a5' : '#cbd5e1'}`,
                  outline: 'none',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                Resolution notes will be permanently archived on the job dossier.
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !isNotesValid || !!concurrencyError}
              style={{
                padding: '0.5rem 1.25rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#ffffff',
                backgroundColor: submitting || !isNotesValid || !!concurrencyError ? '#94a3b8' : '#e11d48',
                border: 'none',
                borderRadius: '6px',
                cursor: submitting || !isNotesValid || !!concurrencyError ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              {submitting ? 'Recording...' : 'Record Dispute Resolution'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
