// pages/index.js
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '../supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import PropertyCard from '@/components/PropertyCard';
import PriceRangeSelector from '@/components/PriceRangeSelector';
import TypeSelector from '@/components/TypeSelector';
import DistanceSelector from '@/components/DistanceSelector';

const MapWithMarkersClient = dynamic(() => import('@/components/MapWithMarkersClient'), { ssr: false });

export default function Home() {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [address, setAddress] = useState('');
  const [addressLocation, setAddressLocation] = useState(null);
  const [triggerSearch, setTriggerSearch] = useState(false);

  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(50000000);
  const [selectedType, setSelectedType] = useState('');
  const [distance, setDistance] = useState(5); // 默认距离 5 公里

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from('properties').select('*');
      if (error) {
        console.error('加载房源失败:', error);
      } else {
        setProperties(data);
      }
    };
    fetchData();
  }, []);

  // 地址转坐标
  useEffect(() => {
    const fetchCoords = async () => {
      if (address && triggerSearch) {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
        const results = await response.json();
        if (results.length > 0) {
          const { lat, lon } = results[0];
          setAddressLocation({ lat: parseFloat(lat), lng: parseFloat(lon) });
        }
      }
    };
    fetchCoords();
  }, [triggerSearch]);

  // 筛选房源
  useEffect(() => {
    const filtered = properties.filter((p) => {
      const matchesPrice = p.price >= minPrice && p.price <= maxPrice;
      const matchesType = selectedType === '' || p.type?.includes(selectedType);
      let matchesDistance = true;

      if (addressLocation && p.lat && p.lng) {
        const R = 6371; // 地球半径 (km)
        const dLat = (p.lat - addressLocation.lat) * (Math.PI / 180);
        const dLng = (p.lng - addressLocation.lng) * (Math.PI / 180);
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(addressLocation.lat * Math.PI / 180) *
          Math.cos(p.lat * Math.PI / 180) *
          Math.sin(dLng / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c;
        matchesDistance = d <= distance;
      }

      return matchesPrice && matchesType && matchesDistance;
    });

    setFilteredProperties(filtered);
  }, [properties, minPrice, maxPrice, selectedType, addressLocation, distance]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">地图房源搜索</h1>

      {/* 筛选区 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Input
          placeholder="请输入地点"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <Button onClick={() => setTriggerSearch(prev => !prev)}>搜索</Button>
        <PriceRangeSelector minPrice={minPrice} maxPrice={maxPrice} onMinChange={setMinPrice} onMaxChange={setMaxPrice} />
        <TypeSelector value={selectedType} onChange={setSelectedType} />
        <DistanceSelector value={distance} onChange={setDistance} />
      </div>

      {/* 地图 */}
      <div className="h-[500px] mb-6">
        <MapWithMarkersClient
          properties={filteredProperties}
          addressLocation={addressLocation}
          distance={distance}
        />
      </div>

      {/* 房源卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProperties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    </div>
  );
}
