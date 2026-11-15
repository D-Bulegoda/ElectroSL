import React from 'react';
import { NavLink } from 'react-router-dom';

export default function ElectricianDashboard() {
  return (
    <div className="electrician-layout">

      {/* Sidebar */}
      <aside className="electrician-sidebar">

        <h2 className="sidebar-logo">Electro<span>SL</span></h2>

        <p className="sidebar-label">MAIN MENU</p>

        <nav className="sidebar-nav">
          <NavLink to="/electrician/dashboard" className="nav-item">
            🏠 Dashboard
          </NavLink>

          <NavLink to="/electrician/jobs" className="nav-item">
            📋 Job Requests
          </NavLink>

          <NavLink to="/electrician/quotation" className="nav-item">💰 Submit Quotation</NavLink>

          <NavLink to="/electrician/active-jobs" className="nav-item">🔧 Active Jobs</NavLink>

          <NavLink to="/electrician/equipment" className="nav-item">🧰 Equipment List</NavLink>

          <NavLink to="/electrician/availability" className="nav-item">
            🟢 My Availability
          </NavLink>

          

          <NavLink to="/electrician/portfolio" className="nav-item">
            🖼️ My Portfolio
          </NavLink>

          <NavLink to="/electrician/wallet" className="nav-item">
            💰 Wallet & Earnings
          </NavLink>
        </nav>

        <div className="sidebar-bottom">
          <p>ElectroSL Electrician Portal</p>
          <span>Version 1.0</span>
        </div>

      </aside>

      {/* Main Dashboard */}
      <main className="electrician-main">

        <header className="dashboard-header">
          <div>
            <h1>Dashboard</h1>
            <p>Welcome back! Here's your work overview.</p>
          </div>

          <div className="electrician-profile">
            <div className="profile-avatar">E</div>
            <div>
              <strong>Electrician</strong>
              <small>Service Provider</small>
            </div>
          </div>
        </header>

        {/* Statistics */}
        <section className="dashboard-stats">

          <div className="stat-card">
            <h3>0</h3>
            <p>New Job Requests</p>
          </div>

          <div className="stat-card">
            <h3>0</h3>
            <p>Active Jobs</p>
          </div>

          <div className="stat-card">
            <h3>0</h3>
            <p>Completed Jobs</p>
          </div>

          <div className="stat-card">
            <h3>Rs. 0</h3>
            <p>Total Earnings</p>
          </div>

        </section>

        {/* Quick Actions */}
        <section className="dashboard-section">

          <h2>Quick Actions</h2>

          <div className="quick-actions">
            <NavLink to="/electrician/jobs">
              View Job Requests
            </NavLink>

            <NavLink to="/electrician/availability">
              Manage Availability
            </NavLink>

            <NavLink to="/electrician/wallet">
              View My Earnings
            </NavLink>
          </div>

        </section>

        {/* Recent Activity */}
        <section className="dashboard-section recent-activity">

          <h2>Recent Activity</h2>

          <div className="empty-activity">
            <span>📭</span>
            <p>No recent activity yet.</p>
            <small>Your job updates will appear here.</small>
          </div>

        </section>

      </main>

    </div>
  );
}