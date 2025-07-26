import { useEffect, useState } from 'react';
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
  const [center, setCenter] = useState([3.139, 101.6869]); // Default to KL
  const [radius, setRadius] = useState(5000);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedType, setSelectedType] = useState('');

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    const { data, error } = await supabase.from('properties').select('*');
    if (!error) setProperties(data);
  };

  const handleSearch = async () => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
    );
    const data = await response.json();
    if (data && data.length > 0) {
      const { lat, lon } = data[0];
      setCenter([parseFloat(lat), parseFloat(lon)]);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-wrap gap-2">
        <Input
          type="text"
          placeholder="Enter address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-64"
        />
        <Button onClick={handleSearch}>Search</Button>
        <select value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="border p-1 rounded">
          <option value={1000}>1 km</option>
          <option value={3000}>3 km</option>
          <option value={5000}>5 km</option>
          <option value={10000}>10 km</option>
        </select>
        <PriceRangeSelector
          minPrice={minPrice}
          setMinPrice={setMinPrice}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
        />
        <TypeSelector selectedType={selectedType} setSelectedType={setSelectedType} />
      </div>

      <MapWithMarkersClient
        properties={properties}
        center={center}
        radius={radius}
        priceRange={{ min: minPrice, max: maxPrice }}
        selectedType={selectedType}
      />
    </div>
  );
}
