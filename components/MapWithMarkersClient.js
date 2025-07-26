// components/MapWithMarkersClient.js
"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const customIcon = new L.Icon({
  iconUrl: "/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export default function MapWithMarkersClient({ center, properties, distance }) {
  const [map, setMap] = useState(null);

  useEffect(() => {
    if (map && center?.lat && center?.lng) {
      map.setView([center.lat, center.lng], 13);
    }
  }, [map, center]);

  const isWithinRadius = (propertyLat, propertyLng) => {
    if (!center?.lat || !center?.lng || isNaN(distance)) return false;
    const R = 6371; // Earth radius in km
    const dLat = ((propertyLat - center.lat) * Math.PI) / 180;
    const dLng = ((propertyLng - center.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((center.lat * Math.PI) / 180) *
        Math.cos((propertyLat * Math.PI) / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d <= distance;
  };

  return (
    <MapContainer
      center={[center?.lat || 3.139, center?.lng || 101.6869]}
      zoom={13}
      style={{ height: "600px", width: "100%" }}
      whenCreated={setMap}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {center?.lat && center?.lng && !isNaN(distance) && (
        <Circle
          center={[center.lat, center.lng]}
          radius={distance * 1000}
          pathOptions={{ fillColor: "blue" }}
        />
      )}

      {properties
        .filter(
          (property) =>
            property.latitude &&
            property.longitude &&
            isWithinRadius(property.latitude, property.longitude)
        )
        .map((property) => (
          <Marker
            key={property.id}
            position={[property.latitude, property.longitude]}
            icon={customIcon}
          >
            <Popup>
              <div>
                <strong>{property.title}</strong>
                <br />
                RM {property.price?.toLocaleString?.() || "-"}
              </div>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}
