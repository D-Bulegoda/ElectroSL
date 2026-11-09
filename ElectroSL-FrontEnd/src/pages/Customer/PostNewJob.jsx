
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import LocationPicker from '../../components/maps/LocationPicker';
import ImageUploader from '../../components/media/ImageUploader';
import AudioRecorder from '../../components/media/AudioRecorder';

export default function PostNewJob() {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    date: '',
    time: '',
  });

  const [location, setLocation] = useState(null);
  const [image, setImage] = useState(null);
  const [audio, setAudio] = useState(null);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!location) {
      setMessage('Please select your job location.');
      return;
    }

    setMessage(
      'Your job details are ready! Backend submission will be connected after API integration.'
    );

    console.log({
      ...formData,
      location,
      image,
      audio,
    });
  };

  return (
    <div className="page-container">
      <div className="job-form-header">
        <Link to="/customer/home" className="back-link">
          ← Back to Dashboard
        </Link>

        <h1 className="page-title">Post a New Job</h1>
        <p>Tell us about your electrical problem.</p>
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
          <p>Select the location where you need the service.</p>

          <LocationPicker onLocationSelect={setLocation} />

          {location && (
            <p className="selected-location">
              Location selected successfully.
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

        {message && (
          <div className="form-message">
            {message}
          </div>
        )}

        <button type="submit" className="primary-button submit-job-button">
          Submit Job
        </button>
      </form>
    </div>
  );
}
