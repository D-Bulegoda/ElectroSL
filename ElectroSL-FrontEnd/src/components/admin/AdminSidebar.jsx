import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  DashboardIcon,
  ClipboardCheckIcon,
  UsersCheckIcon,
  UserXIcon,
  TagIcon,
  ZapIcon,
  ShieldAlertIcon,
  BriefcaseIcon
} from './AdminIcons';

const AdminSidebar = () => {
  const location = useLocation();

  const navigationSections = [
    {
      group: 'Operations & Compliance',
      links: [
        { name: 'Dashboard', path: '/admin/dashboard', alias: '/admin', icon: <DashboardIcon size={16} /> },
        { name: 'User Management', path: '/admin/users', icon: <UsersCheckIcon size={16} /> },
        { name: 'Job Dispatch', path: '/admin/jobs', icon: <BriefcaseIcon size={16} /> },
        { name: 'Pending Approvals', path: '/admin/approvals', icon: <ClipboardCheckIcon size={16} /> },
        { name: 'Approved Directory', path: '/admin/approved', icon: <UsersCheckIcon size={16} /> },
        { name: 'Rejected Applications', path: '/admin/rejected', icon: <UserXIcon size={16} /> },
      ]
    },
    {
      group: 'Marketplace Controls',
      links: [
        { name: 'Equipment Catalog', path: '/admin/catalog', icon: <TagIcon size={16} /> },
        { name: 'Flagged Price Claims', path: '/admin/equipment-claims', icon: <ShieldAlertIcon size={16} /> }
      ]
    }
  ];

  return (
    <aside
      style={{
        width: '240px',
        minWidth: '240px',
        backgroundColor: '#0b1528',
        color: '#94a3b8',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #1e293b'
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          height: '56px',
          padding: '0 1.25rem',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem'
        }}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '4px',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <ZapIcon size={16} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.01em' }}>
              Electro<span style={{ color: '#38bdf8' }}>SL</span>
            </span>
            <span
              style={{
                fontSize: '0.5625rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                backgroundColor: 'rgba(37, 99, 235, 0.25)',
                color: '#60a5fa',
                padding: '0.1rem 0.35rem',
                borderRadius: '3px'
              }}
            >
              OPS
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav style={{ padding: '1rem 0.6rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {navigationSections.map((section) => (
          <div key={section.group}>
            <div
              style={{
                fontSize: '0.625rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#64748b',
                padding: '0 0.65rem 0.4rem 0.65rem'
              }}
            >
              {section.group}
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              {section.links.map((link) => {
                const isItemActive =
                  location.pathname === link.path ||
                  (link.alias && location.pathname === link.alias);

                return (
                  <li key={link.path}>
                    <NavLink
                      to={link.path}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '4px',
                        color: isItemActive ? '#ffffff' : '#94a3b8',
                        backgroundColor: isItemActive ? 'rgba(37, 99, 235, 0.16)' : 'transparent',
                        borderLeft: isItemActive ? '3px solid #38bdf8' : '3px solid transparent',
                        fontWeight: isItemActive ? 600 : 500,
                        textDecoration: 'none',
                        fontSize: '0.8125rem',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!isItemActive) {
                          e.currentTarget.style.backgroundColor = '#13233e';
                          e.currentTarget.style.color = '#f1f5f9';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isItemActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#94a3b8';
                        }
                      }}
                    >
                      <span style={{ color: isItemActive ? '#38bdf8' : '#64748b', display: 'flex' }}>
                        {link.icon}
                      </span>
                      <span>{link.name}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer System Status */}
      <div
        style={{
          padding: '0.85rem 1rem',
          borderTop: '1px solid #1e293b',
          fontSize: '0.6875rem',
          color: '#64748b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              display: 'inline-block'
            }}
          />
          <span>System Active</span>
        </div>
        <span>v1.0-prod</span>
      </div>
    </aside>
  );
};

export default AdminSidebar;
