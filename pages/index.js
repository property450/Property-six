// pages/index.js
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '../supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import TypeSelector from '@/components/TypeSelector';
import PriceRangeSelector from '@/components/PriceRangeSelector';
import DistanceSelector from '@/components/DistanceSelector';
import { useTranslation } from 'next-i18next';
import PropertyCard from '@/components/PropertyCard';

const MapWithMarkersClient = dynamic(() => import('@/components/MapWithMarkersClient'), {
  ssr: false,
});

export default function HomePage() {
  const { t } = useTranslation();
  const [address, setAddress] = useState('');
  const [searchLatLng, setSearchLatLng] = useState(null);
  const [radius, setRadius] = useState(5000); // 默认 5km
  const [type, setType] = useState('');
  const [priceRange, setPriceRange] = useState([0, 10000000]);
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    const fetchProperties = async () => {
      const { data, error } = await supabase.from('properties').select('*');
      if (!error) setProperties(data);
    };
    fetchProperties();
  }, []);

  const handleSearch = async () => {
    if (!address) return;

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
      const data = await res.json();
      if (data.length > 0) {
        const { lat, lon } = data[0];
        setSearchLatLng({ lat: parseFloat(lat), lng: parseFloat(lon) });
      } else {
        alert('Address not found');
      }
    } catch (error) {
      console.error('Geocoding failed:', error);
    }
  };

  return (
    <div className="p-4">
      <div className="grid gap-4 grid-cols-1 md:grid-cols-5 mb-4">
        <div className="md:col-span-2 flex gap-2">
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={t('Enter address')}
            className="w-full"
          />
          <Button onClick={handleSearch}>{t('Search')}</Button>
        </div>

        <div className="md:col-span-1">
          <DistanceSelector value={radius} onChange={setRadius} />
        </div>

        <div className="md:col-span-1">
          <TypeSelector value={type} onChange={setType} />
        </div>

        <div className="md:col-span-1">
          <PriceRangeSelector value={priceRange} onChange={setPriceRange} />
        </div>
      </div>

      <div className="h-[70vh] rounded-xl overflow-hidden mb-4">
        <MapWithMarkersClient
          properties={properties}
          center={searchLatLng}
          radius={radius}
          filterType={type}
          filterPrice={priceRange}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {properties
          .filter((p) => {
            const matchesType = type ? p.type?.includes(type) : true;
            const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
            return matchesType && matchesPrice;
          })
          .map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
      </div>
    </div>
  );
}
