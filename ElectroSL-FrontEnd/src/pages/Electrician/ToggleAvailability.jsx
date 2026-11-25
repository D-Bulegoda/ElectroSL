import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../../services/api';
import {
  getAuthSession,
  syncElectricianBrowserLocation,
  updateElectricianLocation,
} from '../../services/authService';
import LocationPicker from '../../components/maps/LocationPicker';

export default function ToggleAvailability() {
  const navigate = useNavigate();
  const session = getAuthSession();
  const userId = session?.user?.userId;

  const [isOnline, setIsOnline] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('');
  const [currentCoords, setCurrentCoords] = useState(
    session?.user?.currentLocation || null
  );
  const [showMapPicker, setShowMapPicker] = useState(false);

  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session?.token || !userId) {
      navigate('/login', { replace: true });
      return;
    }

    const loadStatus = async () => {
      try {
        const data = await fetchWithAuth(`/electrician/${userId}/status`);
        setIsOnline(Boolean(data.isOnline));
        setVerificationStatus(data.verificationStatus || '');

        if (
          data.currentLat != null &&
          data.currentLng != null &&
          (data.currentLat !== 0 || data.currentLng !== 0)
        ) {
          setCurrentCoords({ lat: data.currentLat, lng: data.currentLng });
        }
      } catch (err) {
        setError(err.message || 'Could not load availability status.');
      } finally {
        setLoading(false);
      }
    };

    loadStatus();
  }, [navigate, session?.token, userId]);

  const handleToggle = async () => {
    if (!userId) return;
    setError('');
    setMessage('');
    setToggling(true);

    const nextState = !isOnline;

    try {
      const res = await fetchWithAuth(`/electrician/${userId}/toggle-status`, {
        method: 'POST',
        body: JSON.stringify(nextState),
      });

      setIsOnline(Boolean(res.isOnline));
      setMessage(
        res.message ||
          (nextState
            ? 'You are now Online and visible for nearby jobs.'
            : 'You are now Offline.')
      );

      // Automatically refresh live GPS coordinates when going Online
      if (nextState) {
        const freshCoords = await syncElectricianBrowserLocation(userId);
        if (freshCoords) {
          setCurrentCoords(freshCoords);
        }
      }
    } catch (err) {
      setError(err.message || 'Unable to update availability status.');
    } finally {
      setToggling(false);
    }
  };

  const handleRefreshGps = async () => {
    if (!userId) return;
    setError('');
    setMessage('');
    setUpdatingLocation(true);

    try {
      const coords = await syncElectricianBrowserLocation(userId);
      if (coords) {
        setCurrentCoords(coords);
        setMessage(
          `Live GPS location updated (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}).`
        );
      } else {
        setError(
          'Browser location permission denied or unavailable. You can pin your location on the map below instead.'
        );
      }
    } finally {
      setUpdatingLocation(false);
    }
  };

  const handleMapLocationSelect = async (loc) => {
    if (!userId || !loc) return;
    const lat = loc.lat ?? loc.latitude;
    const lng = loc.lng ?? loc.longitude;
    if (lat == null || lng == null) return;

    setError('');
    setMessage('');
    setUpdatingLocation(true);

    try {
      const saved = await updateElectricianLocation(userId, lat, lng);
      if (saved) {
        setCurrentCoords(saved);
        setShowMapPicker(false);
        setMessage(
          `Service location updated to ${lat.toFixed(4)}, ${lng.toFixed(4)}.`
        );
      }
    } catch (err) {
      setError(err.message || 'Failed to save pinned location.');
    } finally {
      setUpdatingLocation(false);
    }
  };

  return (
    <div className="availability-page">
      <Link to="/electrician/dashboard" className="back-link">
        ← Back to Dashboard
      </Link>

      <h1>My Availability &amp; Live Location</h1>
      <p>
        Go online to receive job alerts within 10 km of your current service location.
      </p>

      {error && (
        <div
          style={{
            maxWidth: '550px',
            background: '#fee2e2',
            color: '#b91c1c',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      {message && (
        <div
          style={{
            maxWidth: '550px',
            background: '#dcfce7',
            color: '#166534',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px',
          }}
        >
          {message}
        </div>
      )}

      {/* Online / Offline Status Card */}
      <div className="availability-card" style={{ marginBottom: '22px' }}>
        <div className="availability-status">
          <span className={isOnline ? 'status-dot online' : 'status-dot offline'}></span>
          <h2>{loading ? 'Checking status...' : isOnline ? 'You are Online' : 'You are Offline'}</h2>
        </div>

        {verificationStatus && verificationStatus !== 'Approved' && (
          <p style={{ color: '#b45309', fontWeight: 600, marginBottom: '12px' }}>
            Verification Status: {verificationStatus} (Admin approval is required before going online)
          </p>
        )}

        <p>
          {isOnline
            ? 'You are active and can accept incoming job notifications near your current location.'
            : 'You will not receive new job notifications while offline.'}
        </p>

        <button
          className={
            isOnline
              ? 'availability-button offline-button'
              : 'availability-button online-button'
          }
          onClick={handleToggle}
          disabled={loading || toggling}
        >
          {toggling
            ? 'Updating...'
            : isOnline
            ? 'Go Offline'
            : 'Go Online'}
        </button>
      </div>

      {/* Live Service Location Card */}
      <div className="availability-card">
        <h2 style={{ marginTop: 0, marginBottom: '8px', color: '#1e293b' }}>
          📍 Current Service Location
        </h2>
        <p style={{ marginBottom: '16px' }}>
          Keep your location up to date whenever you move to a new area so nearby jobs match accurately.
        </p>

        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '12px 14px',
            marginBottom: '16px',
            fontSize: '14px',
            color: '#334155',
          }}
        >
          {currentCoords ? (
            <span>
              <strong>Active Coordinates:</strong> {currentCoords.lat.toFixed(5)},{' '}
              {currentCoords.lng.toFixed(5)}
            </span>
          ) : (
            <span>No active GPS coordinates saved yet.</span>
          )}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button
            type="button"
            className="primary-button"
            onClick={handleRefreshGps}
            disabled={updatingLocation}
          >
            {updatingLocation ? 'Updating Location...' : '📡 Update via Live GPS'}
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={() => setShowMapPicker((prev) => !prev)}
          >
            {showMapPicker ? 'Hide Map Picker' : '🗺️ Pin Location on Map'}
          </button>
        </div>

        {showMapPicker && (
          <div style={{ marginTop: '16px' }}>
            <LocationPicker onLocationSelect={handleMapLocationSelect} />
          </div>
        )}
      </div>
    </div>
  );
}