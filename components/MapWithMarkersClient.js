// components/MapWithMarkersClient.js
import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';

function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

export default function MapWithMarkersClient({ properties, center, radius }) {
  const mapRef = useRef();

  return (
    <MapContainer
      center={center || [3.139, 101.6869]} // Default: Kuala Lumpur
      zoom={13}
      scrollWheelZoom={true}
      style={{ height: '500px', width: '100%' }}
      ref={mapRef}
    >
      <ChangeView center={center} zoom={13} />
      <TileLayer
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {center && radius && (
        <Circle center={center} radius={radius} pathOptions={{ color: 'blue', fillOpacity: 0.2 }} />
      )}
      {properties?.map((property) => (
        <Marker key={property.id} position={[property.latitude, property.longitude]}>
          <Popup>
            <strong>{property.title}</strong><br />
            {property.address}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
