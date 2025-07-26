'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { supabase } from '@/supabaseClient';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useRouter } from 'next/router';

const customIcon = new L.Icon({
  iconUrl: '/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: '/marker-shadow.png',
  shadowSize: [41, 41],
});

export default function MapWithMarkersClient({ addressLocation, distance, selectedType, minPrice, maxPrice }) {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const router = useRouter();

  // 加载房源数据
  useEffect(() => {
    const fetchProperties = async () => {
      const { data, error } = await supabase.from('properties').select('*');
      if (error) {
        console.error('Error fetching properties:', error);
      } else {
        setProperties(data);
      }
    };
    fetchProperties();
  }, []);

  // 筛选房源
  useEffect(() => {
    if (!addressLocation || !addressLocation.lat || !addressLocation.lng) {
      setFilteredProperties([]);
      return;
    }

    const filter = properties.filter((property) => {
      const { lat, lng, type, price } = property;
      if (!lat || !lng) return false;

      // 筛选类型
      const typeMatch = !selectedType || property.type?.toLowerCase().includes(selectedType.toLowerCase());

      // 筛选价格
      const priceMatch = (!minPrice || price >= minPrice) && (!maxPrice || price <= maxPrice);

      // 筛选距离
      const d = getDistanceFromLatLngInKm(addressLocation.lat, addressLocation.lng, lat, lng);
      const distanceMatch = !distance || d <= Number(distance);

      return typeMatch && priceMatch && distanceMatch;
    });

    setFilteredProperties(filter);
  }, [properties, addressLocation, distance, selectedType, minPrice, maxPrice]);

  // 地图中心
  const mapCenter = addressLocation?.lat && addressLocation?.lng
    ? [addressLocation.lat, addressLocation.lng]
    : [3.139, 101.6869]; // 默认吉隆坡

  return (
    <MapContainer center={mapCenter} zoom={13} style={{ height: '600px', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* 搜索地址位置圆圈 */}
      {addressLocation?.lat && addressLocation?.lng && !isNaN(Number(distance)) && (
        <Circle
          center={[addressLocation.lat, addressLocation.lng]}
          radius={Number(distance) * 1000}
          pathOptions={{ color: 'blue', fillOpacity: 0.2 }}
        />
      )}

      {/* 显示筛选后的房源 */}
      {filteredProperties.map((property) => (
        <Marker
          key={property.id}
          position={[property.lat, property.lng]}
          icon={customIcon}
          eventHandlers={{
            click: () => router.push(`/property/${property.id}`),
          }}
        >
          <Popup>
            <strong>{property.title}</strong><br />
            RM{property.price?.toLocaleString()}<br />
            {property.address}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

// 计算两个经纬度之间的距离（单位：km）
function getDistanceFromLatLngInKm(lat1, lng1, lat2, lng2) {
  const R = 6371; // 地球半径 km
  const dLat = deg2rad(lat2 - lat1);
  const dLng = deg2rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
