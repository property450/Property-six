import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '../supabaseClient';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from 'next-i18next';
import { getDistance } from 'geolib';
import PropertyCard from '@/components/PropertyCard';

const MapWithMarkers = dynamic(() => import('@/components/MapWithMarkers'), { ssr: false });

export default function SearchPage() {
  const { t } = useTranslation();
  const [allProperties, setAllProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [center, setCenter] = useState(null);
  const [radius, setRadius] = useState(5000); // default 5km

  // 地理编码地址转换为经纬度
  const geocodeAddress = async (address) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
      const data = await res.json();
      if (data.length > 0) {
        const { lat, lon } = data[0];
        const location = { lat: parseFloat(lat), lng: parseFloat(lon) };
        setCenter(location);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  // 获取所有房源数据
  useEffect(() => {
    const fetchProperties = async () => {
      const { data, error } = await supabase.from('properties').select('*');
      if (!error) {
        setAllProperties(data);
        setFilteredProperties(data);
      }
    };
    fetchProperties();
  }, []);

  // 根据圆圈过滤房源
  useEffect(() => {
    if (center && allProperties.length > 0) {
      const filtered = allProperties.filter((property) => {
        const { latitude, longitude } = property;
        if (!latitude || !longitude) return false;
        const distance = getDistance(
          { latitude: center.lat, longitude: center.lng },
          { latitude: latitude, longitude: longitude }
        );
        return distance <= radius;
      });
      setFilteredProperties(filtered);
    }
  }, [center, radius, allProperties]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.length > 2) {
      geocodeAddress(value);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center">
        <Input
          type="text"
          placeholder={t('Enter address') || 'Enter address'}
          value={searchTerm}
          onChange={handleSearch}
          className="w-full md:w-1/2"
        />
        <select
          value={radius}
          onChange={(e) => setRadius(parseInt(e.target.value))}
          className="border rounded-md p-2"
        >
          {[5000, 10000, 20000, 50000, 100000].map((r) => (
            <option key={r} value={r}>{r / 1000} km</option>
          ))}
        </select>
      </div>

      {center && (
        <MapWithMarkers properties={filteredProperties} center={center} radius={radius} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {filteredProperties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
        {filteredProperties.length === 0 && <p>{t('No properties found')}</p>}
      </div>
    </div>
  );
}
