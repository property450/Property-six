'use client';

import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import L from 'leaflet';
import { supabase } from '../supabaseClient';

const defaultCenter = [3.139, 101.6869]; // 吉隆坡
const defaultZoom = 13;

const markerIcon = new L.Icon({
  iconUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export default function MapWithMarkersClient({ searchLat, searchLng, radius = 5 }) {
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    const fetchProperties = async () => {
      const { data, error } = await supabase.from('properties').select('*');
      if (error) {
        console.error('Failed to fetch properties:', error.message);
        return;
      }
      setProperties(data);
    };
    fetchProperties();
  }, []);

  const center = searchLat && searchLng ? [searchLat, searchLng] : defaultCenter;

  const filteredProperties = properties.filter((property) => {
    const lat = property.lat || property.latitude;
    const lng = property.lng || property.longitude;
    if (lat == null || lng == null) return false;

    if (!searchLat || !searchLng) return true;

    const distance = L.latLng(searchLat, searchLng).distanceTo([lat, lng]) / 1000;
    return distance <= radius;
  });

  return (
    <MapContainer center={center} zoom={defaultZoom} style={{ height: '600px', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {searchLat && searchLng && (
        <Circle
          center={[searchLat, searchLng]}
          radius={radius * 1000}
          pathOptions={{ color: 'blue', fillOpacity: 0.2 }}
        />
      )}

      {filteredProperties.map((property) => {
        const lat = property.lat || property.latitude;
        const lng = property.lng || property.longitude;
        if (lat == null || lng == null) return null;

        return (
          <Marker
            key={property.id}
            position={[lat, lng]}
            icon={markerIcon}
          >
            <Popup>
              <div>
                <strong>{property.title}</strong><br />
                {property.address || 'No address'}<br />
                Price: {property.price || 'N/A'}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
