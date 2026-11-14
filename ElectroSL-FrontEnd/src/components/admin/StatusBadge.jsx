import React from 'react';

const StatusBadge = ({ status }) => {
  const getBadgeStyle = () => {
    switch ((status || '').toLowerCase()) {
      case 'approved':
        return {
          bgClass: 'bg-green-100 text-green-800 border border-green-300',
          style: { backgroundColor: '#dcfce7', color: '#166534', borderColor: '#86efac' }
        };
      case 'rejected':
        return {
          bgClass: 'bg-red-100 text-red-800 border border-red-300',
          style: { backgroundColor: '#fee2e2', color: '#991b1b', borderColor: '#fca5a5' }
        };
      case 'pending':
      default:
        return {
          bgClass: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
          style: { backgroundColor: '#fef9c3', color: '#854d0e', borderColor: '#fde047' }
        };
    }
  };

  const { bgClass, style } = getBadgeStyle();

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider inline-block ${bgClass}`}
      style={{
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        border: '1px solid',
        ...style
      }}
    >
      {status || 'Unknown'}
    </span>
  );
};

export default StatusBadge;

