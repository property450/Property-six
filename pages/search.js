// pages/search.js
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '../supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const MapWithMarkers = dynamic(() => import('@/components/MapWithMarkersClient'), {
  ssr: false,
});

export default function SearchPage() {
  const [address, setAddress] = useState('');
  const [distance, setDistance] = useState(5); // 默认 5km
  const [properties, setProperties] = useState([]);
  const [center, setCenter] = useState(null);

  const handleSearch = async () => {
    if (!address) return;

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
      const data = await res.json();
      if (data.length === 0) return alert('地址未找到');

      const { lat, lon } = data[0];
      const centerPoint = { lat: parseFloat(lat), lng: parseFloat(lon) };
      setCenter(centerPoint);

      // 计算范围内房源
      const { data: allProperties, error } = await supabase.from('properties').select('*');
      if (error) throw error;

      const withinDistance = allProperties.filter((property) => {
        const dx = (property.lat - centerPoint.lat) * 111;
        const dy = (property.lng - centerPoint.lng) * 111 * Math.cos((centerPoint.lat * Math.PI) / 180);
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist <= distance;
      });

      setProperties(withinDistance);
    } catch (err) {
      console.error('搜索错误:', err);
      alert('搜索失败');
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-2 items-center">
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="输入地址"
          className="w-1/2"
        />
        <Input
          type="number"
          value={distance}
          onChange={(e) => setDistance(Number(e.target.value))}
          placeholder="距离 (km)"
          className="w-32"
        />
        <Button onClick={handleSearch}>搜索</Button>
      </div>

      <MapWithMarkers center={center} radius={distance} properties={properties} />
    </div>
  );
}
