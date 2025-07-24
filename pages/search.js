// pages/search.js
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '../supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const MapWithMarkers = dynamic(() => import('@/components/MapWithMarkers'), {
  ssr: false,
});

export default function SearchPage() {
  const [address, setAddress] = useState('');
  const [radius, setRadius] = useState(5); // 默认5公里
  const [coordinates, setCoordinates] = useState(null);
  const [properties, setProperties] = useState([]);

  const handleSearch = async () => {
    if (!address) return;

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json`);
      const data = await response.json();

      if (data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setCoordinates({ lat, lng });

        const { data: propertiesData, error } = await supabase
          .from('properties')
          .select('*');

        if (error) {
          console.error('Supabase error:', error.message);
          return;
        }

        // 计算与中心点的距离
        const nearby = propertiesData.filter((property) => {
          const distance = getDistanceFromLatLonInKm(
            lat,
            lng,
            property.latitude,
            property.longitude
          );
          return distance <= radius;
        });

        setProperties(nearby);
      }
    } catch (err) {
      console.error('Geocoding failed:', err.message);
    }
  };

  function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // 地球半径 km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  return (
    <div>
      <div className="flex items-center gap-2 p-4">
        <Input
          placeholder="Enter address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <Input
          type="number"
          value={radius}
          onChange={(e) => setRadius(parseFloat(e.target.value))}
          className="w-24"
        />
        <Button onClick={handleSearch}>Search</Button>
      </div>
      <MapWithMarkers center={coordinates} properties={properties} radius={radius} />
    </div>
  );
}
