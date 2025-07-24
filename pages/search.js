// pages/search.js
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '../supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'next-i18next';

const MapWithMarkers = dynamic(() => import('@/components/MapWithMarkers'), { ssr: false });

export default function SearchPage() {
  const { t } = useTranslation();
  const [address, setAddress] = useState('');
  const [center, setCenter] = useState(null);
  const [radius, setRadius] = useState(5000);
  const [properties, setProperties] = useState([]);

  const handleSearch = async () => {
    if (!address) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setCenter([lat, lon]);

        const { data: allProperties, error } = await supabase.from('properties').select('*');
        if (error) throw error;

        const filtered = allProperties.filter((property) => {
          const distance = getDistanceFromLatLonInKm(
            lat,
            lon,
            property.latitude,
            property.longitude
          );
          return distance <= radius / 1000;
        });

        setProperties(filtered);
      }
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={t('Enter address')}
        />
        <Button onClick={handleSearch}>{t('Search')}</Button>
      </div>

      <MapWithMarkers center={center} radius={radius} properties={properties} />
    </div>
  );
}
