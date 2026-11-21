import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  DashboardIcon,
  BriefcaseIcon,
  UsersCheckIcon,
  ClipboardCheckIcon,
  TagIcon,
  CreditCardIcon,
  FileTextIcon,
  HistoryIcon,
  ZapIcon
} from './AdminIcons';

const AdminSidebar = () => {
  const location = useLocation();

  // 1. Primary Navigation Items (strictly simplified to the core 7)
  const primaryLinks = [
    {
      name: 'Dashboard',
      path: '/admin/dashboard',
      aliases: ['/admin'],
      icon: <DashboardIcon size={16} />
    },
    {
      name: 'Jobs',
      path: '/admin/jobs',
      aliases: [],
      icon: <BriefcaseIcon size={16} />
    },
    {
      name: 'Users',
      path: '/admin/users',
      aliases: [],
      icon: <UsersCheckIcon size={16} />
    },
    {
      name: 'Technicians',
      path: '/admin/technicians',
      aliases: ['/admin/approvals', '/admin/approved', '/admin/rejected'],
      icon: <ClipboardCheckIcon size={16} />
    },
    {
      name: 'Equipment',
      path: '/admin/equipment',
      aliases: ['/admin/catalog', '/admin/equipment-claims'],
      icon: <TagIcon size={16} />
    },
    {
      name: 'Finance',
      path: '/admin/finance',
      aliases: ['/admin/financial'],
      icon: <CreditCardIcon size={16} />
    },
    {
      name: 'Reports',
      path: '/admin/reports',
      aliases: [],
      icon: <FileTextIcon size={16} />
    }
  ];

  // 2. Secondary Administration & System Area
  const administrationLinks = [
    {
      name: 'Audit Logs',
      path: '/admin/audit-logs',
      aliases: [],
      icon: <HistoryIcon size={16} />
    }
  ];

  const renderNavList = (links) => (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      {links.map((link) => {
        const isActive =
          location.pathname === link.path ||
          (link.aliases && link.aliases.some((alias) => location.pathname === alias || location.pathname.startsWith(alias + '/')));

        return (
          <li key={link.path}>
            <NavLink
              to={link.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.55rem 0.85rem',
                borderRadius: '6px',
                color: isActive ? '#ffffff' : '#94a3b8',
                backgroundColor: isActive ? 'rgba(37, 99, 235, 0.18)' : 'transparent',
                borderLeft: isActive ? '3px solid #38bdf8' : '3px solid transparent',
                fontWeight: isActive ? 600 : 500,
                textDecoration: 'none',
                fontSize: '0.835rem',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#13233e';
                  e.currentTarget.style.color = '#f1f5f9';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#94a3b8';
                }
              }}
            >
              <span style={{ color: isActive ? '#38bdf8' : '#64748b', display: 'flex' }}>
                {link.icon}
              </span>
              <span>{link.name}</span>
            </NavLink>
          </li>
        );
      })}
    </ul>
  );

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
          gap: '0.65rem'
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
            ADMIN
          </span>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav style={{ padding: '1.25rem 0.65rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {/* Primary Operational Section */}
        <div>
          <div
            style={{
              fontSize: '0.625rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#64748b',
              padding: '0 0.75rem 0.5rem 0.75rem'
            }}
          >
            Main Navigation
          </div>
          {renderNavList(primaryLinks)}
        </div>

        {/* Secondary Administration Section */}
        <div>
          <div
            style={{
              fontSize: '0.625rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#64748b',
              padding: '0 0.75rem 0.5rem 0.75rem'
            }}
          >
            Administration
          </div>
          {renderNavList(administrationLinks)}
        </div>
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
        <span>ElectroSL Admin</span>
      </div>
    </aside>
  );
};

export default AdminSidebar;
