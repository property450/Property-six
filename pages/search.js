import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '../supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'next-i18next';

const MapWithMarkers = dynamic(() => import('@/components/MapWithMarkersClient'), {
  ssr: false,
});

export default function SearchPage() {
  const { t } = useTranslation();
  const [address, setAddress] = useState('');
  const [radius, setRadius] = useState(5); // in km
  const [center, setCenter] = useState(null);
  const [properties, setProperties] = useState([]);

  const handleSearch = async () => {
    if (!address) return;

    // Use Nominatim for address → lat/lng
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        address
      )}&format=json&limit=1`
    );
    const data = await res.json();
    if (data?.[0]) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      setCenter({ lat, lng });
    }
  };

  useEffect(() => {
    const fetchProperties = async () => {
      const { data, error } = await supabase.from('properties').select('*');
      if (error) {
        console.error(error);
        return;
      }

      if (!center) {
        setProperties(data);
        return;
      }

      const withinRadius = data.filter((property) => {
        const lat = parseFloat(property.lat);
        const lng = parseFloat(property.lng);
        if (isNaN(lat) || isNaN(lng)) return false;

        const dist = getDistanceFromLatLng(center.lat, center.lng, lat, lng);
        return dist <= radius;
      });

      setProperties(withinRadius);
    };

    fetchProperties();
  }, [center, radius]);

  function getDistanceFromLatLng(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row items-center">
        <Input
          placeholder={t('Enter an address')}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <Input
          type="number"
          value={radius}
          onChange={(e) => setRadius(e.target.value)}
          className="w-28"
        />
        <Button onClick={handleSearch}>{t('Search')}</Button>
      </div>
      <div className="h-[75vh]">
        <MapWithMarkers center={center} radius={radius} properties={properties} />
      </div>
    </div>
  );
}
