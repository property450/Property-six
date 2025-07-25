// components/MapWithMarkersClient.js
'use client';
import { MapContainer, TileLayer, Marker, Circle, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';

export default function MapWithMarkers({ center, radius, properties }) {
  useEffect(() => {
    // 修复默认图标不显示的问题
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);

  if (!center) return <div className="text-center text-gray-500">请输入地址后查看地图</div>;

  return (
    <MapContainer center={center} zoom={14} scrollWheelZoom style={{ height: '500px', width: '100%' }}>
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Circle center={center} radius={radius * 1000} pathOptions={{ color: 'blue' }} />
      {properties.map((property) => (
        <Marker key={property.id} position={[property.lat, property.lng]}>
          <Popup>
            <div>
              <strong>{property.title}</strong><br />
              {property.price ? `RM${property.price}` : ''}<br />
              {property.address}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
