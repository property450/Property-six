// components/MapWithMarkersClient.js
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';

export default function MapWithMarkersClient({ center, properties, radiusKm }) {
  useEffect(() => {
    // 解决默认图标不显示的问题
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);

  return (
    <MapContainer
      center={center || [3.139, 101.6869]} // 默认吉隆坡
      zoom={center ? 14 : 12}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%' }}
      key={center ? `${center.lat}-${center.lng}` : 'default'}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {center && (
        <Circle
          center={center}
          radius={radiusKm * 1000} // km -> meters
          pathOptions={{ color: 'blue', fillOpacity: 0.1 }}
        />
      )}

      {properties &&
        properties.map((property) => (
          <Marker
            key={property.id}
            position={[property.latitude, property.longitude]}
          >
            <Popup>
              <strong>{property.title}</strong>
              <br />
              {property.price} MYR
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}
