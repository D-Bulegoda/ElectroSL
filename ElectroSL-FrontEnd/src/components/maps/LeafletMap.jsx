
import React from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents
} from 'react-leaflet';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix default Leaflet marker icons in Vite
const customIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Detect clicks on the map
function MapClickHandler({ onPositionChange }) {
  useMapEvents({
    click(event) {
      if (onPositionChange) {
        onPositionChange([
          event.latlng.lat,
          event.latlng.lng
        ]);
      }
    }
  });

  return null;
}

const LeafletMap = ({
  center = [6.9271, 79.8612],
  zoom = 13,
  position = center,
  onPositionChange
}) => {
  return (
    <div className="leaflet-map-wrapper">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{
          height: '350px',
          width: '100%',
          borderRadius: '10px'
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler
          onPositionChange={onPositionChange}
        />

        <Marker position={position} icon={customIcon}>
          <Popup>Selected Job Location</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default LeafletMap;
