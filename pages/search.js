import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '../supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'next-i18next';

const MapWithMarkersClient = dynamic(() => import('@/components/MapWithMarkersClient'), {
  ssr: false,
});

export default function SearchPage() {
  const { t } = useTranslation();
  const [searchAddress, setSearchAddress] = useState('');
  const [searchCenter, setSearchCenter] = useState(null); // { lat, lng }
  const [radiusKm, setRadiusKm] = useState(5); // 默认5km
  const [properties, setProperties] = useState([]);

  const fetchProperties = async () => {
    const { data, error } = await supabase.from('properties').select('*');
    if (!error && data) {
      setProperties(data);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleSearch = async () => {
    if (!searchAddress) return;

    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${searchAddress}`);
    const result = await res.json();
    if (result && result.length > 0) {
      const { lat, lon } = result[0];
      setSearchCenter({ lat: parseFloat(lat), lng: parseFloat(lon) });
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col md:flex-row items-center gap-4">
        <Input
          type="text"
          placeholder={t('Search by address')}
          value={searchAddress}
          onChange={(e) => setSearchAddress(e.target.value)}
        />
        <Input
          type="number"
          placeholder={t('Distance in km')}
          value={radiusKm}
          onChange={(e) => setRadiusKm(Number(e.target.value))}
        />
        <Button onClick={handleSearch}>{t('Search')}</Button>
      </div>

      <MapWithMarkersClient
        properties={properties}
        center={searchCenter}
        radiusKm={radiusKm}
      />
    </div>
  );
}
