// pages/search.js
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '../supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const MapWithMarkersClient = dynamic(() => import('@/components/MapWithMarkersClient'), {
  ssr: false,
});

export default function SearchPage() {
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState(null);
  const [radiusKm, setRadiusKm] = useState(5); // 默认 5km
  const [properties, setProperties] = useState([]);

  const handleSearch = async () => {
    if (!address) return;

    // 地理编码
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
    const data = await response.json();

    if (data.length === 0) {
      alert('未找到地址');
      return;
    }

    const { lat, lon } = data[0];
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);

    setCoordinates({ lat: latNum, lng: lonNum });

    // 搜索房源
    const { data: allProperties, error } = await supabase.from('properties').select('*');

    if (error) {
      console.error('Supabase 查询失败:', error);
      return;
    }

    // 过滤出圆圈范围内房源
    const filtered = allProperties.filter((p) => {
      if (!p.latitude || !p.longitude) return false;

      const R = 6371; // 地球半径 (km)
      const dLat = ((p.latitude - latNum) * Math.PI) / 180;
      const dLon = ((p.longitude - lonNum) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((latNum * Math.PI) / 180) *
          Math.cos((p.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const d = R * c;

      return d <= radiusKm;
    });

    setProperties(filtered);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="输入地址"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-[250px]"
        />
        <Input
          type="number"
          value={radiusKm}
          onChange={(e) => setRadiusKm(parseFloat(e.target.value))}
          placeholder="半径 (km)"
          className="w-[120px]"
        />
        <Button onClick={handleSearch}>搜索</Button>
      </div>

      <div className="h-[80vh]">
        <MapWithMarkersClient
          center={coordinates}
          properties={properties}
          radiusKm={radiusKm}
        />
      </div>
    </div>
  );
}
