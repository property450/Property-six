// pages/index.js
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '../supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import TypeSelector from '@/components/TypeSelector';
import PriceRangeSelector from '@/components/PriceRangeSelector';
import { geocodeAddress } from '@/utils/geocode';

const MapWithMarkers = dynamic(() => import('@/components/MapWithMarkersClient'), {
  ssr: false,
});

export default function Home() {
  const [properties, setProperties] = useState([]);
  const [center, setCenter] = useState({ lat: 3.139, lng: 101.6869 }); // Kuala Lumpur 默认坐标
  const [searchAddress, setSearchAddress] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    const { data, error } = await supabase.from('properties').select('*');
    if (error) {
      console.error('Error fetching properties:', error);
    } else {
      setProperties(data);
    }
  };

  const handleSearch = async () => {
    if (!searchAddress) return;

    try {
      const { lat, lng } = await geocodeAddress(searchAddress);
      setCenter({ lat, lng });
    } catch (error) {
      console.error('地址转经纬度失败:', error);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex gap-2 items-center flex-wrap">
        <Input
          type="text"
          placeholder="请输入地址"
          value={searchAddress}
          onChange={(e) => setSearchAddress(e.target.value)}
          className="w-full sm:w-64"
        />
        <Button onClick={handleSearch}>搜索</Button>
        <PriceRangeSelector
          minPrice={minPrice}
          maxPrice={maxPrice}
          setMinPrice={setMinPrice}
          setMaxPrice={setMaxPrice}
        />
        <TypeSelector selected={selectedTypes} setSelected={setSelectedTypes} />
      </div>

      <div className="h-[600px] w-full rounded shadow">
        <MapWithMarkers
          properties={properties}
          center={center}
          minPrice={minPrice}
          maxPrice={maxPrice}
          selectedTypes={selectedTypes}
        />
      </div>
    </div>
  );
}
