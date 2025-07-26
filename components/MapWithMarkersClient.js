// components/MapWithMarkersClient.js
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";

const defaultCenter = [3.139, 101.6869]; // Kuala Lumpur

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // in km
}

export default function MapWithMarkers({
  address,
  properties,
  priceRange,
  selectedTypes,
  triggerSearch,
}) {
  const [center, setCenter] = useState(defaultCenter);
  const [visibleProperties, setVisibleProperties] = useState([]);
  const radius = 5;

useEffect(() => {
  if (addressLocation && map) {
    map.setView(addressLocation, 13);
  }
}, [addressLocation]);

    const fetchCoords = async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
        );
        const data = await res.json();
        if (data && data[0]) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          setCenter([lat, lon]);
        }
      } catch (err) {
        console.error("Geocoding failed", err);
      }
    };

    fetchCoords();
  }, [address, triggerSearch]);

  useEffect(() => {
    const filtered = properties.filter((p) => {
      if (!p.latitude || !p.longitude) return false;
      const inPrice =
        p.price >= priceRange[0] && p.price <= priceRange[1];
      const inType =
        selectedTypes.length === 0 || selectedTypes.includes(p.type);
      const distance = haversineDistance(
        center[0],
        center[1],
        p.latitude,
        p.longitude
      );
      const inRadius = distance <= radius;
      return inPrice && inType && inRadius;
    });

    setVisibleProperties(filtered);
  }, [properties, center, priceRange, selectedTypes, triggerSearch]);

  return (
    <MapContainer center={center} zoom={13} style={{ height: "80vh", width: "100%" }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Circle center={center} radius={radius * 1000} color="blue" />
      {visibleProperties.map((p) => (
        <Marker key={p.id} position={[p.latitude, p.longitude]}>
          <Popup>
            <strong>{p.title}</strong><br />
            RM{p.price.toLocaleString()}<br />
            {p.type}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
