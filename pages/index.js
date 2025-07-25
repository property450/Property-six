import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '../supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import PriceRangeSelector from '@/components/PriceRangeSelector';
import TypeSelector from '@/components/TypeSelector';

const MapWithMarkers = dynamic(() => import('@/components/MapWithMarkersClient'), {
  ssr: false,
});

export default function Home() {
  const [properties, setProperties] = useState([]);
  const [center, setCenter] = useState([3.139, 101.6869]); // 默认吉隆坡中心
  const [radius, setRadius] = useState(5000); // 单位：米
  const [address, setAddress] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // 读取所有房源数据
  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    const { data, error } = await supabase.from('properties').select('*');
    if (error) {
      console.error('读取房源出错:', error.message);
    } else {
      setProperties(data);
    }
  };

  const handleSearch = async () => {
    if (!address) return;

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setCenter([lat, lng]);
      } else {
        alert('地址找不到');
      }
    } catch (error) {
      console.error('地理编码失败:', error.message);
    }
  };

  // 计算两点间距离（Haversine）
  const isWithinRadius = (lat1, lng1, lat2, lng2, radiusMeters) => {
    const toRad = (x) => (x * Math.PI) / 180;
    const R = 6371e3;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c <= radiusMeters;
  };

  const filteredProperties = properties.filter((property) => {
    const { latitude, longitude, price, type } = property;
    if (!latitude || !longitude) return false;

    const lat = typeof latitude === 'string' ? parseFloat(latitude) : latitude;
    const lng = typeof longitude === 'string' ? parseFloat(longitude) : longitude;
    if (isNaN(lat) || isNaN(lng)) return false;

    // 距离判断
    if (!isWithinRadius(center[0], center[1], lat, lng, radius)) return false;

    // 价格判断
    if (minPrice && price < parseInt(minPrice)) return false;
    if (maxPrice && price > parseInt(maxPrice)) return false;

    // 类型判断
    if (selectedType && type !== selectedType) return false;

    return true;
  });

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">地图房源搜索</h1>

      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <Input
          placeholder="输入地址 (如: Kuala Lumpur)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <Button onClick={handleSearch}>搜索</Button>
        <Input
          type="number"
          placeholder="搜索半径（米）"
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <PriceRangeSelector
          minPrice={minPrice}
          maxPrice={maxPrice}
          setMinPrice={setMinPrice}
          setMaxPrice={setMaxPrice}
        />
        <TypeSelector selectedType={selectedType} setSelectedType={setSelectedType} />
      </div>

      <div className="h-[600px]">
        <MapWithMarkers properties={filteredProperties} center={center} radius={radius} />
      </div>
    </div>
  );
}
