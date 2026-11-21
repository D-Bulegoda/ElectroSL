import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import adminService from '../../services/adminService';
import StatusBadge from '../../components/admin/StatusBadge';
import DocumentViewer from '../../components/admin/DocumentViewer';
import RejectionModal from '../../components/admin/RejectionModal';
import ApplicationDetail from './ApplicationDetail';
import { formatDateTime } from '../../utils/formattingHelpers';
import {
  UsersCheckIcon,
  ClipboardCheckIcon,
  UserXIcon,
  SearchIcon,
  RefreshCwIcon,
  EyeIcon,
  CheckIcon,
  XIcon,
  ShieldAlertIcon
} from '../../components/admin/AdminIcons';

export default function TechnicianManagement({ defaultTab = 'pending' }) {
  const { id } = useParams();
  const navigate = useNavigate();

  // If URL has an ID (e.g. /admin/applications/:id), open directly in detail view
  const [selectedProfileId, setSelectedProfileId] = useState(id ? parseInt(id, 10) : null);
  const [activeTab, setActiveTab] = useState(defaultTab); // 'pending' | 'approved' | 'rejected'

  // Lists state
  const [applications, setApplications] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [actionMessage, setActionMessage] = useState(null);

  // Modals state
  const [docModal, setDocModal] = useState({ isOpen: false, url: '', type: '', title: '' });
  const [rejectModal, setRejectModal] = useState({ isOpen: false, profileId: null, name: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load data for the active tab
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const statusMap = {
        pending: 'Pending',
        approved: 'Approved',
        rejected: 'Rejected'
      };

      const data = await adminService.getApplications(statusMap[activeTab] || 'Pending');
      setApplications(data || []);

      // Always fetch pending count for the badge if not in pending tab
      if (activeTab !== 'pending') {
        const pendingData = await adminService.getApplications('Pending');
        setPendingCount(pendingData?.length || 0);
      } else {
        setPendingCount(data?.length || 0);
      }
    } catch (err) {
      console.error('Failed to load technician applications:', err);
      setError('Unable to load technician data from server. Please verify connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedProfileId) {
      fetchData();
    }
  }, [activeTab, selectedProfileId]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearch('');
    setSelectedProfileId(null);
  };

  const handleApprove = async (profileId, name) => {
    if (!window.confirm(`Confirm accreditation approval for ${name}? This permits them to bid on jobs.`)) {
      return;
    }

    try {
      setIsSubmitting(true);
      await adminService.approveApplication(profileId);
      setActionMessage({ type: 'success', text: `Technician ${name} has been approved successfully.` });
      fetchData();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Approval failed. Verify prerequisites.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectConfirm = async (reason) => {
    try {
      setIsSubmitting(true);
      await adminService.rejectApplication(rejectModal.profileId, reason);
      setActionMessage({ type: 'success', text: 'Application has been rejected with recorded reason.' });
      setRejectModal({ isOpen: false, profileId: null, name: '' });
      fetchData();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Rejection failed.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDoc = (profileId, type, title) => {
    const url = adminService.getDocumentUrl(profileId, type);
    setDocModal({ isOpen: true, url, type, title });
  };

  // Filter list by search query
  const filtered = applications.filter((app) => {
    const q = search.toLowerCase();
    return (
      (app.name && app.name.toLowerCase().includes(q)) ||
      (app.email && app.email.toLowerCase().includes(q)) ||
      (app.specialization && app.specialization.toLowerCase().includes(q))
    );
  });

  // If a technician detail is selected, render the full application dossier inline
  if (selectedProfileId) {
    return (
      <ApplicationDetail
        profileId={selectedProfileId}
        onBack={() => {
          setSelectedProfileId(null);
          // If navigated directly via /admin/applications/:id, return to /admin/technicians
          if (id) navigate('/admin/technicians');
        }}
        onStatusUpdated={() => {
          setSelectedProfileId(null);
          fetchData();
        }}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ClipboardCheckIcon size={20} color="#2563eb" />
            Technician Verification & Workforce Directory
          </h1>
          <p className="admin-page-subtitle">
            Manage technician accreditation pipeline, review TVEC NVQ Level 4 documents, and inspect active electrician profiles.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchData}
          disabled={loading}
          className="admin-btn admin-btn-secondary"
          style={{ height: '32px', fontSize: '0.78rem' }}
        >
          <RefreshCwIcon size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          <span>Refresh</span>
        </button>
      </div>

      {actionMessage && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '4px',
            fontSize: '0.8125rem',
            backgroundColor: actionMessage.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${actionMessage.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            color: actionMessage.type === 'success' ? '#166534' : '#991b1b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span>{actionMessage.text}</span>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Simplified Primary Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.25rem',
          borderBottom: '2px solid #e2e8f0',
          paddingBottom: '0.25rem'
        }}
      >
        <button
          type="button"
          onClick={() => handleTabChange('pending')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.1rem',
            fontSize: '0.8125rem',
            fontWeight: activeTab === 'pending' ? 700 : 500,
            color: activeTab === 'pending' ? '#2563eb' : '#64748b',
            backgroundColor: activeTab === 'pending' ? '#eff6ff' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'pending' ? '2px solid #2563eb' : '2px solid transparent',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            marginBottom: '-0.25rem'
          }}
        >
          <ClipboardCheckIcon size={15} />
          <span>Pending Approvals</span>
          {pendingCount > 0 && (
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                backgroundColor: '#fef3c7',
                color: '#b45309',
                padding: '0.1rem 0.45rem',
                borderRadius: '10px'
              }}
            >
              {pendingCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('approved')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.1rem',
            fontSize: '0.8125rem',
            fontWeight: activeTab === 'approved' ? 700 : 500,
            color: activeTab === 'approved' ? '#2563eb' : '#64748b',
            backgroundColor: activeTab === 'approved' ? '#eff6ff' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'approved' ? '2px solid #2563eb' : '2px solid transparent',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            marginBottom: '-0.25rem'
          }}
        >
          <UsersCheckIcon size={15} />
          <span>Approved Directory</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('rejected')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.1rem',
            fontSize: '0.8125rem',
            fontWeight: activeTab === 'rejected' ? 700 : 500,
            color: activeTab === 'rejected' ? '#2563eb' : '#64748b',
            backgroundColor: activeTab === 'rejected' ? '#eff6ff' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'rejected' ? '2px solid #2563eb' : '2px solid transparent',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            marginBottom: '-0.25rem'
          }}
        >
          <UserXIcon size={15} />
          <span>Rejected Applications</span>
        </button>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', color: '#991b1b', fontSize: '0.8125rem' }}>
          {error}
        </div>
      )}

      {/* Toolbar / Search */}
      <div className="admin-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="admin-search-box" style={{ maxWidth: '380px' }}>
          <span className="admin-search-icon">
            <SearchIcon size={14} />
          </span>
          <input
            type="text"
            placeholder={`Search ${activeTab} technicians by name, email, specialization...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-search-input"
          />
        </div>
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
          Showing <strong>{filtered.length}</strong> {activeTab} profile{filtered.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Table */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Technician</th>
              <th>Specialization</th>
              <th>NVQ Level 4</th>
              <th>NIC Verified</th>
              <th>Simulator Score</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                  Loading {activeTab} technician records...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                  {search ? 'No matching technicians found.' : `No ${activeTab} technician applications at this time.`}
                </td>
              </tr>
            ) : (
              filtered.map((tech) => (
                <tr key={tech.profileId}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{tech.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{tech.email}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8125rem', color: '#334155' }}>
                      {tech.specialization || 'General Electrician'}
                    </span>
                  </td>
                  <td>
                    {tech.hasNvqCertificate ? (
                      <button
                        type="button"
                        onClick={() => openDoc(tech.profileId, 'nvq', `NVQ Certificate - ${tech.name}`)}
                        className="admin-btn admin-btn-ghost admin-btn-sm"
                        style={{ color: '#2563eb' }}
                      >
                        <EyeIcon size={13} />
                        <span>View NVQ</span>
                      </button>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Missing</span>
                    )}
                  </td>
                  <td>
                    {tech.hasNicDocument ? (
                      <button
                        type="button"
                        onClick={() => openDoc(tech.profileId, 'nic', `NIC Document - ${tech.name}`)}
                        className="admin-btn admin-btn-ghost admin-btn-sm"
                        style={{ color: '#2563eb' }}
                      >
                        <EyeIcon size={13} />
                        <span>View NIC</span>
                      </button>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Missing</span>
                    )}
                  </td>
                  <td>
                    {tech.simulatorPassed ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#16a34a', fontWeight: 600, fontSize: '0.75rem' }}>
                        <CheckIcon size={13} /> {tech.simulatorScore}% (Passed)
                      </span>
                    ) : tech.simulatorScore > 0 ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#dc2626', fontWeight: 600, fontSize: '0.75rem' }}>
                        <XIcon size={13} /> {tech.simulatorScore}% (Failed)
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Pending Test</span>
                    )}
                  </td>
                  <td>
                    <StatusBadge status={tech.verificationStatus} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedProfileId(tech.profileId)}
                        className="admin-btn admin-btn-secondary admin-btn-sm"
                        title="View Full Application Dossier"
                      >
                        <EyeIcon size={13} />
                        <span>Dossier</span>
                      </button>

                      {activeTab === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleApprove(tech.profileId, tech.name)}
                            disabled={isSubmitting}
                            className="admin-btn admin-btn-primary admin-btn-sm"
                            style={{ backgroundColor: '#16a34a', borderColor: '#15803d' }}
                            title="Approve Application"
                          >
                            <CheckIcon size={13} />
                            <span>Approve</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setRejectModal({ isOpen: true, profileId: tech.profileId, name: tech.name })}
                            disabled={isSubmitting}
                            className="admin-btn admin-btn-danger admin-btn-sm"
                            title="Reject Application"
                          >
                            <XIcon size={13} />
                            <span>Reject</span>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewer
        isOpen={docModal.isOpen}
        onClose={() => setDocModal({ isOpen: false, url: '', type: '', title: '' })}
        documentUrl={docModal.url}
        documentType={docModal.type}
        title={docModal.title}
      />

      {/* Rejection Modal */}
      <RejectionModal
        isOpen={rejectModal.isOpen}
        onClose={() => setRejectModal({ isOpen: false, profileId: null, name: '' })}
        onConfirm={handleRejectConfirm}
        applicantName={rejectModal.name}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

