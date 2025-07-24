// components/MapWithMarkersClient.js
import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

const centerDefault = [3.139, 101.6869]; // 吉隆坡默认坐标

function Recenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 14);
    }
  }, [center]);
  return null;
}

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function MapWithMarkersClient({ center, radius = 5000, properties = [] }) {
  const mapRef = useRef();

  return (
    <MapContainer
      center={center || centerDefault}
      zoom={13}
      scrollWheelZoom={true}
      style={{ height: '500px', width: '100%' }}
      ref={mapRef}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
      />

      {center && (
        <>
          <Marker position={center} icon={customIcon}>
            <Popup>{`Search Center`}</Popup>
          </Marker>
          <Circle center={center} radius={radius} pathOptions={{ color: 'blue' }} />
        </>
      )}

      {properties.map((property) => (
        <Marker
          key={property.id}
          position={[property.latitude, property.longitude]}
          icon={customIcon}
        >
          <Popup>
            <div>
              <strong>{property.title}</strong>
              <p>{property.description}</p>
            </div>
          </Popup>
        </Marker>
      ))}

      <Recenter center={center} />
    </MapContainer>
  );
}
