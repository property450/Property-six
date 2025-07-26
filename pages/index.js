import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import DistanceSelector from '@/components/DistanceSelector';
import PriceRangeSelector from '@/components/PriceRangeSelector';
import TypeSelector from '@/components/TypeSelector';

const MapWithMarkersClient = dynamic(() => import('@/components/MapWithMarkersClient'), {
  ssr: false,
});

export default function HomePage() {
  const [address, setAddress] = useState('');
  const [center, setCenter] = useState({ lat: 3.139, lng: 101.6869 }); // Default: KL
  const [distance, setDistance] = useState(5);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 5000000 });
  const [typeFilter, setTypeFilter] = useState('');

  const geocodeWithoutAPI = async (input) => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        input
      )}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        return { lat: parseFloat(lat), lng: parseFloat(lon) };
      } else {
        alert('Address not found');
        return null;
      }
    } catch (err) {
      alert('Error during geocoding');
      return null;
    }
  };

  const handleSearch = async () => {
    const result = await geocodeWithoutAPI(address);
    if (result) setCenter(result);
  };

  return (
    <div className='grid md:grid-cols-4 gap-4 p-4'>
      <div className='md:col-span-1 space-y-4'>
        <Input
          placeholder='Enter address...'
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <Button onClick={handleSearch}>Search</Button>
        <DistanceSelector distance={distance} setDistance={setDistance} />
        <PriceRangeSelector priceRange={priceRange} setPriceRange={setPriceRange} />
        <TypeSelector value={typeFilter} onChange={setTypeFilter} />
      </div>
      <div className='md:col-span-3'>
        <MapWithMarkersClient
          center={center}
          distance={distance}
          priceRange={priceRange}
          typeFilter={typeFilter}
        />
      </div>
    </div>
  );
}
