import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '../supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const MapWithMarkersClient = dynamic(() => import('@/components/MapWithMarkersClient'), { ssr: false });

export default function SearchPage() {
  const [properties, setProperties] = useState([]);
  const [address, setAddress] = useState('');
  const [center, setCenter] = useState([3.139, 101.6869]); // 默认 Kuala Lumpur
  const [radius, setRadius] = useState(5); // 公里
  const [loading, setLoading] = useState(false);

  const fetchProperties = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('properties').select('*');
    if (error) {
      console.error('Fetch error:', error.message);
    } else {
      setProperties(data);
    }
    setLoading(false);
  };

  const geocodeAddress = async () => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setCenter([parseFloat(lat), parseFloat(lon)]);
      } else {
        alert('Address not found.');
      }
    } catch (err) {
      console.error('Geocode error:', err);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter address..." />
        <Input type="number" value={radius} onChange={(e) => setRadius(e.target.value)} placeholder="Radius (km)" />
        <Button onClick={geocodeAddress}>Search</Button>
      </div>
      <MapWithMarkersClient properties={properties} center={center} radius={radius} />
    </div>
  );
}
