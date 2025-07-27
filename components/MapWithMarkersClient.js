"use client";

import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

export default function MapWithMarkersClient({ properties, center, radius }) {
  const markerIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    shadowSize: [41, 41],
    crossOrigin: true,
  });

  if (!center || !radius) {
    return <p className="text-center mt-4">Please enter an address to search.</p>;
  }

  const centerLatLng = L.latLng(
  Number(center[0]),
  Number(center[1])
);

  console.log("🧭 Center:", centerLatLng);
  console.log("📍 Properties (filtered):", properties);

  return (
    <MapContainer
      center={centerLatLng}
      zoom={13}
      style={{ height: "600px", width: "100%" }}
      scrollWheelZoom={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      <Circle
        center={centerLatLng}
        radius={radius * 1000}
        pathOptions={{ color: "blue", fillOpacity: 0.1 }}
      />

      {properties
        .filter(
          (property) =>
            property.lat != null &&
            property.lng != null &&
            !isNaN(property.lat) &&
            !isNaN(property.lng)
        )
        .map((property) => {
          console.log("📌 Showing Marker:", property.title);
          return (
            <Marker
              key={property.id}
              position={[Number(property.lat), Number(property.lng)]}
              icon={markerIcon}
            >
              <Popup>
                <div>
                  <h3 className="font-bold">{property.title}</h3>
                  <p>{property.price} RM</p>
                  <p>{property.address}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
    </MapContainer>
  );
}
