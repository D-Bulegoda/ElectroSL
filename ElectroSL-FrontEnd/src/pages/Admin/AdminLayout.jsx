import React, { useContext } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { AuthContext } from '../../context/AuthContext';
import './admin.css';

const AdminLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = () => {
    logout();
    navigate('/admin-portal/login');
  };

  const getSectionTitle = () => {
    const p = location.pathname;
    if (p.includes('/admin/jobs')) return 'Job Operations & Dispatch';
    if (p.includes('/admin/users')) return 'User Directory & Account Controls';
    if (p.includes('/admin/technicians') || p.includes('/admin/approvals') || p.includes('/admin/approved') || p.includes('/admin/rejected') || p.includes('/admin/applications/')) {
      return 'Technician Workforce & Accreditation';
    }
    if (p.includes('/admin/equipment') || p.includes('/admin/catalog') || p.includes('/admin/equipment-claims')) {
      return 'Equipment Catalog & Price Claims';
    }
    if (p.includes('/admin/finance') || p.includes('/admin/financial')) return 'Financial Operations & Wallet Management';
    if (p.includes('/admin/audit-logs')) return 'Administrative Audit Trail';
    if (p.includes('/admin/reports')) return 'Administrative Reports & Data Export';
    return 'Operations Dashboard';
  };

  const userInitials = (user?.name || user?.email || 'AD')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="admin-workspace-root" style={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, backgroundColor: '#f8fafc' }}>
        {/* Top Operational Header */}
        <header
          style={{
            height: '56px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1.75rem',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
            zIndex: 10
          }}
        >
          {/* Breadcrumb / Section Context */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
            <span style={{ color: '#64748b' }}>Operations</span>
            <span style={{ color: '#cbd5e1' }}>/</span>
            <span style={{ color: '#0f172a', fontWeight: 600 }}>{getSectionTitle()}</span>
          </div>

          {/* Profile & Session Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                border: '1px solid #f1f5f9'
              }}
            >
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  backgroundColor: '#0b1528',
                  color: '#ffffff',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {userInitials}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1e293b' }}>
                  {user?.name || user?.email || 'Administrator'}
                </span>
                <span style={{ fontSize: '0.625rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  System Admin
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.35rem 0.75rem',
                backgroundColor: '#ffffff',
                color: '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fef2f2';
                e.currentTarget.style.color = '#b91c1c';
                e.currentTarget.style.borderColor = '#fca5a5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.color = '#475569';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }}
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Workspace Body */}
        <main style={{ flex: 1, padding: '1.75rem 2rem', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
