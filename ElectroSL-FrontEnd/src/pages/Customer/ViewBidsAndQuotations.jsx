
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const sampleBids = [
  {
    id: 1,
    electrician: 'Kasun Perera',
    experience: '5 years experience',
    rating: 4.8,
    reviews: 42,
    technicalSkillRating: 4,
    technicalSkillAssessmentNote: 'Verified NVQ Level 4 certificate credentials; demonstrated strong wiring safety proficiency.',
    price: 4500,
    duration: '2 hours',
    description: 'Inspection and repair of the electrical wiring.',
    status: 'Pending'
  },
  {
    id: 2,
    electrician: 'Nimal Fernando',
    experience: '8 years experience',
    rating: 4.9,
    reviews: 65,
    technicalSkillRating: 5,
    technicalSkillAssessmentNote: 'Senior Master Electrician with high-voltage industrial qualification.',
    price: 5200,
    duration: '1.5 hours',
    description: 'Complete wiring inspection and necessary repairs.',
    status: 'Pending'
  },
  {
    id: 3,
    electrician: 'Sahan Silva',
    experience: '3 years experience',
    rating: 4.5,
    reviews: 28,
    technicalSkillRating: null, // Not yet assessed
    technicalSkillAssessmentNote: null,
    price: 3800,
    duration: '3 hours',
    description: 'Basic electrical troubleshooting and repair.',
    status: 'Pending'
  }
];

export default function ViewBidsAndQuotations() {
  const [bids, setBids] = useState(sampleBids);
  const [message, setMessage] = useState('');

  const handleAccept = (id) => {
    const selectedBid = bids.find((bid) => bid.id === id);

    const confirmed = window.confirm(
      `Are you sure you want to accept ${selectedBid.electrician}'s quotation for LKR ${selectedBid.price.toLocaleString()}?`
    );

    if (!confirmed) return;

    setBids((previous) =>
      previous.map((bid) => ({
        ...bid,
        status: bid.id === id ? 'Accepted' :
          bid.status === 'Pending' ? 'Rejected' : bid.status
      }))
    );

    setMessage(
      `You accepted ${selectedBid.electrician}'s quotation. Backend integration is pending.`
    );
  };

  const handleReject = (id) => {
    setBids((previous) =>
      previous.map((bid) =>
        bid.id === id ? { ...bid, status: 'Rejected' } : bid
      )
    );

    setMessage('Quotation rejected.');
  };

  return (
    <div className="page-container bids-page">

      <Link to="/customer/home" className="back-link">
        ← Back to Dashboard
      </Link>

      <div className="bids-header">
        <h1 className="page-title">Bids & Quotations</h1>
        <p>Compare electrician quotations and choose the best offer.</p>
      </div>

      <div className="bids-job-summary">
        <div>
          <span>Job Reference</span>
          <strong>JOB-2026-001</strong>
        </div>

        <div>
          <span>Job Title</span>
          <strong>Electrical Wiring Repair</strong>
        </div>

        <div>
          <span>Received Bids</span>
          <strong>{bids.length}</strong>
        </div>
      </div>

      {message && (
        <div className="bids-message">
          {message}
        </div>
      )}

      <div className="bids-list">
        {bids.map((bid) => (
          <div className="bid-card" key={bid.id}>

            <div className="bid-card-header">
              <div>
                <h2>{bid.electrician}</h2>
                <p>{bid.experience}</p>
              </div>

              <span className={`bid-status ${bid.status.toLowerCase()}`}>
                {bid.status}
              </span>
            </div>

            <div className="bid-rating">
              ⭐ {bid.rating} / 5
              <span>({bid.reviews} customer reviews)</span>
            </div>

            {/* Technical Skill Level (Admin Assessed Skill - Distinct from customer reviews) */}
            <div
              className="bid-technical-skill"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: '#f1f5f9',
                padding: '0.35rem 0.65rem',
                borderRadius: '4px',
                fontSize: '0.8125rem',
                border: '1px solid #e2e8f0',
                margin: '0.4rem 0'
              }}
            >
              <span style={{ fontWeight: 600, color: '#475569' }}>Technical Skill Level:</span>
              {bid.technicalSkillRating ? (
                <span style={{ fontWeight: 700, color: '#0f172a' }}>
                  {'★'.repeat(bid.technicalSkillRating)}{'☆'.repeat(5 - bid.technicalSkillRating)} Level {bid.technicalSkillRating} / 5{' '}
                  <span style={{ fontWeight: 500, fontSize: '0.72rem', color: '#64748b' }}>
                    (Admin Assessed Skill)
                  </span>
                </span>
              ) : (
                <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>
                  Not yet assessed{' '}
                  <span style={{ fontWeight: 400, fontSize: '0.72rem', color: '#94a3b8' }}>
                    (Admin Assessed Skill)
                  </span>
                </span>
              )}
            </div>

            <p className="bid-description">
              {bid.description}
            </p>

            <div className="bid-details">
              <div>
                <span>Quotation Price</span>
                <strong>
                  LKR {bid.price.toLocaleString()}
                </strong>
              </div>

              <div>
                <span>Estimated Duration</span>
                <strong>{bid.duration}</strong>
              </div>
            </div>

            {bid.status === 'Pending' && (
              <div className="bid-actions">
                <button
                  className="accept-bid-button"
                  onClick={() => handleAccept(bid.id)}
                >
                  ✓ Accept Quotation
                </button>

                <button
                  className="reject-bid-button"
                  onClick={() => handleReject(bid.id)}
                >
                  ✕ Reject
                </button>
              </div>
            )}

          </div>
        ))}
      </div>

      <p className="bids-footer-note">
        Note: The displayed quotations are sample data.
        Actual electrician bids will be loaded through backend integration.
      </p>

    </div>
  );
}
