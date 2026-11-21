import React from 'react';

const StatsCard = ({ title, value, icon, subtitle, color = 'blue', onClick }) => {
  const getAccentBorder = () => {
    switch (color) {
      case 'yellow':
        return '#f59e0b';
      case 'green':
        return '#10b981';
      case 'red':
        return '#ef4444';
      case 'purple':
        return '#8b5cf6';
      case 'blue':
      default:
        return '#2563eb';
    }
  };

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderTop: `3px solid ${getAccentBorder()}`,
        borderRadius: '6px',
        padding: '1rem 1.25rem',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.08)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.04)';
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
        <span
          style={{
            fontSize: '0.6875rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#64748b'
          }}
        >
          {title}
        </span>
        {icon && (
          <span style={{ color: getAccentBorder(), display: 'flex', alignItems: 'center' }}>
            {icon}
          </span>
        )}
      </div>

      <div style={{ marginTop: '0.5rem' }}>
        <div
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#0f172a',
            letterSpacing: '-0.02em',
            lineHeight: 1.2
          }}
        >
          {value}
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: '0.75rem',
              color: '#64748b',
              marginTop: '0.25rem'
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
