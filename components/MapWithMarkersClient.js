'use client';
import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export default function MapWithMarkersClient({
  properties = [],
  location,
  distance = 5,
  priceRange = { min: 0, max: Infinity },
  selectedType = '',
}) {
  const [center, setCenter] = useState([3.139, 101.686]); // Kuala Lumpur default

  useEffect(() => {
    if (location?.lat && location?.lng) {
      setCenter([location.lat, location.lng]);
    }
  }, [location]);

  const filtered = useMemo(() => {
    return properties.filter((property) => {
      const lat = parseFloat(property.lat);
      const lng = parseFloat(property.lng);
      const price = parseFloat(property.price);

      if (
        isNaN(lat) ||
        isNaN(lng) ||
        isNaN(price) ||
        lat === 0 ||
        lng === 0
      ) return false;

      const d = location?.lat
        ? getDistanceFromLatLngInKm(lat, lng, location.lat, location.lng)
        : 0;

      const withinDistance = d <= distance;
      const withinPrice =
        (!priceRange.min || price >= priceRange.min) &&
        (!priceRange.max || price <= priceRange.max);
      const matchesType = !selectedType || property.type === selectedType;

      return withinDistance && withinPrice && matchesType;
    });
  }, [properties, location, distance, priceRange, selectedType]);

  return (
    <MapContainer center={center} zoom={13} scrollWheelZoom style={{ height: '500px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      {location?.lat && location?.lng && (
        <Circle
          center={[location.lat, location.lng]}
          radius={distance * 1000}
          pathOptions={{ color: 'blue', fillOpacity: 0.1 }}
        />
      )}
      {filtered.map((property) => (
        <Marker
          key={property.id}
          position={[parseFloat(property.lat), parseFloat(property.lng)]}
          icon={defaultIcon}
        >
          <Popup>
            <strong>{property.title}</strong><br />
            RM {property.price}<br />
            {property.type}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

function getDistanceFromLatLngInKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLng = deg2rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
    Math.cos(deg2rad(lat2)) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
