"use client";

import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
  crossOrigin: true,
});

export default function MapWithMarkersClient({ properties, center, radius }) {
  if (!center) return <p className="text-center mt-4">Please enter an address to search.</p>;

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: "600px", width: "100%" }}
      scrollWheelZoom={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {radius && center && (
        <Circle
          center={center}
          radius={radius * 1000}
          pathOptions={{ color: "blue", fillOpacity: 0.1 }}
        />
      )}
      {properties
  .filter((property) => {
    const distance = L.latLng(property.lat, property.lng).distanceTo(L.latLng(center[0], center[1]));
    return distance <= radius * 1000; // 半径 km -> 米
  })
  .map((property) => (
    <Marker
      key={property.id}
      position={[property.lat, property.lng]}
    >
      <Popup>
        <div>
          <h3 className="font-bold">{property.title}</h3>
          <p>{property.price} RM</p>
          <p>{property.address}</p>
        </div>
      </Popup>
    </Marker>
  ))}
