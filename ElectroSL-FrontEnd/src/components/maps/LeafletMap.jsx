import React from 'react';
// import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'; // Uncomment after installing react-leaflet

const LeafletMap = ({ center = [6.9271, 79.8612], zoom = 13 }) => {
  return (
    <div className="h-64 w-full bg-gray-200 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-400">
      <div className="text-center text-gray-500">
        <p>🗺️ OpenStreetMap (Leaflet) Placeholder</p>
        <p className="text-sm">Center: {center[0]}, {center[1]}</p>
        {/* 
        <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} className="h-full w-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={center}><Popup>Job Location</Popup></Marker>
        </MapContainer>
        */}
      </div>
    </div>
  );
};

export default LeafletMap;