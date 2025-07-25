'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import PropertyCard from './PropertyCard';

// 修复默认 marker 图标问题
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// 计算两点之间距离
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function MapWithMarkersClient({
  properties = [],
  center,
  radius = 5000,
  priceRange = [10000, 50000000],
  selectedTypes = [],
}) {
  const [filteredProperties, setFilteredProperties] = useState([]);

  useEffect(() => {
    if (!center) return;

    const filtered = properties.filter((p) => {
      if (!p.lat || !p.lng) return false;

      const inPriceRange = p.price >= priceRange[0] && p.price <= priceRange[1];
      const inType = selectedTypes.length === 0 || selectedTypes.includes(p.type);

      const dist = getDistanceFromLatLonInKm(center.lat, center.lng, p.lat, p.lng);
      const inCircle = dist <= radius / 1000;

      return inPriceRange && inType && inCircle;
    });

    setFilteredProperties(filtered);
  }, [properties, center, radius, priceRange, selectedTypes]);

  return (
    <div className="w-full h-full">
      {center ? (
        <MapContainer center={[center.lat, center.lng]} zoom={14} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Circle center={[center.lat, center.lng]} radius={radius} pathOptions={{ color: 'blue', fillOpacity: 0.1 }} />
          {filteredProperties.map((property) => (
            <Marker key={property.id} position={[property.lat, property.lng]}>
              <Popup>
                <PropertyCard property={property} />
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      ) : (
        <div className="text-center mt-40 text-gray-600">请先搜索地址</div>
      )}
    </div>
  );
}
