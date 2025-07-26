// components/MapWithMarkersClient.js
"use client";

import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function MapWithMarkersClient({ properties, center, radius }) {
  const [mapCenter, setMapCenter] = useState(center);

  useEffect(() => {
    if (center && center.lat && center.lng) {
      setMapCenter(center);
    }
  }, [center]);

  return (
    <MapContainer center={mapCenter} zoom={13} style={{ height: "600px", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
      />
      {radius && center && (
        <Circle center={center} radius={radius} pathOptions={{ color: 'blue', fillOpacity: 0.1 }} />
      )}
      {properties.map((property) => (
        <Marker
          key={property.id}
          position={[property.lat, property.lng]}
          icon={markerIcon}
        >
          <Popup>
            <div>
              <h3>{property.title}</h3>
              <p>{property.price} RM</p>
              <p>{property.address}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
