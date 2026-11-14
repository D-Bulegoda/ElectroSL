import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import StatusBadge from '../../components/admin/StatusBadge';
import DocumentViewer from '../../components/admin/DocumentViewer';
import RejectionModal from '../../components/admin/RejectionModal';
import { formatDateTime } from '../../utils/formattingHelpers';

const TechnicianApprovals = ({ onSelectApplication, onNavigate }) => {
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
      setError('Unable to fetch pending applications from server. Please verify backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (profileId, name) => {
    if (!window.confirm(`Are you sure you want to approve ${name}? This will verify their profile and allow them to take jobs.`)) {
      return;
    }

    try {
      setIsSubmitting(true);
      await adminService.approveApplication(profileId);
      setActionMessage({ type: 'success', text: `Technician ${name} has been approved successfully.` });
      fetchPending();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Approval failed. Make sure documents and simulator test are verified.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectConfirm = async (reason) => {
    try {
      setIsSubmitting(true);
      await adminService.rejectApplication(rejectModal.profileId, reason);
      setActionMessage({ type: 'success', text: `Technician application has been rejected.` });
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Pending Technician Approvals
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
            Verify NIC, NVQ certificates, and simulator score before granting platform license.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={fetchPending}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Alerts */}
      {actionMessage && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '0.375rem',
            backgroundColor: actionMessage.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: actionMessage.type === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${actionMessage.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            fontSize: '0.875rem'
          }}
        >
          {actionMessage.text}
        </div>
      )}

      {error && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.375rem', color: '#991b1b', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* Search Bar */}
      <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <input
          type="text"
          placeholder="Search technician by name, email, or specialization..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '0.6rem 0.85rem',
            borderRadius: '0.375rem',
            border: '1px solid #cbd5e1',
            fontSize: '0.875rem',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Technician</th>
              <th style={{ padding: '0.75rem 1rem' }}>Specialization</th>
              <th style={{ padding: '0.75rem 1rem' }}>NIC Document</th>
              <th style={{ padding: '0.75rem 1rem' }}>NVQ Level 4</th>
              <th style={{ padding: '0.75rem 1rem' }}>Simulator</th>
              <th style={{ padding: '0.75rem 1rem' }}>Status</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  Loading applications...
                </td>
              </tr>
            ) : filteredApps.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
                  <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>🎉</span>
                  No pending technician applications awaiting review.
                </td>
              </tr>
            ) : (
              filteredApps.map((app) => (
                <tr key={app.profileId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{app.name || 'Unnamed'}</div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{app.email}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Registered: {formatDateTime(app.createdAt)}</div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>
                    {app.specialization || 'General Electrician'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {app.nicDocumentUrl ? (
                      <button
                        type="button"
                        onClick={() => openDoc(app.profileId, 'nic', `NIC: ${app.name}`)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#eff6ff',
                          color: '#1d4ed8',
                          border: '1px solid #bfdbfe',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        👁️ View NIC
                      </button>
                    ) : (
                      <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 500 }}>⚠️ Missing</span>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {app.nvqCertificateUrl ? (
                      <button
                        type="button"
                        onClick={() => openDoc(app.profileId, 'nvq', `NVQ Certificate: ${app.name}`)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#f5f3ff',
                          color: '#6d28d9',
                          border: '1px solid #ddd6fe',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        📜 View NVQ
                      </button>
                    ) : (
                      <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 500 }}>⚠️ Missing</span>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {app.simulatorPassed ? (
                      <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.75rem' }}>✅ Passed</span>
                    ) : (
                      <span style={{ color: '#ca8a04', fontWeight: 600, fontSize: '0.75rem' }}>⏳ Not Passed / Incomplete</span>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <StatusBadge status={app.verificationStatus} />
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      {onSelectApplication && (
                        <button
                          type="button"
                          onClick={() => onSelectApplication(app.profileId)}
                          style={{
                            padding: '0.35rem 0.65rem',
                            backgroundColor: '#f8fafc',
                            color: '#334155',
                            border: '1px solid #cbd5e1',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            cursor: 'pointer'
                          }}
                        >
                          Full Details
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleApprove(app.profileId, app.name)}
                        style={{
                          padding: '0.35rem 0.65rem',
                          backgroundColor: '#16a34a',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: isSubmitting ? 'not-allowed' : 'pointer'
                        }}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => setRejectModal({ isOpen: true, profileId: app.profileId, name: app.name })}
                        style={{
                          padding: '0.35rem 0.65rem',
                          backgroundColor: '#dc2626',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: isSubmitting ? 'not-allowed' : 'pointer'
                        }}
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

      {/* Document Viewer Modal */}
      <DocumentViewer
        isOpen={docModal.isOpen}
        onClose={() => setDocModal({ isOpen: false, url: '', type: '', title: '' })}
        documentUrl={docModal.url}
        docType={docModal.type}
        title={docModal.title}
      />

      {/* Rejection Reason Modal */}
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

