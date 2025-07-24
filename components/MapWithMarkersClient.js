// components/MapWithMarkersClient.js
'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function MapWithMarkersClient({ center, properties, radius }) {
  useEffect(() => {
    delete L.Icon.Default.prototype._getIconUrl;

    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }, []);

  if (!center) {
    return (
      <div className="text-center mt-10 text-gray-500">Enter an address to view map.</div>
    );
  }

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      scrollWheelZoom={true}
      style={{ height: '600px', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* 中心点圆圈 */}
      <Circle
        center={[center.lat, center.lng]}
        radius={radius * 1000}
        pathOptions={{ fillColor: 'blue', color: 'blue', fillOpacity: 0.2 }}
      />

      {/* 房源标记 */}
      {properties.map((property) => (
        <Marker
          key={property.id}
          position={[property.latitude, property.longitude]}
        >
          <Popup>
            <div>
              <strong>{property.title}</strong>
              <br />
              {property.address}
              <br />
              RM {property.price}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
