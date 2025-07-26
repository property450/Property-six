// pages/index.js
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '../supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import TypeSelector from '@/components/TypeSelector';
import PriceRangeSelector from '@/components/PriceRangeSelector';
import DistanceSelector from '@/components/DistanceSelector';
import PropertyCard from '@/components/PropertyCard';

const MapWithMarkers = dynamic(() => import('@/components/MapWithMarkersClient'), {
  ssr: false,
});

export default function Home() {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [searchLocation, setSearchLocation] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [mainType, setMainType] = useState('');
  const [subType, setSubType] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [distance, setDistance] = useState(5); // ✅ 加上距离状态
  const [searchCenter, setSearchCenter] = useState(null);

  useEffect(() => {
    const fetchProperties = async () => {
      const { data, error } = await supabase.from('properties').select('*');
      if (error) {
        console.error('Error fetching properties:', error);
      } else {
        setProperties(data);
        setFilteredProperties(data);
      }
    };

    fetchProperties();
  }, []);

  const handleSearch = async () => {
    if (!searchLocation) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchLocation
        )}`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setSearchCenter({ lat, lng });

        const filtered = properties.filter((property) => {
          const propertyLat = parseFloat(property.lat);
          const propertyLng = parseFloat(property.lng);

          if (isNaN(propertyLat) || isNaN(propertyLng)) return false;

          const distanceToCenter = getDistanceFromLatLonInKm(
            lat,
            lng,
            propertyLat,
            propertyLng
          );

          const withinDistance = distanceToCenter <= distance;
          const matchesPrice =
            (!minPrice || property.price >= minPrice) &&
            (!maxPrice || property.price <= maxPrice);
          const matchesType =
            !selectedType || property.type?.toLowerCase() === selectedType.toLowerCase();

          return withinDistance && matchesPrice && matchesType;
        });

        setFilteredProperties(filtered);
      } else {
        alert('找不到地址');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      alert('地理位置解析失败');
    }
  };

  function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  function deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">地图搜索房源</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <Input
          type="text"
          placeholder="输入地址"
          value={searchLocation}
          onChange={(e) => setSearchLocation(e.target.value)}
        />
        <PriceRangeSelector
          minPrice={minPrice}
          maxPrice={maxPrice}
          setMinPrice={setMinPrice}
          setMaxPrice={setMaxPrice}
        />
        <TypeSelector
          mainType={mainType}
          setMainType={setMainType}
          subType={subType}
          setSubType={setSubType}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
        />
        <DistanceSelector value={distance} onChange={setDistance} /> {/* ✅ 已加入 */}
        <Button onClick={handleSearch}>搜索</Button>
      </div>

      <div className="h-[500px] mb-4">
        <MapWithMarkers
          properties={filteredProperties}
          center={searchCenter}
          radius={distance}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProperties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    </div>
  );
}
