import React, { useState } from 'react';

export default function ToggleAvailability() {
  const [isOnline, setIsOnline] = useState(false);

  const handleToggle = () => {
    setIsOnline(!isOnline);
  };

  return (
    <div className="availability-page">
      <h1>My Availability</h1>
      <p>Manage whether customers can find you for new jobs.</p>

      <div className="availability-card">
        <div className="availability-status">
          <span className={isOnline ? 'status-dot online' : 'status-dot offline'}></span>
          <h2>{isOnline ? 'You are Online' : 'You are Offline'}</h2>
        </div>

        <p>
          {isOnline
            ? 'You can now receive new job requests.'
            : 'You will not receive new job requests while offline.'}
        </p>

        <button
          className={isOnline ? 'availability-button offline-button' : 'availability-button online-button'}
          onClick={handleToggle}
        >
          {isOnline ? 'Go Offline' : 'Go Online'}
        </button>
      </div>
    </div>
  );
}