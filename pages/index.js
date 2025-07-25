// pages/index.js
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '../supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import TypeSelector from '@/components/TypeSelector';
import PriceRangeSelector from '@/components/PriceRangeSelector';
import { getGeocodeLatLng } from '@/utils/geocode';

const MapWithMarkersClient = dynamic(() => import('@/components/MapWithMarkersClient'), { ssr: false });

export default function HomePage() {
  const [properties, setProperties] = useState([]);
  const [searchAddress, setSearchAddress] = useState('');
  const [searchCenter, setSearchCenter] = useState(null); // { lat, lng }
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [circleRadius, setCircleRadius] = useState(5000); // 默认 5km

  const fetchProperties = async () => {
    let { data, error } = await supabase.from('properties').select('*');
    if (!error) setProperties(data);
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleSearch = async () => {
    if (!searchAddress) return alert('请输入地址');
    const coords = await getGeocodeLatLng(searchAddress);
    if (!coords) return alert('地址无效');
    setSearchCenter(coords);
  };

  return (
    <div className="p-4">
      <div className="mb-4 space-y-2">
        <Input
          placeholder="请输入地址"
          value={searchAddress}
          onChange={(e) => setSearchAddress(e.target.value)}
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

      <div className="h-[70vh] border rounded">
        <MapWithMarkersClient
          properties={properties}
          center={searchCenter}
          radius={circleRadius}
          minPrice={minPrice}
          maxPrice={maxPrice}
          selectedTypes={selectedTypes}
        />
      </div>
    </div>
  );
}
