import React, { useState } from 'react';
import Modal from '../common/Modal';

const RejectionModal = ({ isOpen, onClose, onConfirm, technicianName, isSubmitting }) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason || reason.trim().length < 10) {
      setError('A specific rejection reason of at least 10 characters is required for the audit record.');
      return;
    }
    setError('');
    onConfirm(reason.trim());
  };

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Reject Technician Application">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ margin: 0, fontSize: '0.8125rem', color: '#475569', lineHeight: 1.5 }}>
          You are recording a rejection for applicant{' '}
          <strong style={{ color: '#0f172a' }}>{technicianName || 'this technician'}</strong>. The reason will be
          logged in the audit history.
        </p>

        <div className="admin-form-group">
          <label className="admin-label">
            Audit Reason for Rejection *
          </label>
          <textarea
            rows={4}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError('');
            }}
            placeholder="e.g. NVQ Level 4 certificate is blurred and unreadable; NIC document photo does not match..."
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
            Min 10 characters ({reason.trim().length} entered)
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
            className="admin-btn admin-btn-danger"
          >
            {isSubmitting ? 'Recording...' : 'Confirm Rejection'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default RejectionModal;
