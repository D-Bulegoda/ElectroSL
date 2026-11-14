import React from 'react';

const StatsCard = ({ title, value, icon, color = 'blue', subtitle }) => {
  const getColorStyles = () => {
    switch (color) {
      case 'green':
        return { borderLeft: '4px solid #16a34a', bgIcon: '#dcfce7', textIcon: '#16a34a' };
      case 'yellow':
        return { borderLeft: '4px solid #ca8a04', bgIcon: '#fef9c3', textIcon: '#ca8a04' };
      case 'red':
        return { borderLeft: '4px solid #dc2626', bgIcon: '#fee2e2', textIcon: '#dc2626' };
      case 'purple':
        return { borderLeft: '4px solid #9333ea', bgIcon: '#f3e8ff', textIcon: '#9333ea' };
      case 'blue':
      default:
        return { borderLeft: '4px solid #2563eb', bgIcon: '#dbeafe', textIcon: '#2563eb' };
    }
  };

  const colorStyle = getColorStyles();

  return (
    <div
      className="bg-white rounded-lg shadow p-5 flex items-center justify-between"
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        padding: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...colorStyle
      }}
    >
      <div>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: 500, margin: 0 }}>
          {title}
        </p>
        <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', margin: '0.25rem 0 0 0' }}>
          {value}
        </p>
        {subtitle && (
          <p style={{ color: '#9ca3af', fontSize: '0.75rem', margin: '0.25rem 0 0 0' }}>
            {subtitle}
          </p>
        )}
      </div>
      {icon && (
        <div
          style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '9999px',
            backgroundColor: colorStyle.bgIcon,
            color: colorStyle.textIcon,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem'
          }}
        >
          {icon}
        </div>
      )}
    </div>
  );
};

export default StatsCard;

