'use client';

import dynamic from 'next/dynamic';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useEffect, useState } from 'react';

// 修复默认图标
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// 工具函数：计算两点间距离（单位：km）
function getDistanceInKm(lat1, lng1, lat2, lng2) {
  const toRad = (val) => (val * Math.PI) / 180;
  const R = 6371; // 地球半径 km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function MapWithMarkersClient({
  properties,
  centerLat,
  centerLng,
  radiusKm = 5, // 默认半径 5km
}) {
  const router = useRouter();
  const [filteredProperties, setFilteredProperties] = useState([]);

  useEffect(() => {
    if (!centerLat || !centerLng) {
      setFilteredProperties(properties);
    } else {
      const withinRadius = properties.filter((p) => {
        if (!p.lat || !p.lng) return false;
        const distance = getDistanceInKm(centerLat, centerLng, p.lat, p.lng);
        return distance <= radiusKm;
      });
      setFilteredProperties(withinRadius);
    }
  }, [properties, centerLat, centerLng, radiusKm]);

  return (
    <MapContainer
      center={[centerLat || 3.139, centerLng || 101.6869]}
      zoom={12}
      scrollWheelZoom={true}
      style={{ height: '600px', width: '100%', borderRadius: '12px' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      {centerLat && centerLng && (
        <Circle
          center={[centerLat, centerLng]}
          radius={radiusKm * 1000} // 转换成米
          pathOptions={{
            color: 'blue',
            fillColor: 'blue',
            fillOpacity: 0.15,
            weight: 1,
          }}
        />
      )}

      {filteredProperties.map((property) => {
        const firstImage = property.images?.[0]?.url || '/no-image.jpg';

        return (
          <Marker key={property.id} position={[property.lat, property.lng]}>
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
                <div className="text-red-500 font-bold">
                  RM {property.price}
                </div>
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
