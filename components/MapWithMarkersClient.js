// components/MapWithMarkersClient.js
'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export default function MapWithMarkersClient({
  properties = [],
  location,
  distance = 5,
  priceRange = { min: 0, max: 50000000 },
  selectedType = '',
}) {
  const [filtered, setFiltered] = useState([]);

  useEffect(() => {
    if (!location) {
      setFiltered([]);
      return;
    }

    const filteredData = properties.filter((property) => {
      if (!property.lat || !property.lng) return false;

      const distanceToProperty = L.latLng(location.lat, location.lng).distanceTo(
        L.latLng(property.lat, property.lng)
      ) / 1000;

      const withinDistance = distanceToProperty <= distance;
      const withinPrice =
        property.price >= (priceRange.min || 0) &&
        property.price <= (priceRange.max || 50000000);
      const matchesType =
        !selectedType || property.type?.toLowerCase().includes(selectedType.toLowerCase());

      return withinDistance && withinPrice && matchesType;
    });

    setFiltered(filteredData);
  }, [properties, location, distance, priceRange, selectedType]);

  if (!location) return <p className="p-4">🗺️ 请输入地址后显示地图。</p>;

  return (
    <MapContainer center={[location.lat, location.lng]} zoom={13} style={{ height: '500px', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Circle
        center={[location.lat, location.lng]}
        radius={distance * 1000}
        pathOptions={{ fillColor: 'blue', color: 'blue', opacity: 0.2, fillOpacity: 0.1 }}
      />
      {filtered.map((property) => (
        <Marker key={property.id} position={[property.lat, property.lng]} icon={markerIcon}>
          <Popup>
            <strong>{property.title}</strong>
            <br />
            RM {property.price?.toLocaleString?.()}
            <br />
            {property.type}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
