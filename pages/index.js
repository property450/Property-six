// pages/index.js
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '../supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import DistanceSelector from '@/components/DistanceSelector';
import PriceRangeSelector from '@/components/PriceRangeSelector';
import TypeSelector from '@/components/TypeSelector';
import { geocodeByAddress } from '@/utils/geocode';

const MapWithMarkersClient = dynamic(() => import('@/components/MapWithMarkersClient'), { ssr: false });

export default function HomePage() {
  const [properties, setProperties] = useState([]);
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState(null);
  const [distance, setDistance] = useState(5);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 5000000 });
  const [selectedType, setSelectedType] = useState('');

  useEffect(() => {
    const fetchProperties = async () => {
      const { data, error } = await supabase.from('properties').select('*');
      if (!error) setProperties(data);
    };
    fetchProperties();
  }, []);

  const handleSearch = async () => {
    if (!address) return;
    const result = await geocodeByAddress(address);
    if (result && result.lat && result.lng) {
      setLocation(result);
    } else {
      alert('❌ 地址无效，请重新输入');
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
        <Input
          placeholder="输入地址（例如 Kuala Lumpur）"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="col-span-2"
        />
        <DistanceSelector distance={distance} setDistance={setDistance} />
        <PriceRangeSelector priceRange={priceRange} setPriceRange={setPriceRange} />
        <TypeSelector selectedType={selectedType} setSelectedType={setSelectedType} />
        <Button onClick={handleSearch}>🔍 搜索</Button>
      </div>

      <MapWithMarkersClient
        properties={properties}
        location={location}
        distance={distance}
        priceRange={priceRange}
        selectedType={selectedType}
      />
    </div>
  );
}
