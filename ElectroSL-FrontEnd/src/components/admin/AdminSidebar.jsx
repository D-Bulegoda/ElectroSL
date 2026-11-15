import React from 'react';
import { ADMIN_NAV_LINKS } from '../../utils/adminConstants';

const AdminSidebar = ({ activePath, onNavigate }) => {
  return (
    <aside
      style={{
        width: '260px',
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '2px 0 8px rgba(0,0,0,0.15)'
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: '1.5rem',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}
      >
        <span style={{ fontSize: '1.75rem' }}>⚡</span>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '0.025em', color: '#f8fafc' }}>
            Electro<span style={{ color: '#eab308' }}>SL</span>
          </h1>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Admin Portal
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <nav style={{ padding: '1rem 0.75rem', flex: 1 }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {ADMIN_NAV_LINKS.map((link) => {
            const isActive = activePath === link.path;
            return (
              <li key={link.path}>
                <a
                  href={link.path}
                  onClick={(e) => {
                    if (onNavigate) {
                      e.preventDefault();
                      onNavigate(link.path);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    color: isActive ? '#ffffff' : '#cbd5e1',
                    backgroundColor: isActive ? '#1e3a8a' : 'transparent',
                    fontWeight: isActive ? 600 : 500,
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = '#1e293b';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span style={{ fontSize: '1.15rem' }}>{link.icon}</span>
                  <span>{link.name}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer Info */}
      <div
        style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid #1e293b',
          fontSize: '0.75rem',
          color: '#64748b'
        }}
      >
        <p style={{ margin: 0 }}>ElectroSL Admin v1.0</p>
        <p style={{ margin: '0.25rem 0 0 0' }}>Operations & Approvals</p>
      </div>
    </aside>
  );
};

export default AdminSidebar;

