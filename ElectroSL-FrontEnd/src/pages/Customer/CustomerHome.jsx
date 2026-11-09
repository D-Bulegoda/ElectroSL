
import React from 'react';
import { Link } from 'react-router-dom';

function CustomerHome() {
  const menuItems = [
    { name: 'Dashboard', path: '/customer/home', icon: '⌂' },
    { name: 'Post New Job', path: '/customer/post-job', icon: '+' },
    { name: 'My Bids', path: '/customer/bids', icon: '▤' },
    { name: 'Live Tracking', path: '/customer/tracking', icon: '⌖' },
    { name: 'Equipment Bills', path: '/customer/equipment-bill', icon: '▣' },
    { name: 'Payments', path: '/customer/payment', icon: '₨' },
    { name: 'My Reviews', path: '/customer/review', icon: '☆' },
  ];

  const stats = [
    { title: 'Total Jobs', value: '05', icon: '▤' },
    { title: 'Active Jobs', value: '02', icon: '⚡' },
    { title: 'Pending Bids', value: '03', icon: '◷' },
    { title: 'Completed Jobs', value: '03', icon: '✓' },
  ];

  return (
    <div className="customer-layout">

      {/* Sidebar */}
      <aside className="customer-sidebar">
        <div className="brand">
          <span className="brand-icon">⚡</span>
          <span>ElectroSL</span>
        </div>

        <p className="sidebar-label">CUSTOMER MENU</p>

        <nav className="sidebar-nav">
          {menuItems.map((item, index) => (
            <Link
              to={item.path}
              key={item.path}
              className={`sidebar-link ${index === 0 ? 'active' : ''}`}
            >
              <span className="menu-icon">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="sidebar-emergency">
          <p>Need urgent help?</p>
          <Link to="/customer/emergency">
            Emergency SOS
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="customer-main">

        <header className="customer-header">
          <div>
            <h2>Customer Dashboard</h2>
            <p>Manage your electrical services in one place.</p>
          </div>

          <div className="customer-profile">
            <div className="profile-avatar">C</div>
            <div>
              <strong>Customer</strong>
              <small>Customer Account</small>
            </div>
          </div>
        </header>

        <section className="welcome-banner">
          <div>
            <p className="welcome-small">WELCOME TO ELECTROSL</p>
            <h1>Hello, Welcome Back!</h1>
            <p>Find trusted electricians and manage your service requests easily.</p>
            <Link to="/customer/post-job" className="welcome-button">
              + Post a New Job
            </Link>
          </div>
          <div className="welcome-icon">⚡</div>
        </section>

        {/* Summary Cards */}
        <section className="stats-grid">
          {stats.map((stat) => (
            <div className="stat-card" key={stat.title}>
              <div className="stat-icon">{stat.icon}</div>
              <div>
                <p>{stat.title}</p>
                <h2>{stat.value}</h2>
              </div>
            </div>
          ))}
        </section>

        {/* Quick Actions */}
        <section className="dashboard-section">
          <div className="section-heading">
            <h2>Quick Actions</h2>
            <p>Access your most-used services.</p>
          </div>

          <div className="quick-actions-grid">
            <Link to="/customer/post-job" className="action-card">
              <span>＋</span>
              <strong>Post New Job</strong>
              <small>Request an electrician</small>
            </Link>

            <Link to="/customer/bids" className="action-card">
              <span>▤</span>
              <strong>View Bids</strong>
              <small>Compare quotations</small>
            </Link>

            <Link to="/customer/tracking" className="action-card">
              <span>⌖</span>
              <strong>Track Job</strong>
              <small>Check job progress</small>
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
            <h2>Recent Job Activity</h2>
            <p>Your latest service requests.</p>
          </div>

          <div className="recent-job-card">
            <div>
              <strong>Electrical Wiring Repair</strong>
              <p>Sample job • Colombo</p>
            </div>
            <span className="status-badge pending">Pending</span>
          </div>

          <div className="recent-job-card">
            <div>
              <strong>Ceiling Fan Installation</strong>
              <p>Sample job • Kandy</p>
            </div>
            <span className="status-badge ongoing">In Progress</span>
          </div>

          <div className="recent-job-card">
            <div>
              <strong>Light Replacement</strong>
              <p>Sample job • Gampaha</p>
            </div>
            <span className="status-badge completed">Completed</span>
          </div>
        </section>

        <footer className="customer-footer">
          © 2026 ElectroSL. All rights reserved.
        </footer>

      </main>
    </div>
  );
}

export default CustomerHome;
