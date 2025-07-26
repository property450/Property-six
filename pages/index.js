import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import DistanceSelector from '@/components/DistanceSelector';
import TypeSelector from '@/components/TypeSelector';
import PriceRangeSelector from '@/components/PriceRangeSelector';
import { Loader } from '@googlemaps/js-api-loader';

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
    if (!address) return;

    try {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
        version: 'weekly',
        libraries: ['places'],
      });

      const google = await loader.load();

      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          setCenter({
            lat: location.lat(),
            lng: location.lng(),
          });
        } else {
          console.error('Geocode failed:', status);
          alert('Address not found.');
        }
      });
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  return (
    <div className="p-4">
      <div className="grid md:grid-cols-5 gap-4 mb-4">
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
