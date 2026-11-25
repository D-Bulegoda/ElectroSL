import React from 'react';
import { Link } from 'react-router-dom';
import { getAuthSession } from '../../services/authService';

export default function CustomerHome() {
  const session = getAuthSession();
  const customerName = session?.user?.name || 'Welcome Back';

  return (
    <div className="customer-layout">
      {/* Left Sidebar */}
      <aside className="customer-sidebar">
        <Link to="/" className="brand" style={{ color: 'white', textDecoration: 'none' }}>
          <span className="brand-icon">⚡</span>
          <span>ElectroSL</span>
        </Link>

        <p className="sidebar-label">CUSTOMER MENU</p>

        <nav className="sidebar-nav">
          <Link to="/" className="sidebar-link">
            <span className="menu-icon">🏠</span>
            <span>Back to Home</span>
          </Link>

          <Link to="/customer/home" className="sidebar-link active">
            <span className="menu-icon">⌂</span>
            <span>Dashboard</span>
          </Link>

          <Link to="/customer/post-job" className="sidebar-link">
            <span className="menu-icon">+</span>
            <span>Post New Job</span>
          </Link>

          <Link to="/customer/tracking" className="sidebar-link">
            <span className="menu-icon">⌖</span>
            <span>Live Tracking</span>
          </Link>

          <Link to="/customer/equipment-bill" className="sidebar-link">
            <span className="menu-icon">🧾</span>
            <span>Equipment Bills</span>
          </Link>

          <Link to="/customer/payment" className="sidebar-link">
            <span className="menu-icon">Rs</span>
            <span>Payments</span>
          </Link>

          <Link to="/customer/review" className="sidebar-link">
            <span className="menu-icon">☆</span>
            <span>My Reviews</span>
          </Link>
        </nav>

        <div className="sidebar-emergency">
          <p>Urgent power failure or electrical hazard?</p>
          <Link to="/customer/emergency">🚨 Emergency SOS</Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="customer-main">
        <div className="customer-header">
          <div>
            <h2>Customer Dashboard</h2>
            <p>Manage your electrical services in one place.</p>
          </div>

          <Link
            to="/"
            className="secondary-button"
            style={{ marginRight: '175px', padding: '9px 16px', fontSize: '13px' }}
          >
            ← Back to Home
          </Link>
        </div>

        {/* Welcome Banner */}
        <div className="welcome-banner">
          <div>
            <span className="welcome-small">WELCOME TO ELECTROSL</span>
            <h1>Hello, {customerName}!</h1>
            <p>
              Post your electrical job request and a nearby certified electrician will accept and attend.
            </p>
            <Link to="/customer/post-job" className="welcome-button">
              + Post a New Job
            </Link>
          </div>
          <div className="welcome-icon">⚡</div>
        </div>

        {/* Statistics */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div>
              <p>Total Jobs</p>
              <h2>05</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⚡</div>
            <div>
              <p>Active Jobs</p>
              <h2>02</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🕒</div>
            <div>
              <p>Open Requests</p>
              <h2>01</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✓</div>
            <div>
              <p>Completed Jobs</p>
              <h2>02</h2>
            </div>
          </div>
        </div>

        {/* Quick Actions (Quotations removed) */}
        <section className="dashboard-section">
          <div className="section-heading">
            <h2>Quick Actions</h2>
            <p>Access your most-used services.</p>
          </div>

          <div className="quick-actions-grid">
            <Link to="/customer/post-job" className="action-card">
              <span>+</span>
              <strong>Post New Job</strong>
              <small>Request a certified electrician</small>
            </Link>

            <Link to="/customer/tracking" className="action-card">
              <span>⌖</span>
              <strong>Live Tracking</strong>
              <small>Check electrician arrival &amp; progress</small>
            </Link>

            <Link to="/customer/equipment-bill" className="action-card">
              <span>🧾</span>
              <strong>Equipment Bills</strong>
              <small>Review &amp; approve material items</small>
            </Link>

            <Link to="/customer/emergency" className="action-card emergency-card">
              <span>!</span>
              <strong>Emergency SOS</strong>
              <small>Request urgent assistance</small>
            </Link>
          </div>
        </section>

        {/* Recent Jobs */}
        <section className="dashboard-section">
          <div className="section-heading">
            <h2>Recent Service Requests</h2>
            <p>Track the status of your recent jobs.</p>
          </div>

          <div className="recent-job-card">
            <div>
              <strong>Ceiling Fan Repair &amp; Regulator Replacement</strong>
              <p>Dispatched to nearby verified electricians</p>
            </div>
            <span className="status-badge ongoing">Accepted</span>
          </div>

          <div className="recent-job-card">
            <div>
              <strong>Main Distribution Board Inspection</strong>
              <p>Completed with OTP verification</p>
            </div>
            <span className="status-badge completed">Completed</span>
          </div>
        </section>

        <footer className="customer-footer">
          © {new Date().getFullYear()} ElectroSL • Certified Electrical Service Platform
        </footer>
      </main>
    </div>
  );
}