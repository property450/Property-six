// ✅ pages/index.js
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '../supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import PriceRangeSelector from '@/components/PriceRangeSelector';
import TypeSelector from '@/components/TypeSelector';
import DistanceSelector from '@/components/DistanceSelector';
import { geocodeByAddress } from '@/utils/geocode';

const MapWithMarkers = dynamic(() => import('@/components/MapWithMarkersClient'), { ssr: false });

export default function HomePage() {
  const [properties, setProperties] = useState([]);
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState(null);
  const [distance, setDistance] = useState(5); // ✅ 设置默认搜索半径
  const [priceRange, setPriceRange] = useState([0, 10000000]);
  const [selectedType, setSelectedType] = useState('');

  useEffect(() => {
    const fetchProperties = async () => {
      const { data, error } = await supabase.from('properties').select('*');
      if (error) console.error('加载房源失败:', error);
      else setProperties(data);
    };
    fetchProperties();
  }, []);

  const handleSearch = async () => {
    if (!address) return;
    const result = await geocodeByAddress(address);
    if (result && result.lat && result.lng) {
      setLocation(result);
    } else {
      alert('无法找到地址');
    }
  };

  const filteredProperties = properties.filter((p) => {
    const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
    const matchesType = selectedType ? p.type?.includes(selectedType) : true;
    return matchesPrice && matchesType;
  });

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="输入地址" />
        <Button onClick={handleSearch}>搜索</Button>
        <DistanceSelector distance={distance} setDistance={setDistance} />
        <TypeSelector selectedType={selectedType} setSelectedType={setSelectedType} />
        <PriceRangeSelector priceRange={priceRange} setPriceRange={setPriceRange} />
      </div>
      <MapWithMarkers
        properties={filteredProperties}
        location={location}
        distance={distance}
      />
    </div>
  );
}
