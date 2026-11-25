import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import LocationPicker from '../../components/maps/LocationPicker';
import ImageUploader from '../../components/media/ImageUploader';
import AudioRecorder from '../../components/media/AudioRecorder';
import { fetchWithAuth } from '../../services/api';
import { getAuthSession } from '../../services/authService';

export default function PostNewJob() {
  const navigate = useNavigate();
  const session = getAuthSession();
  const savedProfile = session?.user || {};

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    jobType: 'Maintenance',
    description: '',
    date: '',
    time: '',
  });

  const [location, setLocation] = useState(null);
  const [image, setImage] = useState(null);
  const [audio, setAudio] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUsePermanentPin = () => {
    if (savedProfile.permanentLocation) {
      setLocation(savedProfile.permanentLocation);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    const currentSession = getAuthSession();
    if (!currentSession?.token || !currentSession?.user?.userId) {
      navigate('/signup?redirect=%2Fcustomer%2Fpost-job', { replace: true });
      return;
    }

    if (!location) {
      setError('Please select the job location on the map.');
      return;
    }

    const locationLat = location.lat ?? location.latitude;
    const locationLng = location.lng ?? location.longitude;

    setLoading(true);
    try {
      const payload = {
        customerId: currentSession.user.userId,
        title: formData.title.trim(),
        category: formData.category,
        jobType: formData.jobType,
        description: `${formData.title.trim()} (${formData.category}) - ${formData.description.trim()} | Preferred Schedule: ${formData.date} ${formData.time}`,
        locationLat,
        locationLng,
        preferredDate: formData.date,
        preferredTime: formData.time,
        isEmergency: false,
      };

      const createdJob = await fetchWithAuth('/job/create', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setMessage(
        'Job posted! Nearby certified electricians have been notified. Redirecting to live tracking...'
      );

      setTimeout(() => {
        navigate('/customer/tracking', {
          state: { jobId: createdJob?.jobId || createdJob?.id },
        });
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to submit job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="job-form-header">
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Link to="/customer/home" className="back-link">
            ← Back to Dashboard
          </Link>
          <Link to="/" className="back-link">
            Home
          </Link>
        </div>

        <h1 className="page-title">Post a New Job</h1>
        <p>Describe your electrical issue and nearby certified electricians will be notified to attend.</p>
      </div>

      <form className="job-form" onSubmit={handleSubmit}>
        <section className="job-form-section">
          <h2>1. Job Information</h2>

          <label>Job Title</label>
          <input
            type="text"
            name="title"
            placeholder="e.g. Repair ceiling fan"
            value={formData.title}
            onChange={handleChange}
            required
          />

          <label>Job Type</label>
          <select
            name="jobType"
            value={formData.jobType}
            onChange={handleChange}
            required
          >
            <option value="Maintenance">Maintenance</option>
            <option value="NewConstruction">New Construction</option>
          </select>

          <label>Service Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="">Select a category</option>
            <option value="Wiring">Electrical Wiring</option>
            <option value="Repair">Electrical Repair</option>
            <option value="Installation">Installation</option>
            <option value="Lighting">Lighting</option>
            <option value="Other">Other</option>
          </select>

          <label>Problem Description</label>
          <textarea
            name="description"
            placeholder="Describe your electrical problem..."
            value={formData.description}
            onChange={handleChange}
            rows="5"
            required
          />
        </section>

        <section className="job-form-section">
          <h2>2. Job Location</h2>
          <p>Select the exact site where the electrician needs to attend (can differ from your permanent address).</p>

          {(savedProfile.permanentAddress || savedProfile.permanentDistrict) && (
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '14px',
                fontSize: '13px',
                color: '#334155',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <span>
                <strong>Saved Profile Address:</strong>{' '}
                {[savedProfile.permanentAddress, savedProfile.permanentDistrict]
                  .filter(Boolean)
                  .join(', ')}
              </span>

              {savedProfile.permanentLocation && (
                <button
                  type="button"
                  onClick={handleUsePermanentPin}
                  style={{
                    background: '#eaf2ff',
                    color: '#17447c',
                    border: '1px solid #bfdbfe',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}
                >
                  Use Permanent Map Pin
                </button>
              )}
            </div>
          )}

          <LocationPicker onLocationSelect={setLocation} />

          {location && (
            <p className="selected-location">
              Job location selected successfully.
            </p>
          )}
        </section>

        <section className="job-form-section">
          <h2>3. Upload Problem Image</h2>
          <ImageUploader onImageUpload={setImage} />
        </section>

        <section className="job-form-section">
          <h2>4. Voice Description</h2>
          <AudioRecorder onAudioReady={setAudio} />
          <p className="form-hint">
            Maximum recording time: 30 seconds.
          </p>
        </section>

        <section className="job-form-section">
          <h2>5. Preferred Schedule</h2>

          <label>Preferred Date</label>
          <input
            type="date"
            name="date"
            min={new Date().toISOString().split('T')[0]}
            value={formData.date}
            onChange={handleChange}
            required
          />

          <label>Preferred Time</label>
          <input
            type="time"
            name="time"
            value={formData.time}
            onChange={handleChange}
            required
          />
        </section>

        {error && (
          <div
            className="form-message"
            style={{ background: '#fee2e2', color: '#b91c1c' }}
          >
            {error}
          </div>
        )}

        {message && (
          <div className="form-message">
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="primary-button submit-job-button"
        >
          {loading ? 'Posting Job...' : 'Post Job & Notify Electricians'}
        </button>
      </form>
    </div>
  );
}