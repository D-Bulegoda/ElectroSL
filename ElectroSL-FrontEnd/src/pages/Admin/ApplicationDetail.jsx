import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import StatusBadge from '../../components/admin/StatusBadge';
import DocumentViewer from '../../components/admin/DocumentViewer';
import RejectionModal from '../../components/admin/RejectionModal';
import { formatDateTime, formatCurrency } from '../../utils/formattingHelpers';

const ApplicationDetail = ({ profileId, onBack, onStatusUpdated }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [docModal, setDocModal] = useState({ isOpen: false, url: '', type: '', title: '' });
  const [rejectModal, setRejectModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getApplicationDetail(profileId);
      setDetail(data);
    } catch (err) {
      console.error('Failed to load application detail:', err);
      setError('Could not retrieve technician application details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profileId) {
      fetchDetail();
    }
  }, [profileId]);

  const handleApprove = async () => {
    if (!detail) return;
    if (!window.confirm(`Confirm approval for ${detail.name}?`)) return;

    try {
      setIsSubmitting(true);
      await adminService.approveApplication(profileId);
      setFeedback({ type: 'success', text: 'Technician approved successfully!' });
      fetchDetail();
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Approval failed. Prerequisites not met.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectConfirm = async (reason) => {
    try {
      setIsSubmitting(true);
      await adminService.rejectApplication(profileId, reason);
      setFeedback({ type: 'success', text: 'Technician application rejected.' });
      setRejectModal(false);
      fetchDetail();
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Rejection failed.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDoc = (type, title) => {
    const url = adminService.getDocumentUrl(profileId, type);
    setDocModal({ isOpen: true, url, type, title });
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading technician details...</div>;
  }

  if (error || !detail) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#dc2626' }}>{error || 'Application not found.'}</p>
        <button type="button" onClick={onBack} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
          Back to List
        </button>
      </div>
    );
  }

  const canApprove =
    detail.verificationStatus !== 'Approved' &&
    detail.nicDocumentUrl &&
    detail.nvqCertificateUrl &&
    detail.simulatorPassed;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1000px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <button
            type="button"
            onClick={onBack}
            style={{
              padding: '0.35rem 0.75rem',
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              fontSize: '0.85rem',
              marginBottom: '0.5rem'
            }}
          >
            ← Back to Applications
          </button>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            {detail.name}
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.2rem 0 0 0' }}>
            User ID: #{detail.userId} • Profile ID: #{detail.profileId} • Registered: {formatDateTime(detail.createdAt)}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <StatusBadge status={detail.verificationStatus} />
          {detail.verificationStatus !== 'Approved' && (
            <button
              type="button"
              disabled={isSubmitting || !canApprove}
              onClick={handleApprove}
              style={{
                padding: '0.5rem 1.25rem',
                backgroundColor: canApprove ? '#16a34a' : '#9ca3af',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.375rem',
                fontWeight: 600,
                cursor: canApprove ? 'pointer' : 'not-allowed'
              }}
            >
              Approve Technician
            </button>
          )}
          {detail.verificationStatus !== 'Rejected' && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setRejectModal(true)}
              style={{
                padding: '0.5rem 1.25rem',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.375rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Reject
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '0.375rem',
            backgroundColor: feedback.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: feedback.type === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${feedback.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            fontSize: '0.875rem'
          }}
        >
          {feedback.text}
        </div>
      )}

      {/* Grid: Profile info + Assessment results */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Profile Card */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '0.5rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
            Technician Profile
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
            <div>
              <span style={{ color: '#64748b' }}>Email: </span>
              <strong style={{ color: '#0f172a' }}>{detail.email}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Specialization: </span>
              <strong style={{ color: '#0f172a' }}>{detail.specialization || 'Not specified'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Wallet Balance: </span>
              <strong style={{ color: '#0f172a' }}>{formatCurrency(detail.walletBalance || 0)}</strong>
            </div>
            {detail.reviewedAt && (
              <div>
                <span style={{ color: '#64748b' }}>Last Reviewed: </span>
                <strong style={{ color: '#0f172a' }}>{formatDateTime(detail.reviewedAt)} by Admin #{detail.reviewedByAdminId}</strong>
              </div>
            )}
            {detail.rejectionReason && (
              <div style={{ backgroundColor: '#fef2f2', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #fecaca' }}>
                <span style={{ color: '#991b1b', fontWeight: 600 }}>Rejection Reason: </span>
                <p style={{ margin: '0.25rem 0 0 0', color: '#7f1d1d' }}>{detail.rejectionReason}</p>
              </div>
            )}
          </div>
        </div>

        {/* Skill Simulator Assessment Card */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '0.5rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
            Interactive Simulator Assessment
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b' }}>Assessment Result: </span>
              {detail.simulatorPassed ? (
                <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontWeight: 700 }}>
                  PASSED
                </span>
              ) : (
                <span style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontWeight: 700 }}>
                  FAILED / NOT ATTEMPTED
                </span>
              )}
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Total Score: </span>
              <strong style={{ color: '#0f172a' }}>{detail.simulatorScore} / 100</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Time Taken: </span>
              <strong style={{ color: '#0f172a' }}>{detail.simulatorTimeTaken} seconds</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Safety Violations: </span>
              <strong style={{ color: detail.safetyMistakesCount > 0 ? '#dc2626' : '#16a34a' }}>
                {detail.safetyMistakesCount} errors
              </strong>
            </div>
            {detail.simulatorDate && (
              <div>
                <span style={{ color: '#64748b' }}>Attempt Date: </span>
                <strong style={{ color: '#0f172a' }}>{formatDateTime(detail.simulatorDate)}</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Verification Documents Section */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '0.5rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
          Verification Documents Review
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {/* NIC Card */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.375rem', padding: '1rem', backgroundColor: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontWeight: 600, color: '#1e293b' }}>🪪 Sri Lankan NIC Document</span>
              {detail.nicDocumentUrl ? (
                <span style={{ color: '#16a34a', fontSize: '0.75rem', fontWeight: 600 }}>Attached</span>
              ) : (
                <span style={{ color: '#dc2626', fontSize: '0.75rem', fontWeight: 600 }}>Missing</span>
              )}
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 1rem 0' }}>
              Confirm identity against official Sri Lanka National Identity Card.
            </p>
            {detail.nicDocumentUrl ? (
              <button
                type="button"
                onClick={() => openDoc('nic', `National Identity Card — ${detail.name}`)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.25rem',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Inspect NIC Document
              </button>
            ) : (
              <div style={{ padding: '0.5rem', backgroundColor: '#fee2e2', borderRadius: '0.25rem', textAlign: 'center', fontSize: '0.75rem', color: '#991b1b' }}>
                Electrician must upload their NIC before approval.
              </div>
            )}
          </div>

          {/* NVQ Card */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.375rem', padding: '1rem', backgroundColor: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontWeight: 600, color: '#1e293b' }}>📜 NVQ Level 4 Certificate</span>
              {detail.nvqCertificateUrl ? (
                <span style={{ color: '#16a34a', fontSize: '0.75rem', fontWeight: 600 }}>Attached</span>
              ) : (
                <span style={{ color: '#dc2626', fontSize: '0.75rem', fontWeight: 600 }}>Missing</span>
              )}
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 1rem 0' }}>
              Verify accreditation by TVEC (Tertiary and Vocational Education Commission).
            </p>
            {detail.nvqCertificateUrl ? (
              <button
                type="button"
                onClick={() => openDoc('nvq', `NVQ Level 4 Certificate — ${detail.name}`)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  backgroundColor: '#7c3aed',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.25rem',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Inspect NVQ Level 4 Certificate
              </button>
            ) : (
              <div style={{ padding: '0.5rem', backgroundColor: '#fee2e2', borderRadius: '0.25rem', textAlign: 'center', fontSize: '0.75rem', color: '#991b1b' }}>
                NVQ Level 4 certification is strictly required for marketplace onboarding.
              </div>
            )}
          </div>
        </div>
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
        isOpen={rejectModal}
        onClose={() => setRejectModal(false)}
        onConfirm={handleRejectConfirm}
        technicianName={detail.name}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default ApplicationDetail;

