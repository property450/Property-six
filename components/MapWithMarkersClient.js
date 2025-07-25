'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from '../supabaseClient';
import Link from 'next/link';

// 默认坐标（吉隆坡）
const defaultCenter = [3.139, 101.6869];

// 修复默认图标
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
});

export default function MapWithMarkersClient({
  center = defaultCenter,
  radius = 5000,
  minPrice,
  maxPrice,
  selectedTypes = [],
}) {
  const [properties, setProperties] = useState([]);
  const [mapCenter, setMapCenter] = useState(center);

  useEffect(() => {
    setMapCenter(center);
  }, [center]);

  useEffect(() => {
    const fetchProperties = async () => {
      let { data, error } = await supabase.from('properties').select('*');

      if (error) {
        console.error('Error fetching properties:', error);
        return;
      }

      const filtered = data.filter((p) => {
        const inPriceRange =
          (!minPrice || p.price >= minPrice) &&
          (!maxPrice || p.price <= maxPrice);

        const inType =
          selectedTypes.length === 0 || selectedTypes.includes(p.type);

        const inCircle = p.lat && p.lng && getDistanceFromLatLonInKm(center[0], center[1], p.lat, p.lng) <= radius / 1000;

        return inPriceRange && inType && inCircle;
      });

      setProperties(filtered);
    };

    fetchProperties();
  }, [center, radius, minPrice, maxPrice, selectedTypes]);

  function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of Earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  return (
    <MapContainer center={mapCenter} zoom={13} style={{ height: '80vh', width: '100%' }}>
      <TileLayer
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        attribution='© OpenStreetMap contributors'
      />

      <Circle center={mapCenter} radius={radius} color='blue' />

      {properties.map((property) => (
        <Marker key={property.id} position={[property.lat, property.lng]}>
          <Popup>
            <strong>{property.title}</strong><br />
            {property.price?.toLocaleString()}<br />
            <Link href={`/property/${property.id}`} className="text-blue-500 underline">查看详情</Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
