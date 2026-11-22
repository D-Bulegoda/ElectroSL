import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import adminService from '../../services/adminService';
import StatusBadge from '../../components/admin/StatusBadge';
import DocumentViewer from '../../components/admin/DocumentViewer';
import RejectionModal from '../../components/admin/RejectionModal';
import RevocationModal from '../../components/admin/RevocationModal';
import SimulatorOverrideModal from '../../components/admin/SimulatorOverrideModal';
import TechnicianApprovalModal from '../../components/admin/TechnicianApprovalModal';
import UpdateSkillRatingModal from '../../components/admin/UpdateSkillRatingModal';
import { formatDateTime, formatCurrency } from '../../utils/formattingHelpers';
import {
  ArrowLeftIcon,
  CheckIcon,
  XIcon,
  EyeIcon,
  FileTextIcon,
  ZapIcon,
  ShieldAlertIcon,
  RefreshCwIcon
} from '../../components/admin/AdminIcons';

const ApplicationDetail = ({ profileId, onBack, onStatusUpdated }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const effectiveProfileId = profileId || id;
  const handleBack = onBack || (() => navigate('/admin/approvals'));

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [docModal, setDocModal] = useState({ isOpen: false, url: '', type: '', title: '' });
  const [approvalModal, setApprovalModal] = useState(false);
  const [skillModal, setSkillModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [revokeModal, setRevokeModal] = useState(false);
  const [overrideModal, setOverrideModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getApplicationDetail(effectiveProfileId);
      setDetail(data);
    } catch (err) {
      console.error('Failed to load application detail:', err);
      setError('Could not retrieve technician application details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (effectiveProfileId) {
      fetchDetail();
    }
  }, [effectiveProfileId]);

  const handleApprove = () => {
    if (!detail) return;
    setApprovalModal(true);
  };

  const handleApprovalConfirm = async ({ technicalSkillRating, assessmentNote }) => {
    try {
      setIsSubmitting(true);
      await adminService.approveApplication(effectiveProfileId, { technicalSkillRating, assessmentNote });
      setFeedback({ type: 'success', text: `Technician has been approved and authorized with Technical Skill Level ${technicalSkillRating}/5.` });
      setApprovalModal(false);
      fetchDetail();
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Approval failed. Verify prerequisites.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverrideConfirm = async (explanation, payload) => {
    try {
      setIsSubmitting(true);
      await adminService.approveWithOverride(effectiveProfileId, explanation, payload);
      setFeedback({ type: 'success', text: `Simulator override granted. Technician approved with Technical Skill Level ${payload?.technicalSkillRating || 3}/5.` });
      setOverrideModal(false);
      fetchDetail();
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Override approval failed.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSkillConfirm = async ({ technicalSkillRating, assessmentNote }) => {
    try {
      setIsSubmitting(true);
      await adminService.updateTechnicalSkillRating(effectiveProfileId, { technicalSkillRating, assessmentNote });
      setFeedback({ type: 'success', text: `Technical Skill Level updated to Level ${technicalSkillRating}/5.` });
      setSkillModal(false);
      fetchDetail();
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update skill rating.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectConfirm = async (reason) => {
    try {
      setIsSubmitting(true);
      await adminService.rejectApplication(effectiveProfileId, reason);
      setFeedback({ type: 'success', text: 'Application rejected with recorded audit reason.' });
      setRejectModal(false);
      fetchDetail();
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Rejection failed.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeConfirm = async (reason) => {
    try {
      setIsSubmitting(true);
      await adminService.revokeApplication(effectiveProfileId, reason);
      setFeedback({ type: 'success', text: 'Technician accreditation has been revoked.' });
      setRevokeModal(false);
      fetchDetail();
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Revocation failed.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDoc = (type, title) => {
    const url = adminService.getDocumentUrl(effectiveProfileId, type);
    setDocModal({ isOpen: true, url, type, title });
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
        Loading technician dossier #{effectiveProfileId}...
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="admin-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
        <p style={{ color: '#dc2626', fontWeight: 600, margin: '0 0 1rem 0' }}>{error || 'Application not found.'}</p>
        <button type="button" onClick={handleBack} className="admin-btn admin-btn-secondary">
          <ArrowLeftIcon size={14} /> Back to Applications
        </button>
      </div>
    );
  }

  const isApproved = detail.verificationStatus === 'Approved';
  const hasDocuments = detail.nicDocumentUrl && detail.nvqCertificateUrl;
  const canNormalApprove = !isApproved && hasDocuments && detail.simulatorPassed;
  const canOverrideApprove = !isApproved && hasDocuments && !detail.simulatorPassed;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1100px' }}>
      {/* Top Header */}
      <div className="admin-page-header">
        <div>
          <button
            type="button"
            onClick={handleBack}
            className="admin-btn admin-btn-secondary admin-btn-sm"
            style={{ marginBottom: '0.5rem' }}
          >
            <ArrowLeftIcon size={13} /> Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h1 className="admin-page-title">{detail.name}</h1>
            <StatusBadge status={detail.verificationStatus} />
          </div>
          <p className="admin-page-subtitle">
            User ID: #{detail.userId} • Profile ID: #{detail.profileId} • Submitted: {formatDateTime(detail.createdAt)}
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {canNormalApprove && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleApprove}
              className="admin-btn admin-btn-success"
            >
              <CheckIcon size={14} /> Approve Technician
            </button>
          )}

          {canOverrideApprove && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setOverrideModal(true)}
              className="admin-btn admin-btn-primary"
              style={{ backgroundColor: '#4338ca', borderColor: '#4338ca' }}
            >
              <ShieldAlertIcon size={14} /> Override & Approve
            </button>
          )}

          {!isApproved && detail.verificationStatus !== 'Rejected' && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setRejectModal(true)}
              className="admin-btn admin-btn-danger"
            >
              <XIcon size={14} /> Reject Application
            </button>
          )}

          {isApproved && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setSkillModal(true)}
              className="admin-btn admin-btn-secondary"
              title="Update Technical Skill Rating"
            >
              ⭐ Update Technical Skill Level
            </button>
          )}

          {isApproved && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setRevokeModal(true)}
              className="admin-btn admin-btn-danger"
            >
              <XIcon size={14} /> Revoke Accreditation
            </button>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          style={{
            padding: '0.65rem 1rem',
            borderRadius: '4px',
            fontSize: '0.8125rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: feedback.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${feedback.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            color: feedback.type === 'success' ? '#166534' : '#991b1b'
          }}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Two Column Dossier */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem', alignItems: 'start' }}>
        
        {/* Left Column: Personal Info & Simulator */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Identity Card */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">Technician Profile</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', fontSize: '0.8125rem' }}>
              <div>
                <span className="admin-label">Email Address</span>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{detail.email}</div>
              </div>

              <div>
                <span className="admin-label">Specialization</span>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{detail.specialization || 'General Electrician'}</div>
              </div>

              <div>
                <span className="admin-label">Registration Date</span>
                <div style={{ color: '#334155' }}>{formatDateTime(detail.createdAt)}</div>
              </div>

              <div>
                <span className="admin-label">Wallet Balance</span>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{formatCurrency(detail.walletBalance || 0)}</div>
              </div>
            </div>
          </div>

          {/* Technical Skill Assessment Card */}
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <h2 className="admin-card-title">Technical Skill Assessment</h2>
                <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>Admin Evaluated Skill Rating</span>
              </div>
              {isApproved && (
                <button
                  type="button"
                  onClick={() => setSkillModal(true)}
                  className="admin-btn admin-btn-ghost admin-btn-sm"
                  style={{ color: '#2563eb' }}
                >
                  Edit Skill Rating
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8125rem' }}>
              <div>
                <span className="admin-label">Technical Skill Level</span>
                {detail.technicalSkillRating ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <span style={{ fontSize: '1.2rem', color: '#f59e0b', letterSpacing: '0.1rem' }}>
                      {'★'.repeat(detail.technicalSkillRating)}{'☆'.repeat(5 - detail.technicalSkillRating)}
                    </span>
                    <strong style={{ color: '#0f172a', fontSize: '0.9rem' }}>
                      Level {detail.technicalSkillRating} / 5
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      (Admin Assessed Skill)
                    </span>
                  </div>
                ) : (
                  <div style={{ color: '#94a3b8', fontStyle: 'italic', marginTop: '0.2rem' }}>
                    Not yet assessed
                  </div>
                )}
              </div>

              {detail.technicalSkillAssessmentNote && (
                <div>
                  <span className="admin-label">Assessment Note</span>
                  <div style={{ backgroundColor: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '4px', border: '1px solid #e2e8f0', color: '#334155' }}>
                    "{detail.technicalSkillAssessmentNote}"
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                <div>
                  Assessed: <strong>{detail.technicalSkillRatedAtUtc ? formatDateTime(detail.technicalSkillRatedAtUtc) : 'Not assessed'}</strong>
                </div>
                <div>
                  Assessor: <strong>{detail.technicalSkillRatedByAdminId ? `Admin #${detail.technicalSkillRatedByAdminId}` : 'None'}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Circuit Simulator Card */}
          <div className="admin-card">
            <div className="admin-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ZapIcon size={16} color="#2563eb" />
                <h2 className="admin-card-title">Circuit Simulator Verification</h2>
              </div>
              <StatusBadge status={detail.simulatorPassed ? 'Passed' : 'Pending'} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Score Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.8125rem' }}>
                  <span style={{ fontWeight: 600, color: '#334155' }}>Assessment Score</span>
                  <span style={{ fontWeight: 700, color: detail.simulatorScore >= 75 ? '#16a34a' : '#d97706' }}>
                    {detail.simulatorScore} / 100 (Pass threshold: 75)
                  </span>
                </div>
                <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, Math.max(0, detail.simulatorScore))}%`,
                      backgroundColor: detail.simulatorScore >= 75 ? '#16a34a' : '#f59e0b',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', fontSize: '0.8125rem', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
                <div>
                  <span className="admin-label">Time Taken</span>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>
                    {detail.simulatorTimeTaken > 0 ? `${detail.simulatorTimeTaken} seconds` : '—'}
                  </div>
                </div>

                <div>
                  <span className="admin-label">Safety Mistakes</span>
                  <div style={{ fontWeight: 600, color: detail.safetyMistakesCount > 0 ? '#dc2626' : '#16a34a' }}>
                    {detail.safetyMistakesCount} errors detected
                  </div>
                </div>

                <div>
                  <span className="admin-label">Attempt Date</span>
                  <div style={{ color: '#334155' }}>
                    {detail.simulatorDate ? formatDateTime(detail.simulatorDate) : 'Not attempted'}
                  </div>
                </div>

                <div>
                  <span className="admin-label">Assessment Result</span>
                  <div style={{ fontWeight: 600, color: detail.simulatorPassed ? '#16a34a' : '#d97706' }}>
                    {detail.simulatorPassed ? '✓ Qualified' : '⏳ Non-compliant (Requires Override)'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Documents Review & Audit Trail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Document Inspection Card */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">Accreditation Documents</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* NIC Box */}
              <div
                style={{
                  padding: '0.85rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  backgroundColor: '#f8fafc',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.8125rem' }}>
                    National Identity Card (NIC)
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Official Sri Lankan identity documentation
                  </div>
                </div>

                {detail.nicDocumentUrl ? (
                  <button
                    type="button"
                    onClick={() => openDoc('nic', `National Identity Card: ${detail.name}`)}
                    className="admin-btn admin-btn-secondary admin-btn-sm"
                  >
                    <EyeIcon size={13} /> Inspect
                  </button>
                ) : (
                  <span style={{ color: '#dc2626', fontSize: '0.75rem', fontWeight: 600 }}>Missing</span>
                )}
              </div>

              {/* NVQ Level 4 Box */}
              <div
                style={{
                  padding: '0.85rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  backgroundColor: '#f8fafc',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.8125rem' }}>
                    NVQ Level 4 Certificate
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Accredited TVEC Vocational Certificate
                  </div>
                </div>

                {detail.nvqCertificateUrl ? (
                  <button
                    type="button"
                    onClick={() => openDoc('nvq', `NVQ Certificate: ${detail.name}`)}
                    className="admin-btn admin-btn-secondary admin-btn-sm"
                  >
                    <FileTextIcon size={13} /> Inspect
                  </button>
                ) : (
                  <span style={{ color: '#dc2626', fontSize: '0.75rem', fontWeight: 600 }}>Missing</span>
                )}
              </div>
            </div>
          </div>

          {/* Persistent Audit History Trail Card */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">Persistent Audit History Trail</h2>
              <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>Immutable Log</span>
            </div>

            {(!detail.auditLogs || detail.auditLogs.length === 0) ? (
              <p style={{ margin: 0, fontSize: '0.8125rem', color: '#94a3b8', textAlign: 'center', padding: '1rem 0' }}>
                No audit entries recorded for this application yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {detail.auditLogs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '4px',
                      backgroundColor: '#f8fafc',
                      fontSize: '0.8125rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: '0.6875rem',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '3px',
                            textTransform: 'uppercase',
                            backgroundColor:
                              log.action === 'Approved' ? '#ecfdf5' :
                              log.action === 'SimulatorOverrideApproved' ? '#e0e7ff' :
                              log.action === 'Revoked' ? '#fdf2f8' : '#fef2f2',
                            color:
                              log.action === 'Approved' ? '#065f46' :
                              log.action === 'SimulatorOverrideApproved' ? '#3730a3' :
                              log.action === 'Revoked' ? '#9d174d' : '#991b1b',
                            border: `1px solid ${
                              log.action === 'Approved' ? '#a7f3d0' :
                              log.action === 'SimulatorOverrideApproved' ? '#c7d2fe' :
                              log.action === 'Revoked' ? '#fbcfe8' : '#fecaca'
                            }`
                          }}
                        >
                          {log.action}
                        </span>
                        <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                          {log.previousStatus} → <strong>{log.newStatus}</strong>
                        </span>
                      </div>
                      <span style={{ color: '#94a3b8', fontSize: '0.6875rem' }}>
                        {formatDateTime(log.timestampUtc)}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '0.2rem' }}>
                      Admin: <strong>{log.adminName || `Admin #${log.adminId}`}</strong>
                    </div>

                    {log.reason && (
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#1e293b', fontStyle: 'italic', backgroundColor: '#ffffff', padding: '0.35rem 0.5rem', borderRadius: '3px', border: '1px solid #f1f5f9' }}>
                        "{log.reason}"
                      </p>
                    )}
                  </div>
                ))}
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

      {/* Revocation Modal */}
      <RevocationModal
        isOpen={revokeModal}
        onClose={() => setRevokeModal(false)}
        onConfirm={handleRevokeConfirm}
        technicianName={detail.name}
        isSubmitting={isSubmitting}
      />

      {/* Simulator Override Modal */}
      <SimulatorOverrideModal
        isOpen={overrideModal}
        onClose={() => setOverrideModal(false)}
        onConfirm={handleOverrideConfirm}
        technicianName={detail.name}
        isSubmitting={isSubmitting}
      />

      {/* Technician Approval & Skill Rating Modal */}
      <TechnicianApprovalModal
        isOpen={approvalModal}
        onClose={() => setApprovalModal(false)}
        onConfirm={handleApprovalConfirm}
        technicianName={detail.name}
        isSubmitting={isSubmitting}
      />

      {/* Update Technical Skill Rating Modal */}
      <UpdateSkillRatingModal
        isOpen={skillModal}
        onClose={() => setSkillModal(false)}
        onConfirm={handleUpdateSkillConfirm}
        technicianName={detail.name}
        currentRating={detail.technicalSkillRating}
        currentNote={detail.technicalSkillAssessmentNote || ''}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default ApplicationDetail;
