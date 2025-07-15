// components/MapWithMarkers.js
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import Link from 'next/link';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function MapWithMarkers({ properties }) {
  return (
    <MapContainer
      center={[3.139, 101.6869]} // 可换成吉隆坡坐标或你设定的中心
      zoom={12}
      style={{ height: '600px', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      {properties.map((property) =>
        property.lat && property.lng ? (
          <Marker key={property.id} position={[property.lat, property.lng]}>
            <Popup>
              <div>
                <strong>{property.title}</strong><br />
                RM {property.price}<br />
                <Link href={`/property/${property.id}`}>
                  <span className="text-blue-600 underline">查看详情</span>
                </Link>
              </div>
            </Popup>
          </Marker>
        ) : null
      )}
    </MapContainer>
  );
}
