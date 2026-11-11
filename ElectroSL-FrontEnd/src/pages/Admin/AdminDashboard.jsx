import React, { useState } from 'react';
import AdminLayout from './AdminLayout';
import StatsCard from '../../components/admin/StatsCard';
import TechnicianApprovals from './TechnicianApprovals';
import ApplicationDetail from './ApplicationDetail';
import ApprovedElectricians from './ApprovedElectricians';
import RejectedApplications from './RejectedApplications';
import EquipmentPriceCatalog from './EquipmentPriceCatalog';
import adminService from '../../services/adminService';
import { formatCurrency } from '../../utils/formattingHelpers';

const DashboardOverview = ({ onNavigate, onSelectApplication }) => {
  const [stats, setStats] = useState({
    totalElectricians: 0,
    pendingApprovals: 0,
    approvedCount: 0,
    rejectedCount: 0,
    activeJobs: 0,
    totalCommissionCollected: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await adminService.getDashboardStats();
        setStats(data);
      } catch (err) {
        console.warn('Dashboard stats fallback:', err);
        setError('Operating with local database statistics.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
          Admin & Operations Dashboard
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
          Overview of technician verification, marketplace compliance, and equipment price controls.
        </p>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.375rem', color: '#991b1b', fontSize: '0.85rem' }}>
          ℹ️ {error}
        </div>
      )}

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
        <StatsCard
          title="Pending Approvals"
          value={loading ? '...' : stats.pendingApprovals}
          subtitle="Awaiting manual review"
          icon="⏳"
          color="yellow"
        />
        <StatsCard
          title="Approved Electricians"
          value={loading ? '...' : stats.approvedCount}
          subtitle="Active on platform"
          icon="✅"
          color="green"
        />
        <StatsCard
          title="Rejected Applications"
          value={loading ? '...' : stats.rejectedCount}
          subtitle="Non-compliant profiles"
          icon="❌"
          color="red"
        />
        <StatsCard
          title="Active Live Jobs"
          value={loading ? '...' : stats.activeJobs}
          subtitle="Within 10km radius"
          icon="⚡"
          color="blue"
        />
        <StatsCard
          title="Total Commission"
          value={loading ? '...' : formatCurrency(stats.totalCommissionCollected || 0)}
          subtitle="15% platform earnings"
          icon="💰"
          color="purple"
        />
      </div>

      {/* Quick Action Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '0.5rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🔍</span>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#1e293b' }}>
              Technician Verification Pipeline
            </h3>
          </div>
          <p style={{ color: '#4b5563', fontSize: '0.875rem', lineHeight: '1.5', margin: '0 0 1.25rem 0' }}>
            Review submitted Sri Lankan National Identity Cards (NIC), NVQ Level 4 electrical certifications,
            and interactive simulator assessment results before onboarding electricians.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => onNavigate('/admin/approvals')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.375rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Review Pending ({stats.pendingApprovals})
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/admin/approved')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#f1f5f9',
                color: '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '0.375rem',
                fontWeight: 500,
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Directory
            </button>
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '0.5rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.5rem' }}>📋</span>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#1e293b' }}>
              5% Equipment Price Catalog
            </h3>
          </div>
          <p style={{ color: '#4b5563', fontSize: '0.875rem', lineHeight: '1.5', margin: '0 0 1.25rem 0' }}>
            Maintain benchmark market retail prices for electrical materials. Electrician invoices are automatically
            restricted to an allowable variance of ±5% against this catalog.
          </p>
          <div>
            <button
              type="button"
              onClick={() => onNavigate('/admin/catalog')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#0f766e',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.375rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Manage Catalog Items
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const [activePath, setActivePath] = useState('/admin/dashboard');
  const [selectedProfileId, setSelectedProfileId] = useState(null);

  const handleNavigate = (path) => {
    setSelectedProfileId(null);
    setActivePath(path);
  };

  const handleSelectApplication = (profileId) => {
    setSelectedProfileId(profileId);
  };

  const renderContent = () => {
    if (selectedProfileId) {
      return (
        <ApplicationDetail
          profileId={selectedProfileId}
          onBack={() => setSelectedProfileId(null)}
          onStatusUpdated={() => {}}
        />
      );
    }

    switch (activePath) {
      case '/admin/approvals':
        return (
          <TechnicianApprovals
            onSelectApplication={handleSelectApplication}
            onNavigate={handleNavigate}
          />
        );
      case '/admin/approved':
        return (
          <ApprovedElectricians
            onSelectApplication={handleSelectApplication}
          />
        );
      case '/admin/rejected':
        return (
          <RejectedApplications
            onSelectApplication={handleSelectApplication}
          />
        );
      case '/admin/catalog':
        return <EquipmentPriceCatalog />;
      case '/admin/dashboard':
      default:
        return (
          <DashboardOverview
            onNavigate={handleNavigate}
            onSelectApplication={handleSelectApplication}
          />
        );
    }
  };

  return (
    <AdminLayout activePath={activePath} onNavigate={handleNavigate}>
      {renderContent()}
    </AdminLayout>
  );
}
