
import React, { useState } from 'react';
import LeafletMap from './LeafletMap';

const LocationPicker = ({ onLocationSelect }) => {
  const [currentLocation, setCurrentLocation] = useState([
    6.9271,
    79.8612
  ]);

  const handleConfirm = () => {
    if (onLocationSelect) {
      onLocationSelect({
        latitude: currentLocation[0],
        longitude: currentLocation[1]
      });
    }

    alert('Job location selected successfully!');
  };

  return (
    <div className="location-picker">
      <h3 className="location-title">Select Job Location</h3>

      <p className="location-instruction">
        Move the map and click on the location where you need
        electrical service. The marker will show your selected location.
      </p>

      <LeafletMap
        center={currentLocation}
        position={currentLocation}
        zoom={13}
        onPositionChange={setCurrentLocation}
      />

      <div className="coordinates-box">
        <strong>Selected Coordinates</strong>
        <p>Latitude: {currentLocation[0].toFixed(6)}</p>
        <p>Longitude: {currentLocation[1].toFixed(6)}</p>
      </div>

      <button
        type="button"
        className="primary-button"
        onClick={handleConfirm}
      >
        Confirm Location
      </button>
    </div>
  );
};

export default LocationPicker;
