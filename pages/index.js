import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '../supabaseClient';
import { useRouter } from 'next/router';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import PriceRangeSelector from '@/components/PriceRangeSelector';
import TypeSelector from '@/components/TypeSelector';

const MapWithMarkersClient = dynamic(() => import('@/components/MapWithMarkersClient'), { ssr: false });

export default function Home() {
  const router = useRouter();
  const [address, setAddress] = useState('');
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [radius, setRadius] = useState(5); // 默认搜索半径 5 公里
  const [mapCenter, setMapCenter] = useState(null);

  useEffect(() => {
    const fetchProperties = async () => {
      const { data, error } = await supabase.from('properties').select('*');
      if (error) {
        console.error('Error fetching properties:', error);
      } else {
        setProperties(data);
      }
    };
    fetchProperties();
  }, []);

  const handleSearch = async () => {
    if (!address) return;

    // 1. 地址 -> 经纬度
    const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
    const geoData = await geoRes.json();
    if (!geoData || geoData.length === 0) {
      alert('地址未找到，请重试');
      return;
    }

    const lat = parseFloat(geoData[0].lat);
    const lng = parseFloat(geoData[0].lon);
    setMapCenter({ lat, lng });

    // 2. 计算每个房源距离 -> 筛选
    const filtered = properties.filter((property) => {
      if (!property.latitude || !property.longitude) return false;

      const distance = getDistanceFromLatLonInKm(
        lat,
        lng,
        parseFloat(property.latitude),
        parseFloat(property.longitude)
      );

      const inRadius = distance <= radius;
      const inPriceRange =
        (!minPrice || parseInt(property.price) >= parseInt(minPrice)) &&
        (!maxPrice || parseInt(property.price) <= parseInt(maxPrice));
      const matchType =
        !selectedType || (property.type && property.type.toLowerCase().includes(selectedType.toLowerCase()));

      return inRadius && inPriceRange && matchType;
    });

    setFilteredProperties(filtered);
  };

  // 计算两个坐标点间的距离（单位：公里）
  const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // 地球半径 km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      0.5 - Math.cos(dLat) / 2 +
      (Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        (1 - Math.cos(dLon))) /
        2;
    return R * 2 * Math.asin(Math.sqrt(a));
  };

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
        <Input
          type="text"
          placeholder="输入地址以搜索附近房源"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="col-span-2"
        />
        <PriceRangeSelector
          minPrice={minPrice}
          maxPrice={maxPrice}
          setMinPrice={setMinPrice}
          setMaxPrice={setMaxPrice}
        />
        <TypeSelector
          selectedType={selectedType}
          setSelectedType={setSelectedType}
        />
        <select
          value={radius}
          onChange={(e) => setRadius(parseInt(e.target.value))}
          className="border rounded p-1"
        >
          <option value={1}>1 km</option>
          <option value={3}>3 km</option>
          <option value={5}>5 km</option>
          <option value={10}>10 km</option>
          <option value={20}>20 km</option>
        </select>
        <Button onClick={handleSearch}>搜索</Button>
      </div>

      <MapWithMarkersClient
        properties={filteredProperties.length > 0 ? filteredProperties : properties}
        center={mapCenter}
        radius={filteredProperties.length > 0 ? radius : null}
      />
    </div>
  );
}
