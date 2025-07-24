import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

export default function MapWithMarkers({ center, radius, properties }) {
  const defaultPosition = center || { lat: 3.139, lng: 101.6869 }; // Kuala Lumpur fallback

  return (
    <MapContainer center={defaultPosition} zoom={13} scrollWheelZoom style={{ height: '100%' }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {center && (
        <Circle
          center={center}
          radius={radius * 1000}
          pathOptions={{ fillColor: 'blue', fillOpacity: 0.2, color: 'blue' }}
        />
      )}

      {properties.map((property) => {
        const lat = parseFloat(property.lat);
        const lng = parseFloat(property.lng);
        if (isNaN(lat) || isNaN(lng)) return null;

        return (
          <Marker key={property.id} position={[lat, lng]}>
            <Popup>
              <div>
                <h2>{property.title}</h2>
                <p>{property.description}</p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
