import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function MapWithMarkersClient({
  properties = [],
  center = [3.139, 101.6869],
  radius = 5000,
  priceRange = {},
  selectedType,
}) {
  const [filteredProperties, setFilteredProperties] = useState([]);

  useEffect(() => {
    const filterProperties = () => {
      return properties.filter((property) => {
        const lat = Number(property.lat);
        const lng = Number(property.lng);
        if (!lat || !lng) return false;

        const distance = getDistanceFromLatLonInKm(center[0], center[1], lat, lng) * 1000;
        const withinDistance = distance <= radius;

        const withinPrice =
          (!priceRange.min || property.price >= priceRange.min) &&
          (!priceRange.max || property.price <= priceRange.max);

        const matchesType = !selectedType || property.type === selectedType;

        return withinDistance && withinPrice && matchesType;
      });
    };

    setFilteredProperties(filterProperties());
  }, [properties, center, radius, priceRange, selectedType]);

  return (
    <MapContainer center={center} zoom={13} style={{ height: '500px', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Circle center={center} radius={radius} pathOptions={{ fillColor: 'blue' }} />
      {filteredProperties.map((property) => (
        <Marker key={property.id} position={[property.lat, property.lng]} icon={markerIcon}>
          <Popup>
            <strong>{property.title}</strong>
            <br />
            RM {property.price?.toLocaleString()}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

// Haversine formula
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
