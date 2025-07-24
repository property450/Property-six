// components/MapWithMarkersClient.js
'use client';

import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// 默认 Marker icon 修复
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
});

export default function MapWithMarkers({ center, radius, properties }) {
  const [map, setMap] = useState(null);

  useEffect(() => {
    if (map && center) {
      map.setView([center.lat, center.lng], 14);
    }
  }, [center, map]);

  return (
    <div className="h-[600px] w-full">
      <MapContainer center={center || [3.139, 101.6869]} zoom={13} scrollWheelZoom style={{ height: '100%', width: '100%' }} whenCreated={setMap}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {center && (
          <Circle
            center={[center.lat, center.lng]}
            radius={radius * 1000}
            pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.2 }}
          />
        )}

        {properties.map((property, index) => (
          <Marker
            key={index}
            position={[property.lat, property.lng]}
          />
        ))}
      </MapContainer>
    </div>
  );
}
