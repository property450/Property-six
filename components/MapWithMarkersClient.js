'use client';

import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MapWithMarkersClient = ({ properties, center, radius, priceRange, selectedType }) => {
  const [filteredProperties, setFilteredProperties] = useState([]);

  useEffect(() => {
    if (!center || !radius || !Array.isArray(properties)) return;

    const filtered = properties.filter((property) => {
      if (!property.latitude || !property.longitude || !property.price) return false;

      const distanceToProperty = L.latLng(center[0], center[1]).distanceTo(
        L.latLng(property.latitude, property.longitude)
      );

      const withinDistance = distanceToProperty <= radius;

      let withinPrice = true;
      if (priceRange) {
        if (priceRange.min !== undefined) {
          withinPrice = withinPrice && property.price >= priceRange.min;
        }
        if (priceRange.max !== undefined) {
          withinPrice = withinPrice && property.price <= priceRange.max;
        }
      }

      const matchesType =
        !selectedType || property.type?.toLowerCase().includes(selectedType.toLowerCase());

      return withinDistance && withinPrice && matchesType;
    });

    setFilteredProperties(filtered);
  }, [properties, center, radius, priceRange, selectedType]);

  const icon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    shadowSize: [41, 41],
  });

  if (!center) return null;

  return (
    <MapContainer center={center} zoom={13} style={{ height: '600px', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Circle center={center} radius={radius} pathOptions={{ fillColor: 'blue' }} />

      {filteredProperties.map((property) => (
        <Marker
          key={property.id}
          position={[property.latitude, property.longitude]}
          icon={icon}
        >
          <Popup>
            <strong>{property.title}</strong><br />
            RM {property.price?.toLocaleString()}<br />
            {property.type}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapWithMarkersClient;
