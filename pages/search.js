// pages/search.js
import { useState } from 'react';
import { supabase } from '../supabaseClient';
import dynamic from 'next/dynamic';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const MapWithMarkers = dynamic(() => import('@/components/MapWithMarkers'), { ssr: false });

export default function SearchPage() {
  const [address, setAddress] = useState('');
  const [center, setCenter] = useState({ lat: 3.139, lng: 101.6869 }); // 使用对象形式
  const [radius, setRadius] = useState(5000);
  const [properties, setProperties] = useState([]);

  const handleSearch = async () => {
    if (!address) return;

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${address}`);
      const data = await res.json();

      if (data && data[0]) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        const newCenter = { lat, lng };
        setCenter(newCenter);

        const { data: allProperties, error } = await supabase.from('properties').select('*');
        if (error) throw error;

        const filtered = allProperties.filter((prop) => {
          const d = getDistanceFromLatLonInKm(lat, lng, prop.latitude, prop.longitude);
          return d <= radius / 1000;
        });

        setProperties(filtered);
      }
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-2">
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter address"
          className="w-full"
        />
        <Button onClick={handleSearch}>Search</Button>
      </div>
      <MapWithMarkers properties={properties} center={center} radius={radius} />
    </div>
  );
}
