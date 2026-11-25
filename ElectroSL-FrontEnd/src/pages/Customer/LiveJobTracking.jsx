
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import LeafletMap from '../../components/maps/LeafletMap';

const trackingSteps = [
  'Job Confirmed',
  'Electrician Assigned',
  'Electrician On The Way',
  'Electrician Arrived',
  'Work In Progress',
  'Job Completed'
];

export default function LiveJobTracking() {
  const [currentStep, setCurrentStep] = useState(2);

  const [electricianLocation, setElectricianLocation] = useState([
    6.9271,
    79.8612
  ]);

  const customerLocation = [6.9350, 79.8500];

  const handleNextStep = () => {
    if (currentStep < trackingSteps.length - 1) {
      setCurrentStep((previous) => previous + 1);
    }
  };

  return (
    <div className="page-container tracking-page">

      <Link to="/customer/home" className="back-link">
        ← Back to Dashboard
      </Link>

      <div className="tracking-header">
        <h1 className="page-title">Live Job Tracking</h1>
        <p>Follow your electrician and monitor your service progress.</p>
      </div>

      <div className="tracking-job-info">
        <div>
          <span>Job Reference</span>
          <strong>JOB-2026-001</strong>
        </div>

        <div>
          <span>Service</span>
          <strong>Electrical Wiring Repair</strong>
        </div>

        <div>
          <span>Estimated Arrival</span>
          <strong>{currentStep >= 3 ? 'Arrived' : '15 minutes'}</strong>
        </div>
      </div>

      <section className="tracking-section">
        <h2>Job Progress</h2>

        <div className="tracking-progress">
          {trackingSteps.map((step, index) => (
            <div
              className={`tracking-step ${
                index <= currentStep ? 'completed' : ''
              }`}
              key={step}
            >
              <div className="tracking-step-circle">
                {index < currentStep ? '✓' : index + 1}
              </div>

              <span>{step}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="tracking-section">
        <h2>Electrician Location</h2>

        <p className="tracking-map-hint">
          Sample map location. Select a new point to simulate the
          electrician moving.
        </p>

        <LeafletMap
          center={customerLocation}
          position={electricianLocation}
          zoom={13}
          onPositionChange={setElectricianLocation}
        />

        <div className="tracking-location-details">
          <div>
            <strong>Electrician Location</strong>
            <p>
              {electricianLocation[0].toFixed(5)},
              {' '}
              {electricianLocation[1].toFixed(5)}
            </p>
          </div>

          <div>
            <strong>Customer Location</strong>
            <p>
              {customerLocation[0].toFixed(5)},
              {' '}
              {customerLocation[1].toFixed(5)}
            </p>
          </div>
        </div>
      </section>

      <section className="tracking-section electrician-info">
        <h2>Assigned Electrician</h2>

        <div className="electrician-profile">
          <div className="electrician-avatar">K</div>

          <div>
            <h3>Kasun Perera</h3>
            <p>Verified Electrician</p>
            <p>⭐ 4.8 / 5 (42 customer reviews)</p>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                marginTop: '0.25rem',
                backgroundColor: '#f1f5f9',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.78rem',
                border: '1px solid #e2e8f0'
              }}
            >
              <span style={{ fontWeight: 600, color: '#334155' }}>Technical Skill Level:</span>
              <strong style={{ color: '#0f172a' }}>★★★★☆ Level 4 / 5</strong>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>(Admin Assessed Skill)</span>
            </div>
          </div>
        </div>

        <div className="electrician-contact">
          <div>
            <span>Contact Number</span>
            <strong>077 123 4567</strong>
          </div>

          <div>
            <span>Experience</span>
            <strong>5 Years</strong>
          </div>
        </div>
      </section>

      <div className="tracking-status">
        <strong>Current Status:</strong>
        <span>{trackingSteps[currentStep]}</span>
      </div>

      <button
        type="button"
        className="tracking-demo-button"
        onClick={handleNextStep}
        disabled={currentStep === trackingSteps.length - 1}
      >
        {currentStep === trackingSteps.length - 1
          ? 'Job Completed'
          : 'Simulate Next Status →'}
      </button>

      <p className="tracking-note">
        This is a frontend demonstration using sample data.
        Live GPS updates and real-time job status require backend
        and SignalR integration.
      </p>

    </div>
  );
}
