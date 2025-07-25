// pages/index.js
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
  const [properties, setProperties] = useState([]);
  const [searchAddress, setSearchAddress] = useState('');
  const [priceRange, setPriceRange] = useState([10000, 50000000]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [circleCenter, setCircleCenter] = useState(null);
  const [circleRadius, setCircleRadius] = useState(0);

  useEffect(() => {
    const fetchProperties = async () => {
      const { data, error } = await supabase.from('properties').select('*');
      if (!error) setProperties(data);
    };
    fetchProperties();
  }, []);

  const handleSearch = async () => {
    if (!searchAddress) return;

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}`
      );
      const data = await res.json();

      if (data.length > 0) {
        const { lat, lon } = data[0];
        setCircleCenter({ lat: parseFloat(lat), lng: parseFloat(lon) });
        setCircleRadius(5000); // 默认搜索半径 5 公里
      } else {
        alert('Address not found!');
      }
    } catch (error) {
      console.error('Error fetching coordinates:', error);
    }
  };

  return (
    <div className="flex flex-col md:flex-row">
      <div className="w-full md:w-1/3 p-4 space-y-4">
        <Input
          type="text"
          placeholder="Enter address..."
          value={searchAddress}
          onChange={(e) => setSearchAddress(e.target.value)}
        />
        <PriceRangeSelector
          min={10000}
          max={50000000}
          value={priceRange}
          onChange={setPriceRange}
        />
        <TypeSelector selected={selectedTypes} setSelected={setSelectedTypes} />
        <Button onClick={handleSearch}>Search</Button>
      </div>

      <div className="w-full md:w-2/3 h-[600px]">
        <MapWithMarkers
          properties={properties}
          center={circleCenter}
          radius={circleRadius}
          priceRange={priceRange}
          selectedTypes={selectedTypes}
          setCircleCenter={setCircleCenter}
          setCircleRadius={setCircleRadius}
        />
      </div>
    </div>
  );
}
