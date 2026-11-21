import React, { useState } from 'react';
import Modal from '../common/Modal';

const SimulatorOverrideModal = ({ isOpen, onClose, onConfirm, technicianName, isSubmitting }) => {
  const [explanation, setExplanation] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!explanation || explanation.trim().length < 10) {
      setError('A mandatory justification of at least 10 characters is required for an administrator override.');
      return;
    }
    setError('');
    onConfirm(explanation.trim());
  };

  const handleClose = () => {
    setExplanation('');
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Simulator Assessment Override Approval">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ margin: 0, fontSize: '0.8125rem', color: '#475569', lineHeight: 1.5 }}>
          You are authorizing an <strong style={{ color: '#0f172a' }}>Administrator Override</strong> for{' '}
          <strong style={{ color: '#0f172a' }}>{technicianName || 'this technician'}</strong> who has not met the standard
          circuit simulator pass threshold.
        </p>

        <div
          style={{
            padding: '0.65rem 0.85rem',
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '4px',
            color: '#92400e',
            fontSize: '0.75rem'
          }}
        >
          ⚠️ This action will be permanently recorded in the immutable audit log under your Administrator ID.
        </div>

        <div className="admin-form-group">
          <label className="admin-label">
            Mandatory Justification / Explanation *
          </label>
          <textarea
            rows={4}
            value={explanation}
            onChange={(e) => {
              setExplanation(e.target.value);
              if (error) setError('');
            }}
            placeholder="e.g. Verified 15+ years industrial master electrician credentials via in-person practical assessment; TVEC accredited senior grade certificate inspected..."
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
          <span style={{ fontSize: '0.6875rem', color: '#94a3b8', alignSelf: 'flex-end' }}>
            Min 10 characters ({explanation.trim().length} entered)
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button
            type="button"
            onClick={handleClose}
            className="admin-btn admin-btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="admin-btn admin-btn-primary"
          >
            {isSubmitting ? 'Recording Override...' : 'Grant Override & Approve'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default SimulatorOverrideModal;

