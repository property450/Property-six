// pages/index.js
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '../supabaseClient';
import { useRouter } from 'next/router';

const MapWithMarkers = dynamic(() => import('@/components/MapWithMarkersClient'), { ssr: false });

export default function Home() {
  const [properties, setProperties] = useState([]);
  const [center, setCenter] = useState(null);
  const [radius, setRadius] = useState(5); // 公里
  const [address, setAddress] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    const { data, error } = await supabase.from('properties').select('*');
    if (error) console.error(error);
    else setProperties(data);
  };

  const handleSearch = async () => {
    if (!address) return;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
      const data = await response.json();
      if (data.length > 0) {
        const { lat, lon } = data[0];
        setCenter({ lat: parseFloat(lat), lng: parseFloat(lon) });
      }
    } catch (error) {
      console.error('Geocoding failed:', error);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">🏠 Real Estate Search</h1>
        <div className="space-x-2">
          <Button onClick={() => router.push('/my-profile')}>我的房源</Button>
          <Button onClick={() => router.push('/favorites')}>收藏</Button>
        </div>
      </header>

      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="请输入地址"
        />
        <Input
          type="number"
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          placeholder="范围（公里）"
        />
        <Button onClick={handleSearch}>搜索</Button>
      </div>

      <div className="h-[600px]">
        <MapWithMarkers center={center} properties={properties} radius={radius} />
      </div>
    </div>
  );
}
