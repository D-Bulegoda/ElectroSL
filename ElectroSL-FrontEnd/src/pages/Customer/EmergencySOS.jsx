
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import LocationPicker from '../../components/maps/LocationPicker';

export default function EmergencySOS() {
  const [emergencyType, setEmergencyType] = useState('');
  const [description, setDescription] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [location, setLocation] = useState(null);
  const [message, setMessage] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!location) {
      setMessage('Please select your emergency location.');
      return;
    }

    setConfirmed(true);
    setMessage(
      'Emergency request details are ready. Backend dispatch integration is pending.'
    );

    console.log({
      emergencyType,
      description,
      contactNumber,
      location
    });
  };

  return (
    <div className="page-container emergency-page">

      <Link to="/customer/home" className="back-link">
        ← Back to Dashboard
      </Link>

      <div className="emergency-header">
        <div className="emergency-icon">!</div>
        <h1>Emergency SOS</h1>
        <p>
          Need urgent electrical assistance?
          Submit an emergency request.
        </p>
      </div>

      <form className="emergency-form" onSubmit={handleSubmit}>

        <section className="emergency-section">
          <h2>1. Emergency Type</h2>

          <label>Select your emergency</label>

          <select
            value={emergencyType}
            onChange={(e) => setEmergencyType(e.target.value)}
            required
          >
            <option value="">Choose emergency type</option>
            <option value="Power Failure">Complete Power Failure</option>
            <option value="Electrical Fire">Electrical Fire / Burning Smell</option>
            <option value="Electric Shock">Electric Shock Risk</option>
            <option value="Exposed Wiring">Exposed Electrical Wiring</option>
            <option value="Other">Other Emergency</option>
          </select>
        </section>

        <section className="emergency-section">
          <h2>2. Describe the Emergency</h2>

          <label>Emergency Description</label>

          <textarea
            rows="5"
            placeholder="Explain what happened..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </section>

        <section className="emergency-section">
          <h2>3. Emergency Location</h2>

          <p>Select where you need emergency assistance.</p>

          <LocationPicker onLocationSelect={setLocation} />

          {location && (
            <p className="emergency-location-success">
              ✓ Emergency location selected.
            </p>
          )}
        </section>

        <section className="emergency-section">
          <h2>4. Contact Information</h2>

          <label>Contact Number</label>

          <input
            type="tel"
            placeholder="Enter your contact number"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            required
          />
        </section>

        <div className="emergency-warning">
          <strong>Safety Notice</strong>
          <p>
            If there is an active electrical fire or electric shock
            danger, stay away from the affected area. Do not touch
            exposed wires or attempt repairs. Contact the appropriate
            emergency services immediately.
          </p>
        </div>

        {message && (
          <div className={confirmed ? 'emergency-success' : 'form-message'}>
            {message}
          </div>
        )}

        <button
          type="submit"
          className="emergency-submit-button"
        >
          🚨 Submit Emergency Request
        </button>

      </form>
    </div>
  );
}
