import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '../supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import PriceRangeSelector from '@/components/PriceRangeSelector';
import TypeSelector from '@/components/TypeSelector';
import DistanceSelector from '@/components/DistanceSelector';
import { geocodeAddress } from '@/utils/geocode';

const MapWithMarkers = dynamic(() => import('@/components/MapWithMarkersClient'), {
  ssr: false,
});

export default function HomePage() {
  const [properties, setProperties] = useState([]);
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState(null);
  const [distance, setDistance] = useState(5);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 5000000 });
  const [selectedType, setSelectedType] = useState('');

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    const { data, error } = await supabase.from('properties').select('*');
    if (!error) setProperties(data);
  };

  const handleSearch = async () => {
    if (!address) return;
    try {
      const result = await geocodeAddress(address);
      if (result?.lat && result?.lng) {
        setLocation(result);
      }
    } catch (err) {
      console.error('Geocode error:', err.message);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        <div className="col-span-2">
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter address"
          />
        </div>
        <Button onClick={handleSearch}>Search</Button>
        <DistanceSelector distance={distance} setDistance={setDistance} />
        <PriceRangeSelector value={priceRange} onChange={setPriceRange} />
        <TypeSelector value={selectedType} onChange={setSelectedType} />
      </div>
      <MapWithMarkers
        properties={properties}
        location={location}
        distance={distance}
        priceRange={priceRange}
        selectedType={selectedType}
      />
    </div>
  );
}
