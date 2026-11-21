import React, { useState } from 'react';
import { XIcon, ShieldAlertIcon } from './AdminIcons';

export default function SuspensionModal({ user, onClose, onConfirm, submitting }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!user) return null;

  const minLength = 10;
  const currentLength = reason.trim().length;
  const isValid = currentLength >= minLength;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) {
      setError(`A meaningful reason of at least ${minLength} characters is mandatory.`);
      return;
    }
    setError('');
    onConfirm(user, reason.trim());
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
          maxWidth: '520px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid #fee2e2'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #fecaca',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#fef2f2',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ color: '#dc2626' }}>
              <ShieldAlertIcon size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#991b1b', margin: 0 }}>
                Suspend User Account
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#b91c1c' }}>
                User #{user.userId} • {user.name} ({user.role})
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              background: 'none',
              border: 'none',
              color: '#991b1b',
              cursor: 'pointer',
              padding: '0.35rem',
              borderRadius: '4px'
            }}
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          <div
            style={{
              padding: '0.75rem',
              backgroundColor: '#fff1f2',
              border: '1px solid #ffe4e6',
              borderRadius: '6px',
              fontSize: '0.8125rem',
              color: '#9f1239',
              marginBottom: '1.25rem'
            }}
          >
            <strong>Operational Impact:</strong> Suspending this account will immediately revoke all active JWT sessions, prevent further logins, and automatically force this technician offline if applicable.
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label
              htmlFor="suspensionReason"
              style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}
            >
              Mandatory Explanation / Reason <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              id="suspensionReason"
              rows={4}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (e.target.value.trim().length >= minLength) setError('');
              }}
              placeholder="Detail the audit findings or compliance violations that justify account suspension..."
              disabled={submitting}
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem',
                fontSize: '0.8125rem',
                border: error ? '1px solid #ef4444' : '1px solid #cbd5e1',
                borderRadius: '6px',
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.35rem' }}>
              <span style={{ fontSize: '0.6875rem', color: error ? '#dc2626' : '#64748b' }}>
                {error || 'Minimum 10 characters required for regulatory audit trace.'}
              </span>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: currentLength >= minLength ? '#16a34a' : '#94a3b8'
                }}
              >
                {currentLength} / {minLength} chars
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="admin-btn admin-btn-secondary"
              style={{ fontSize: '0.8125rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || submitting}
              className="admin-btn admin-btn-danger"
              style={{
                fontSize: '0.8125rem',
                opacity: !isValid || submitting ? 0.6 : 1,
                cursor: !isValid || submitting ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? 'Suspending...' : 'Confirm Suspension'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

