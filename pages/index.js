// pages/index.js
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '../supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import PriceRangeSelector from '@/components/PriceRangeSelector';
import TypeSelector from '@/components/TypeSelector';
import { geocodeAddress } from '@/utils/geocode';

const MapWithMarkersClient = dynamic(() => import('@/components/MapWithMarkersClient'), {
  ssr: false,
});

export default function HomePage() {
  const [searchAddress, setSearchAddress] = useState('');
  const [center, setCenter] = useState({ lat: 3.139, lng: 101.6869 }); // 初始设为吉隆坡
  const [properties, setProperties] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 50000000]);
  const [selectedTypes, setSelectedTypes] = useState([]);

  // 获取所有房源
  const fetchProperties = async () => {
    const { data, error } = await supabase.from('properties').select('*');
    if (error) console.error('获取房源失败:', error);
    else setProperties(data || []);
  };

  // 组件初始化时加载房源
  useEffect(() => {
    fetchProperties();
  }, []);

  // 🔍 点击搜索按钮触发地址转经纬度
  const handleSearch = async () => {
    if (!searchAddress) return;

    try {
      const { lat, lng } = await geocodeAddress(searchAddress);
      console.log('经纬度:', lat, lng);
      setCenter({ lat, lng });
    } catch (error) {
      console.error('地址转经纬度失败:', error);
    }
  };

  return (
    <div className="w-full h-screen">
      <div className="p-4 space-y-4 bg-white z-10">
        <div className="flex gap-2">
          <Input
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            placeholder="请输入地址"
          />
          <Button onClick={handleSearch}>搜索</Button>
        </div>
        <div className="flex gap-4">
          <PriceRangeSelector value={priceRange} onChange={setPriceRange} />
          <TypeSelector selected={selectedTypes} onChange={setSelectedTypes} />
        </div>
      </div>

      <MapWithMarkersClient
        center={center}
        properties={properties}
        priceRange={priceRange}
        selectedTypes={selectedTypes}
      />
    </div>
  );
}
