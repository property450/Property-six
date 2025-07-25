import { useState } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '../supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import PriceRangeSelector from '@/components/PriceRangeSelector';
import TypeSelector from '@/components/TypeSelector';

const MapWithMarkersClient = dynamic(() => import('@/components/MapWithMarkersClient'), { ssr: false });

export default function Home() {
  const [properties, setProperties] = useState([]);
  const [address, setAddress] = useState('');
  const [center, setCenter] = useState(null);
  const [radius] = useState(5000);
  const [priceRange, setPriceRange] = useState([10000, 50000000]);
  const [selectedTypes, setSelectedTypes] = useState([]);

  const handleSearch = async () => {
    if (!address) return;

    // 调用 Nominatim 将地址转换为经纬度
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${address}`);
    const data = await res.json();

    if (data.length === 0) {
      alert('地址无效');
      return;
    }

    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);
    setCenter({ lat, lng });

    // 获取 Supabase 中所有房源
    const { data: propertiesData, error } = await supabase.from('properties').select('*');
    if (error) {
      console.error('获取房源失败:', error);
    } else {
      setProperties(propertiesData);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col md:flex-row">
      {/* 左侧筛选栏 */}
      <div className="w-full md:w-1/3 p-4 bg-white overflow-y-auto max-h-screen border-r">
        <h2 className="text-xl font-semibold mb-4">搜索房源</h2>
        <Input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="请输入地址"
          className="mb-4"
        />
        <PriceRangeSelector value={priceRange} onChange={setPriceRange} />
        <TypeSelector selected={selectedTypes} setSelected={setSelectedTypes} />
        <Button onClick={handleSearch} className="mt-4 w-full">
          搜索
        </Button>
      </div>

      {/* 右侧地图 */}
      <div className="w-full md:w-2/3 h-full">
        <MapWithMarkersClient
          center={center}
          radius={radius}
          properties={properties}
          priceRange={priceRange}
          selectedTypes={selectedTypes}
        />
      </div>
    </div>
  );
}
