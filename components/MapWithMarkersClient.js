'use client';

import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';

const defaultCenter = { lat: 3.139, lng: 101.6869 };
const defaultRadius = 5000;

export default function MapWithMarkersClient({ properties, center = defaultCenter, radius = defaultRadius }) {
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [filteredProperties, setFilteredProperties] = useState([]);

  useEffect(() => {
    if (center?.lat && center?.lng) {
      setMapCenter(center);
    }
  }, [center]);

  useEffect(() => {
    const filtered = properties.filter((p) => {
      if (!p.latitude || !p.longitude) return false;
      const dist = L.latLng(center.lat, center.lng).distanceTo([p.latitude, p.longitude]);
      return dist <= radius;
    });
    setFilteredProperties(filtered);
  }, [center, radius, properties]);

  return (
    <MapContainer
      center={[mapCenter.lat, mapCenter.lng]}
      zoom={13}
      scrollWheelZoom={true}
      style={{ height: '600px', width: '100%', borderRadius: '12px' }}
    >
      <TileLayer
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Circle center={[mapCenter.lat, mapCenter.lng]} radius={radius} pathOptions={{ color: 'blue' }} />

      {filteredProperties.map((property) => (
        <Marker key={property.id} position={[property.latitude, property.longitude]}>
          <Popup>
            <div>
              <strong>{property.title}</strong>
              <br />
              {property.address}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
