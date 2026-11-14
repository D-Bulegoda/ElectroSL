import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';

const RejectionModal = ({ isOpen, onClose, onConfirm, technicianName, isSubmitting }) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason || reason.trim().length < 10) {
      setError('Please provide a specific rejection reason of at least 10 characters.');
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
    <Modal isOpen={isOpen} onClose={handleClose} title="Reject Application">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#4b5563' }}>
          You are rejecting the technician application for{' '}
          <strong style={{ color: '#111827' }}>{technicianName || 'this technician'}</strong>.
        </p>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>
            Reason for Rejection *
          </label>
          <textarea
            rows={4}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError('');
            }}
            placeholder="e.g. NVQ Level 4 certificate is expired or unreadable; NIC photo is blurred..."
            style={{
              width: '100%',
              padding: '0.6rem',
              borderRadius: '0.375rem',
              border: error ? '1px solid #ef4444' : '1px solid #d1d5db',
              fontSize: '0.875rem',
              fontFamily: 'inherit',
              boxSizing: 'border-box'
            }}
          />
          {error && (
            <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem', marginBottom: 0 }}>
              {error}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button
            type="button"
            onClick={handleClose}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              borderRadius: '0.375rem',
              border: '1px solid #d1d5db',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              borderRadius: '0.375rem',
              border: 'none',
              fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default RejectionModal;

