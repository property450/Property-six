import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import PriceRangeSelector from '@/components/PriceRangeSelector';
import TypeSelector from '@/components/TypeSelector';

const MapWithMarkersClient = dynamic(() => import('@/components/MapWithMarkersClient'), { ssr: false });

export default function HomePage() {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);

  const [center, setCenter] = useState({ lat: 3.139, lng: 101.6869 });
  const [address, setAddress] = useState('');
  const [radius, setRadius] = useState(5);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(50000000);
  const [selectedType, setSelectedType] = useState('');

  useEffect(() => {
    async function fetchProperties() {
      const { data, error } = await supabase.from('properties').select('*');
      if (!error) setProperties(data);
    }
    fetchProperties();
  }, []);

  // ✅ 自动筛选逻辑：每当条件变化就筛选
  useEffect(() => {
    if (!center || !Array.isArray(properties)) return;

    const filtered = properties.filter((property) => {
      const distance = getDistanceFromLatLonInKm(
        center.lat,
        center.lng,
        property.lat,
        property.lng
      );

      const inRadius = distance <= radius;
      const inPrice = property.price >= minPrice && property.price <= maxPrice;
      const inType = selectedType ? property.type?.includes(selectedType) : true;

      return inRadius && inPrice && inType;
    });

    setFilteredProperties(filtered);
    console.log("Filtered Properties:", filtered);
  }, [center, radius, minPrice, maxPrice, selectedType, properties]);

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <Input
          placeholder="Enter address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <Input
          type="number"
          placeholder="Radius (km)"
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
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
        {/* Search button optional */}
        {/* <Button onClick={handleSearch}>Search</Button> */}
      </div>

      <MapWithMarkersClient
        properties={filteredProperties}
        center={center}
        radius={radius}
        minPrice={minPrice}
        maxPrice={maxPrice}
        selectedType={selectedType}
      />
    </div>
  );
}

// ✅ 距离计算函数
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
