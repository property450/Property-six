import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '../supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import TypeSelector from '@/components/TypeSelector';
import PriceRangeSelector from '@/components/PriceRangeSelector';
import DistanceSelector from '@/components/DistanceSelector';

const MapWithMarkersClient = dynamic(() => import('@/components/MapWithMarkersClient'), { ssr: false });

export default function HomePage() {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);

  const [searchAddress, setSearchAddress] = useState('');
  const [addressLocation, setAddressLocation] = useState(null);

  const [distance, setDistance] = useState(5); // 默认5公里
  const [priceRange, setPriceRange] = useState([0, 50000000]);
  const [propertyType, setPropertyType] = useState('');

  // 从 supabase 获取房源数据
  useEffect(() => {
    const fetchProperties = async () => {
      const { data, error } = await supabase.from('properties').select('*');
      if (!error) setProperties(data || []);
    };
    fetchProperties();
  }, []);

  // 搜索地址并获取经纬度
  const handleSearch = async () => {
    if (!searchAddress) return;
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchAddress)}&format=json`);
    const result = await response.json();
    if (result.length > 0) {
      const { lat, lon } = result[0];
      const location = { lat: parseFloat(lat), lng: parseFloat(lon) };
      setAddressLocation(location);
    }
  };

  // 根据条件筛选房源
  useEffect(() => {
    let filtered = properties;

    if (propertyType) {
      filtered = filtered.filter((p) => p.type?.includes(propertyType));
    }

    if (priceRange.length === 2) {
      const [min, max] = priceRange;
      filtered = filtered.filter((p) => p.price >= min && p.price <= max);
    }

    if (addressLocation && distance) {
      const R = 6371; // 地球半径，单位 km
      const toRad = (value) => (value * Math.PI) / 180;

      filtered = filtered.filter((p) => {
        if (p.lat == null || p.lng == null) return false;

        const dLat = toRad(p.lat - addressLocation.lat);
        const dLng = toRad(p.lng - addressLocation.lng);

        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(toRad(addressLocation.lat)) *
          Math.cos(toRad(p.lat)) *
          Math.sin(dLng / 2) ** 2;

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c;

        return d <= distance;
      });
    }

    setFilteredProperties(filtered);
  }, [properties, addressLocation, distance, priceRange, propertyType]);

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <Input
          type="text"
          value={searchAddress}
          onChange={(e) => setSearchAddress(e.target.value)}
          placeholder="请输入地址"
        />
        <Button onClick={handleSearch}>搜索</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <DistanceSelector value={distance} onChange={setDistance} />
        <PriceRangeSelector value={priceRange} onChange={setPriceRange} />
        <TypeSelector value={propertyType} onChange={setPropertyType} />
      </div>

      <MapWithMarkersClient
        properties={filteredProperties}
        addressLocation={addressLocation}
        distance={distance}
      />
    </div>
  );
}
