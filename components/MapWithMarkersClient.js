import { MapContainer, TileLayer, Marker, Circle, Popup } from 'react-leaflet';
import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const icon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function isWithinRadius(property, center, radius) {
  if (!property.lat || !property.lng) return false;
  const toRad = (val) => (val * Math.PI) / 180;
  const [clat, clng] = center;
  const dLat = toRad(property.lat - clat);
  const dLng = toRad(property.lng - clng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(clat)) * Math.cos(toRad(property.lat)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = 6371 * c; // 地球半径 km
  return distance <= radius;
}

export default function MapWithMarkersClient({ properties, center, radius }) {
  const [visibleProperties, setVisibleProperties] = useState([]);

  useEffect(() => {
    if (center && radius && properties.length) {
      const filtered = properties.filter((p) => isWithinRadius(p, center, radius));
      setVisibleProperties(filtered);
    }
  }, [center, radius, properties]);

  if (!center || center.length !== 2 || center.includes(undefined)) return <div>Invalid center</div>;

  return (
    <MapContainer center={center} zoom={13} style={{ height: '80vh', width: '100%' }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Circle center={center} radius={radius * 1000} pathOptions={{ color: 'blue' }} />
      {visibleProperties.map((property) => (
        <Marker
          key={property.id}
          position={[property.lat, property.lng]}
          icon={icon}
        >
          <Popup>
            <strong>{property.title}</strong><br />
            Price: {property.price}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
