import React, { useState } from 'react';
import LeafletMap from './LeafletMap';

const LocationPicker = ({ onLocationSelect }) => {
  const [currentLocation, setCurrentLocation] = useState([6.9271, 79.8612]); // Default: Colombo

  const handleConfirm = () => {
    if (onLocationSelect) onLocationSelect(currentLocation);
    alert(`Location Confirmed: ${currentLocation}`);
  };

  return (
    <div className="flex flex-col space-y-4">
      <h3 className="font-semibold text-gray-700">Pin your location</h3>
      <LeafletMap center={currentLocation} />
      <button 
        onClick={handleConfirm}
        className="bg-green-600 text-white py-2 rounded hover:bg-green-700 font-bold"
      >
        Confirm Location
      </button>
    </div>
  );
};

export default LocationPicker;