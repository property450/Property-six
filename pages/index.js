import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import DistanceSelector from '@/components/DistanceSelector';
import TypeSelector from '@/components/TypeSelector';
import PriceRangeSelector from '@/components/PriceRangeSelector';
import Geocode from 'react-geocode';

Geocode.setApiKey(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);

const MapWithMarkersClient = dynamic(() => import('@/components/MapWithMarkersClient'), {
  ssr: false,
});

export default function HomePage() {
  const [address, setAddress] = useState('');
  const [center, setCenter] = useState(null);
  const [distance, setDistance] = useState(5); // in km
  const [typeFilter, setTypeFilter] = useState('');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000000 });

  const handleSearch = async () => {
    try {
      const response = await Geocode.fromAddress(address);
      const { lat, lng } = response.results[0].geometry.location;
      setCenter({ lat, lng });
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  return (
    <div className="p-4">
      <div className="grid md:grid-cols-4 gap-4 mb-4">
        <Input
          placeholder="Enter area (e.g. Kuala Lumpur)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <DistanceSelector distance={distance} setDistance={setDistance} />
        <TypeSelector value={typeFilter} onChange={setTypeFilter} />
        <PriceRangeSelector priceRange={priceRange} setPriceRange={setPriceRange} />
        <Button onClick={handleSearch}>Search</Button>
      </div>

      <MapWithMarkersClient
        center={center}
        distance={distance}
        typeFilter={typeFilter}
        priceRange={priceRange}
      />
    </div>
  );
}
