'use client';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { useRouter } from 'next/router';
import Image from 'next/image';

// 修复 Leaflet 默认图标路径问题
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function MapWithMarkersClient({
  properties = [],
  centerLat,
  centerLng,
  radiusKm = 5
}) {
  const router = useRouter();

  // 防止 undefined 导致 Map 崩溃
  const isValidLat = typeof centerLat === 'number' && !isNaN(centerLat);
  const isValidLng = typeof centerLng === 'number' && !isNaN(centerLng);

  const center = {
    lat: isValidLat ? centerLat : 3.139,      // 吉隆坡默认值
    lng: isValidLng ? centerLng : 101.6869
  };

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      scrollWheelZoom={true}
      style={{ height: '600px', width: '100%', borderRadius: '12px' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      <Circle
        center={[center.lat, center.lng]}
        radius={radiusKm * 1000}
        pathOptions={{ color: 'blue', fillOpacity: 0.1 }}
      />

      {properties.map((property) => {
        const firstImage = property.images?.[0]?.url || '/no-image.jpg';

        return (
          <Marker
            key={property.id}
            position={[property.latitude, property.longitude]}
          >
            <Popup maxWidth={260} minWidth={200}>
              <div className="space-y-2 text-sm">
                <Image
                  src={firstImage}
                  alt={property.title}
                  width={240}
                  height={160}
                  className="rounded-lg object-cover w-full h-32"
                />
                <div className="font-semibold truncate">{property.title}</div>
                <div className="text-red-500 font-bold">RM {property.price}</div>
                <div className="text-gray-500">{property.location}</div>
                <button
                  onClick={() => router.push(`/property/${property.id}`)}
                  className="mt-1 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-xs"
                >
                  查看更多
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
