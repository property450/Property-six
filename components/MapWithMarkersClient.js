// components/MapWithMarkersClient.js
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';

export default function MapWithMarkersClient({
  properties = [],
  center = [3.139, 101.6869], // 默认吉隆坡
  radius = 0,
}) {
  const [mapCenter, setMapCenter] = useState(center);

  useEffect(() => {
    if (center[0] !== undefined && center[1] !== undefined) {
      setMapCenter(center);
    }
  }, [center]);

  return (
    <MapContainer center={mapCenter} zoom={13} style={{ height: '500px', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {radius > 0 && (
        <Circle center={mapCenter} radius={radius} pathOptions={{ color: 'blue' }} />
      )}

      {properties.map((property) => {
        const lat = property.latitude;
        const lng = property.longitude;

        if (!lat || !lng) return null;

        return (
          <Marker key={property.id} position={[lat, lng]}>
            <Popup>
              <div>
                <strong>{property.title}</strong>
                <br />
                {property.address}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
