'use client';

import dynamic from 'next/dynamic';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

// 解决默认图标问题
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function MapWithMarkersClient({ properties }) {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;
  }, []);

  return (
    <MapContainer
      center={[3.139, 101.6869]}
      zoom={12}
      scrollWheelZoom={true}
      style={{ height: '600px', width: '100%', borderRadius: '12px' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      {properties.map((property) =>
        property.lat && property.lng ? (
          <Marker
            key={property.id}
            position={[property.lat, property.lng]}
            eventHandlers={{
              click: () => router.push(`/property/${property.id}`),
            }}
          >
            <Popup>
              <div>
                <strong>{property.title}</strong>
                <br />
                RM {property.price}
              </div>
            </Popup>
          </Marker>
        ) : null
      )}
    </MapContainer>
  );
}
