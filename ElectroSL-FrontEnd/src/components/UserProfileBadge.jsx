import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAuthSession, logoutUser } from '../services/authService';
import './UserProfileBadge.css';

function UserProfileBadge() {
  const [session, setSession] = useState(() => getAuthSession());
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const syncSession = () => {
      setSession(getAuthSession());
    };

    syncSession();
    window.addEventListener('electrosl-auth-change', syncSession);
    window.addEventListener('storage', syncSession);

    return () => {
      window.removeEventListener('electrosl-auth-change', syncSession);
      window.removeEventListener('storage', syncSession);
    };
  }, [location.pathname]);

  useEffect(() => {
    const isAuthPage = [
      '/login',
      '/signup',
      '/customer/signup',
      '/electrician/signup',
      '/signup-electrician',
      '/admin-portal/login',
    ].includes(location.pathname);

    const isVisible = Boolean(session?.token && session?.user && !isAuthPage);
    document.body.classList.toggle('has-user-badge', isVisible);

    return () => {
      document.body.classList.remove('has-user-badge');
    };
  }, [session, location.pathname]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const hideOnAuthRoutes = [
    '/login',
    '/signup',
    '/customer/signup',
    '/electrician/signup',
    '/signup-electrician',
    '/admin-portal/login',
  ].includes(location.pathname);

  if (!session?.token || !session?.user || hideOnAuthRoutes) {
    return null;
  }

  const { user } = session;
  const role = session.role || user.role || 'Customer';
  const roleKey = role.toLowerCase();
  const displayName = user.name || 'ElectroSL User';

  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'U';

  const goTo = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    setMenuOpen(false);
    logoutUser();
    navigate(roleKey === 'admin' ? '/admin-portal/login' : '/');
  };

  return (
    <div className="user-badge-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className={`user-badge-pill role-${roleKey}`}
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-expanded={menuOpen}
      >
        <span className="user-badge-avatar">{initials}</span>

        <span className="user-badge-info">
          <span className="user-badge-name">{displayName}</span>
          <span className="user-badge-role">{role}</span>
        </span>

        <span className={`user-badge-chevron ${menuOpen ? 'open' : ''}`}>▾</span>
      </button>

      {menuOpen && (
        <div className="user-badge-menu">
          <div className="user-badge-menu-header">
            <div className="user-badge-menu-top">
              <strong>{displayName}</strong>
              <span className={`user-badge-tag role-${roleKey}`}>{role}</span>
            </div>
            {user.email && <span className="user-badge-email">{user.email}</span>}
            {user.permanentDistrict && (
              <small className="user-badge-location">📍 {user.permanentDistrict}</small>
            )}
          </div>

          <div className="user-badge-menu-links">
            {roleKey === 'customer' && (
              <>
                <button type="button" onClick={() => goTo('/customer/home')}>
                  Customer Dashboard
                </button>
                <button type="button" onClick={() => goTo('/customer/post-job')}>
                  + Post New Job
                </button>
                <button type="button" onClick={() => goTo('/customer/tracking')}>
                  Live Job Tracking
                </button>
              </>
            )}

            {roleKey === 'electrician' && (
              <>
                <button type="button" onClick={() => goTo('/electrician/dashboard')}>
                  Electrician Dashboard
                </button>
                <button type="button" onClick={() => goTo('/electrician/jobs')}>
                  Incoming Job Requests
                </button>
                <button type="button" onClick={() => goTo('/electrician/availability')}>
                  Availability & GPS
                </button>
                <button type="button" onClick={() => goTo('/electrician/wallet')}>
                  Wallet & Earnings
                </button>
              </>
            )}

            {roleKey === 'admin' && (
              <>
                <button type="button" onClick={() => goTo('/admin/dashboard')}>
                  Admin Dashboard
                </button>
                <button type="button" onClick={() => goTo('/admin/technicians')}>
                  Manage Electricians
                </button>
                <button type="button" onClick={() => goTo('/admin/jobs')}>
                  Manage Jobs
                </button>
              </>
            )}

            <button type="button" onClick={() => goTo('/')}>
              Home Page
            </button>
          </div>

          <button
            type="button"
            className="user-badge-logout"
            onClick={handleLogout}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

export default UserProfileBadge;