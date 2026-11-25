import React from 'react';

const StatusBadge = ({ status }) => {
  const normStatus = (status || '').toLowerCase();

  const getConfig = () => {
    switch (normStatus) {
      case 'approved':
      case 'passed':
        return {
          bg: '#ecfdf5',
          border: '#a7f3d0',
          text: '#065f46',
          dot: '#10b981',
          label: status || 'Approved'
        };
      case 'assigned':
        return {
          bg: '#eff6ff',
          border: '#bfdbfe',
          text: '#1d4ed8',
          dot: '#3b82f6',
          label: status || 'Assigned'
        };
      case 'inprogress':
        return {
          bg: '#f0fdf4',
          border: '#bbf7d0',
          text: '#15803d',
          dot: '#22c55e',
          label: status || 'In Progress'
        };
      case 'completed':
        return {
          bg: '#f0fdfa',
          border: '#99f6e4',
          text: '#0f766e',
          dot: '#14b8a6',
          label: status || 'Completed'
        };
      case 'cancelled':
      case 'rejected':
      case 'failed':
        return {
          bg: '#fef2f2',
          border: '#fecaca',
          text: '#991b1b',
          dot: '#ef4444',
          label: status || 'Rejected'
        };
      case 'disputed':
        return {
          bg: '#fff1f2',
          border: '#fecdd3',
          text: '#be123c',
          dot: '#e11d48',
          label: status || 'Disputed'
        };
      case 'emergency':
        return {
          bg: '#fef2f2',
          border: '#f87171',
          text: '#b91c1c',
          dot: '#dc2626',
          label: status || 'Emergency'
        };
      case 'revoked':
        return {
          bg: '#fdf2f8',
          border: '#fbcfe8',
          text: '#9d174d',
          dot: '#be185d',
          label: 'Revoked'
        };
      case 'pending':
      default:
        return {
          bg: '#fffbeb',
          border: '#fde68a',
          text: '#92400e',
          dot: '#f59e0b',
          label: status || 'Pending'
        };
    }
  };

  const { bg, border, text, dot, label } = getConfig();

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.2rem 0.55rem',
        borderRadius: '4px',
        fontSize: '0.6875rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        backgroundColor: bg,
        border: `1px solid ${border}`,
        color: text,
        whiteSpace: 'nowrap'
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: dot,
          display: 'inline-block'
        }}
      />
      {label}
    </span>
  );
};

export default StatusBadge;
