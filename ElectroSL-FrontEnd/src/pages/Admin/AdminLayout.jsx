import React from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';

const AdminLayout = ({ children, activePath, onNavigate }) => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f1f5f9' }}>
      <AdminSidebar activePath={activePath} onNavigate={onNavigate} />
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Navbar */}
        <header
          style={{
            height: '64px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 2rem',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          }}
        >
          <div>
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Operations Management</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>
              👤 Administrator
            </span>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('jwt');
                window.location.href = '/login';
              }}
              style={{
                fontSize: '0.75rem',
                padding: '0.35rem 0.75rem',
                backgroundColor: '#fee2e2',
                color: '#991b1b',
                border: '1px solid #fecaca',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

