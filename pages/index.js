import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '../supabaseClient';
import { useRouter } from 'next/router';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import TypeSelector from '@/components/TypeSelector';
import PriceRangeSelector from '@/components/PriceRangeSelector';

const MapWithMarkers = dynamic(() => import('@/components/MapWithMarkersClient'), {
  ssr: false,
});

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [center, setCenter] = useState(null); // 地图中心点
  const [properties, setProperties] = useState([]);
  const [radius, setRadius] = useState(5); // 默认 5km
  const [priceRange, setPriceRange] = useState({ min: null, max: null });
  const [selectedTypes, setSelectedTypes] = useState([]);

  // 获取房源
  useEffect(() => {
    const fetchProperties = async () => {
      const { data, error } = await supabase.from('properties').select('*');
      if (error) console.error('房源读取失败:', error);
      else setProperties(data);
    };
    fetchProperties();
  }, []);

  // 地址搜索功能
  const handleSearch = async () => {
    if (!searchQuery) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}`
      );
      const data = await res.json();
      if (data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setCenter({ lat, lng });
      } else {
        alert('未找到该地址');
      }
    } catch (error) {
      console.error('地址搜索失败:', error);
    }
  };

  return (
    <div className="p-4">
      {/* 搜索栏 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <Input
          placeholder="请输入地址或地区..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <PriceRangeSelector priceRange={priceRange} setPriceRange={setPriceRange} />
        <TypeSelector selectedTypes={selectedTypes} setSelectedTypes={setSelectedTypes} />
        <Button onClick={handleSearch}>搜索</Button>
      </div>

      {/* 地图组件 */}
      <MapWithMarkers
        properties={properties}
        center={center}
        radius={radius}
        priceRange={priceRange}
        selectedTypes={selectedTypes}
      />
    </div>
  );
}
