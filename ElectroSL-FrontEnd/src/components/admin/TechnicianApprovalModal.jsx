import React, { useState } from 'react';
import Modal from '../common/Modal';

const SKILL_LEVEL_LABELS = {
  1: 'Level 1 / 5 — Apprentice / Foundational Skills',
  2: 'Level 2 / 5 — Junior Technician / Developing Competence',
  3: 'Level 3 / 5 — Competent General Electrician',
  4: 'Level 4 / 5 — Advanced / Skilled Specialist',
  5: 'Level 5 / 5 — Master Electrician / Expert'
};

const TechnicianApprovalModal = ({ isOpen, onClose, onConfirm, technicianName, isSubmitting }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [assessmentNote, setAssessmentNote] = useState('');
  const [error, setError] = useState('');

  const activeRating = hoverRating || rating;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      setError('A Technical Skill Rating (1–5 stars) is mandatory before approving an electrician.');
      return;
    }
    setError('');
    onConfirm({
      technicalSkillRating: rating,
      assessmentNote: assessmentNote.trim() || null
    });
  };

  const handleClose = () => {
    setRating(0);
    setHoverRating(0);
    setAssessmentNote('');
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Accreditation Approval & Skill Assessment">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
        <p style={{ margin: 0, fontSize: '0.8125rem', color: '#475569', lineHeight: 1.5 }}>
          You are approving accreditation for applicant{' '}
          <strong style={{ color: '#0f172a' }}>{technicianName || 'this technician'}</strong>.
          Before approval, you must assign an official <strong>Technical Skill Level (1–5 stars)</strong> based on your evaluation of their NVQ certification and credentials.
        </p>

        {/* 1-5 Star Interactive Selector */}
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="admin-label" style={{ marginBottom: 0, fontWeight: 700, color: '#0f172a' }}>
              Technical Skill Level <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: rating > 0 ? '#b45309' : '#94a3b8' }}>
              {rating > 0 ? `${rating} of 5 Stars Selected` : 'Rating Required'}
            </span>
          </div>

          {/* Interactive Star Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {[1, 2, 3, 4, 5].map((star) => {
              const isFilled = star <= activeRating;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => {
                    setRating(star);
                    if (error) setError('');
                  }}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.85rem',
                    lineHeight: 1,
                    padding: '0.2rem',
                    color: isFilled ? '#f59e0b' : '#cbd5e1',
                    transform: isFilled ? 'scale(1.15)' : 'scale(1)',
                    transition: 'transform 0.15s ease, color 0.15s ease'
                  }}
                  title={`Select ${star} Star${star > 1 ? 's' : ''}`}
                  aria-label={`${star} star`}
                >
                  ★
                </button>
              );
            })}
          </div>

          {/* Description of active rating */}
          <div style={{ minHeight: '1.25rem', fontSize: '0.8125rem', color: rating > 0 ? '#1e293b' : '#64748b' }}>
            {activeRating > 0 ? (
              <span style={{ fontWeight: 600, color: '#b45309' }}>
                {SKILL_LEVEL_LABELS[activeRating]}
              </span>
            ) : (
              <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>
                Click a star above to assign the technical skill level (1 to 5).
              </span>
            )}
          </div>

          {error && (
            <p style={{ color: '#dc2626', fontSize: '0.75rem', margin: '0.25rem 0 0 0', fontWeight: 600 }}>
              {error}
            </p>
          )}
        </div>

        {/* Selected Rating Preview Banner */}
        {rating > 0 && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.8125rem'
            }}
          >
            <div>
              <div style={{ color: '#1e40af', fontWeight: 600 }}>Ready for Approval:</div>
              <div style={{ color: '#1e3a8a', fontWeight: 700, fontSize: '0.9rem' }}>
                ⭐ Level {rating} / 5 (Admin Assessed Skill)
              </div>
            </div>
            <span
              style={{
                backgroundColor: '#dbeafe',
                color: '#1d4ed8',
                fontWeight: 700,
                padding: '0.2rem 0.6rem',
                borderRadius: '12px',
                fontSize: '0.75rem'
              }}
            >
              Confirmed
            </span>
          </div>
        )}

        {/* Optional Assessment Note */}
        <div className="admin-form-group">
          <label className="admin-label">
            Assessment Note <span style={{ fontWeight: 400, color: '#64748b' }}>(Optional)</span>
          </label>
          <textarea
            rows={3}
            value={assessmentNote}
            onChange={(e) => setAssessmentNote(e.target.value)}
            placeholder="e.g. Verified NVQ Level 4 certificate credentials; demonstrated strong wiring safety proficiency..."
            className="admin-textarea"
            maxLength={1000}
          />
          <span style={{ fontSize: '0.6875rem', color: '#94a3b8', alignSelf: 'flex-end' }}>
            Max 1000 characters ({assessmentNote.length}/1000)
          </span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button
            type="button"
            onClick={handleClose}
            className="admin-btn admin-btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || rating === 0}
            className="admin-btn admin-btn-primary"
            style={{ backgroundColor: '#16a34a', borderColor: '#15803d' }}
          >
            {isSubmitting ? 'Approving...' : 'Confirm Approval & Assign Skill'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default TechnicianApprovalModal;

