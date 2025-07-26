import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '../supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import TypeSelector from '@/components/TypeSelector';
import PriceRangeSelector from '@/components/PriceRangeSelector';

const MapWithMarkersClient = dynamic(() => import('@/components/MapWithMarkersClient'), {
  ssr: false,
});

export default function HomePage() {
  const [properties, setProperties] = useState([]);
  const [address, setAddress] = useState('');
  const [center, setCenter] = useState(null); // [lat, lng]
  const [radius, setRadius] = useState(3000); // 3km 默认
  const [priceRange, setPriceRange] = useState({ min: 10000, max: 50000000 });
  const [selectedType, setSelectedType] = useState('');

  useEffect(() => {
    async function fetchProperties() {
      const { data, error } = await supabase.from('properties').select('*');
      if (!error) setProperties(data);
    }
    fetchProperties();
  }, []);

  const handleSearch = async () => {
    if (!address) return;

    const response = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`);
    const data = await response.json();

    if (data && data.lat && data.lng) {
      setCenter([data.lat, data.lng]);
    } else {
      alert('无法获取地址的经纬度');
    }
  };

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="输入地址"
          className="col-span-1 md:col-span-2"
        />
        <Button onClick={handleSearch}>搜索</Button>
        <select
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          className="border p-2 rounded"
        >
          <option value={1000}>1km</option>
          <option value={3000}>3km</option>
          <option value={5000}>5km</option>
          <option value={10000}>10km</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <PriceRangeSelector value={priceRange} onChange={setPriceRange} />
        <TypeSelector value={selectedType} onChange={setSelectedType} />
      </div>

      <MapWithMarkersClient
        properties={properties}
        center={center}
        radius={radius}
        priceRange={priceRange}
        selectedType={selectedType}
      />
    </div>
  );
}
