import React, { useState } from 'react';
import Modal from '../common/Modal';

const SKILL_LEVEL_LABELS = {
  1: 'Level 1 / 5 — Apprentice / Foundational Skills',
  2: 'Level 2 / 5 — Junior Technician / Developing Competence',
  3: 'Level 3 / 5 — Competent General Electrician',
  4: 'Level 4 / 5 — Advanced / Skilled Specialist',
  5: 'Level 5 / 5 — Master Electrician / Expert'
};

const SimulatorOverrideModal = ({ isOpen, onClose, onConfirm, technicianName, isSubmitting }) => {
  const [explanation, setExplanation] = useState('');
  const [rating, setRating] = useState(3);
  const [hoverRating, setHoverRating] = useState(0);
  const [assessmentNote, setAssessmentNote] = useState('');
  const [error, setError] = useState('');

  const activeRating = hoverRating || rating;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!explanation || explanation.trim().length < 10) {
      setError('A mandatory justification of at least 10 characters is required for an administrator override.');
      return;
    }
    if (!rating || rating < 1 || rating > 5) {
      setError('A technical skill rating (1-5 stars) is mandatory.');
      return;
    }
    setError('');
    onConfirm(explanation.trim(), {
      technicalSkillRating: rating,
      assessmentNote: assessmentNote.trim() || null
    });
  };

  const handleClose = () => {
    setExplanation('');
    setRating(3);
    setHoverRating(0);
    setAssessmentNote('');
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Simulator Assessment Override Approval">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ margin: 0, fontSize: '0.8125rem', color: '#475569', lineHeight: 1.5 }}>
          You are authorizing an <strong style={{ color: '#0f172a' }}>Administrator Override</strong> for{' '}
          <strong style={{ color: '#0f172a' }}>{technicianName || 'this technician'}</strong> who has not met the standard
          circuit simulator pass threshold.
        </p>

        <div
          style={{
            padding: '0.65rem 0.85rem',
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '4px',
            color: '#92400e',
            fontSize: '0.75rem'
          }}
        >
          ⚠️ This action will be permanently recorded in the immutable audit log under your Administrator ID.
        </div>

        {/* 1-5 Star Interactive Selector */}
        <div
          style={{
            padding: '0.85rem',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="admin-label" style={{ marginBottom: 0, fontWeight: 700, color: '#0f172a' }}>
              Assign Technical Skill Level <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#b45309' }}>
              Level {rating} / 5
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {[1, 2, 3, 4, 5].map((star) => {
              const isFilled = star <= activeRating;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.6rem',
                    lineHeight: 1,
                    padding: '0.15rem',
                    color: isFilled ? '#f59e0b' : '#cbd5e1'
                  }}
                  title={`Level ${star}`}
                >
                  ★
                </button>
              );
            })}
          </div>

          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#b45309' }}>
            {SKILL_LEVEL_LABELS[activeRating]}
          </div>
        </div>

        <div className="admin-form-group">
          <label className="admin-label">
            Mandatory Justification / Explanation *
          </label>
          <textarea
            rows={4}
            value={explanation}
            onChange={(e) => {
              setExplanation(e.target.value);
              if (error) setError('');
            }}
            placeholder="e.g. Verified 15+ years industrial master electrician credentials via in-person practical assessment; TVEC accredited senior grade certificate inspected..."
            className="admin-textarea"
            style={{
              borderColor: error ? '#ef4444' : '#cbd5e1'
            }}
          />
          {error && (
            <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem', marginBottom: 0 }}>
              {error}
            </p>
          )}
          <span style={{ fontSize: '0.6875rem', color: '#94a3b8', alignSelf: 'flex-end' }}>
            Min 10 characters ({explanation.trim().length} entered)
          </span>
        </div>

        <div className="admin-form-group">
          <label className="admin-label">
            Assessment Note <span style={{ fontWeight: 400, color: '#64748b' }}>(Optional)</span>
          </label>
          <textarea
            rows={2}
            value={assessmentNote}
            onChange={(e) => setAssessmentNote(e.target.value)}
            placeholder="Additional assessment note..."
            className="admin-textarea"
            maxLength={1000}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button
            type="button"
            onClick={handleClose}
            className="admin-btn admin-btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="admin-btn admin-btn-primary"
          >
            {isSubmitting ? 'Recording Override...' : 'Grant Override & Approve'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default SimulatorOverrideModal;
