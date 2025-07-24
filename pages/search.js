// pages/search.js
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '../supabaseClient';

const MapWithMarkers = dynamic(() => import('@/components/MapWithMarkersClient'), { ssr: false });

export default function SearchPage() {
  const [address, setAddress] = useState('');
  const [center, setCenter] = useState(null); // { lat, lng }
  const [radius, setRadius] = useState(5); // km
  const [properties, setProperties] = useState([]);

  const handleSearch = async () => {
    try {
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${address}`);
      const geoData = await geoRes.json();

      if (geoData.length > 0) {
        const lat = parseFloat(geoData[0].lat);
        const lng = parseFloat(geoData[0].lon);
        setCenter({ lat, lng });

        // 获取房源数据
        const { data, error } = await supabase.from('properties').select('*');
        if (error) throw error;

        // 过滤在圆圈范围内的房源
        const withinRadius = data.filter((property) => {
          const dLat = (property.lat - lat) * (Math.PI / 180);
          const dLng = (property.lng - lng) * (Math.PI / 180);
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(lat * Math.PI / 180) * Math.cos(property.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = 6371 * c; // 地球半径 km
          return distance <= radius;
        });

        setProperties(withinRadius);
      }
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  return (
    <div>
      <div className="p-4 space-y-2">
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter address"
        />
        <Button onClick={handleSearch}>Search</Button>
      </div>
      <MapWithMarkers center={center} radius={radius} properties={properties} />
    </div>
  );
}
