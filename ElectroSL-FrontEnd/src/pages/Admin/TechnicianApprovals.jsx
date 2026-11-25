import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService from '../../services/adminService';
import StatusBadge from '../../components/admin/StatusBadge';
import DocumentViewer from '../../components/admin/DocumentViewer';
import RejectionModal from '../../components/admin/RejectionModal';
import { formatDateTime } from '../../utils/formattingHelpers';
import {
  SearchIcon,
  RefreshCwIcon,
  EyeIcon,
  FileTextIcon,
  CheckIcon,
  XIcon
} from '../../components/admin/AdminIcons';

const TechnicianApprovals = ({ onSelectApplication }) => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // Modals state
  const [docModal, setDocModal] = useState({ isOpen: false, url: '', type: '', title: '' });
  const [rejectModal, setRejectModal] = useState({ isOpen: false, profileId: null, name: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  const fetchPending = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getApplications('Pending');
      setApplications(data || []);
    } catch (err) {
      console.error('Failed to load pending applications:', err);
      setError('Unable to fetch pending applications from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (profileId, name) => {
    if (!window.confirm(`Confirm accreditation approval for ${name}? This permits them to bid on jobs.`)) {
      return;
    }

    try {
      setIsSubmitting(true);
      await adminService.approveApplication(profileId);
      setActionMessage({ type: 'success', text: `Technician ${name} has been approved successfully.` });
      fetchPending();
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
      setActionMessage({ type: 'success', text: `Application has been rejected with recorded reason.` });
      setRejectModal({ isOpen: false, profileId: null, name: '' });
      fetchPending();
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

  const filteredApps = applications.filter((app) => {
    const q = search.toLowerCase();
    return (
      (app.name && app.name.toLowerCase().includes(q)) ||
      (app.email && app.email.toLowerCase().includes(q)) ||
      (app.specialization && app.specialization.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1280px' }}>
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1 className="admin-page-title">Pending Technician Approvals</h1>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                backgroundColor: '#fffbeb',
                color: '#b45309',
                border: '1px solid #fde68a',
                padding: '0.15rem 0.5rem',
                borderRadius: '4px'
              }}
            >
              {applications.length} Awaiting Review
            </span>
          </div>
          <p className="admin-page-subtitle">
            Validate National Identity Cards, TVEC NVQ Level 4 certification, and interactive simulator assessments.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchPending}
          disabled={loading}
          className="admin-btn admin-btn-secondary"
        >
          <RefreshCwIcon size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div
          style={{
            padding: '0.65rem 1rem',
            borderRadius: '4px',
            fontSize: '0.8125rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: actionMessage.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${actionMessage.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            color: actionMessage.type === 'success' ? '#166534' : '#991b1b'
          }}
        >
          <span>{actionMessage.text}</span>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="admin-toolbar">
        <div className="admin-search-box">
          <span className="admin-search-icon">
            <SearchIcon size={14} />
          </span>
          <input
            type="text"
            placeholder="Search by name, email, specialization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-search-input"
          />
        </div>
      </div>

      {/* Applications Table */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Technician</th>
              <th>Specialization</th>
              <th>NIC Document</th>
              <th>NVQ Level 4</th>
              <th>Simulator Assessment</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  Loading pending technician applications...
                </td>
              </tr>
            ) : filteredApps.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#10b981' }}>✓</div>
                  <strong style={{ display: 'block', color: '#1e293b', marginBottom: '0.25rem' }}>
                    All Applications Cleared
                  </strong>
                  <span>No pending technician applications currently awaiting verification.</span>
                </td>
              </tr>
            ) : (
              filteredApps.map((app) => (
                <tr key={app.profileId}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{app.name || 'Unnamed'}</div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{app.email}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.6875rem' }}>
                      Registered: {formatDateTime(app.createdAt)}
                    </div>
                  </td>
                  <td style={{ color: '#334155' }}>
                    {app.specialization || 'General Electrician'}
                  </td>
                  <td>
                    {app.nicDocumentUrl ? (
                      <button
                        type="button"
                        onClick={() => openDoc(app.profileId, 'nic', `NIC Document: ${app.name}`)}
                        className="admin-btn admin-btn-secondary admin-btn-sm"
                      >
                        <EyeIcon size={13} />
                        <span>Inspect NIC</span>
                      </button>
                    ) : (
                      <span style={{ color: '#dc2626', fontSize: '0.75rem', fontWeight: 600 }}>
                        Missing
                      </span>
                    )}
                  </td>
                  <td>
                    {app.nvqCertificateUrl ? (
                      <button
                        type="button"
                        onClick={() => openDoc(app.profileId, 'nvq', `NVQ Certificate: ${app.name}`)}
                        className="admin-btn admin-btn-secondary admin-btn-sm"
                      >
                        <FileTextIcon size={13} />
                        <span>Inspect NVQ</span>
                      </button>
                    ) : (
                      <span style={{ color: '#dc2626', fontSize: '0.75rem', fontWeight: 600 }}>
                        Missing
                      </span>
                    )}
                  </td>
                  <td>
                    {app.simulatorPassed ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          color: '#16a34a',
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}
                      >
                        <CheckIcon size={12} color="#16a34a" /> Passed (≥75%)
                      </span>
                    ) : (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          color: '#d97706',
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}
                      >
                        ⏳ Not Passed
                      </span>
                    )}
                  </td>
                  <td>
                    <StatusBadge status={app.verificationStatus} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() =>
                          onSelectApplication
                            ? onSelectApplication(app.profileId)
                            : navigate(`/admin/applications/${app.profileId}`)
                        }
                        className="admin-btn admin-btn-secondary admin-btn-sm"
                      >
                        Dossier
                      </button>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleApprove(app.profileId, app.name)}
                        className="admin-btn admin-btn-success admin-btn-sm"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() =>
                          setRejectModal({ isOpen: true, profileId: app.profileId, name: app.name })
                        }
                        className="admin-btn admin-btn-danger admin-btn-sm"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Document Modal */}
      <DocumentViewer
        isOpen={docModal.isOpen}
        onClose={() => setDocModal({ isOpen: false, url: '', type: '', title: '' })}
        documentUrl={docModal.url}
        docType={docModal.type}
        title={docModal.title}
      />

      {/* Rejection Modal */}
      <RejectionModal
        isOpen={rejectModal.isOpen}
        onClose={() => setRejectModal({ isOpen: false, profileId: null, name: '' })}
        onConfirm={handleRejectConfirm}
        technicianName={rejectModal.name}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default TechnicianApprovals;
