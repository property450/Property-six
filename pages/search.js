import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '../supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'next-i18next';
import PropertyCard from '@/components/PropertyCard';

const MapWithMarkers = dynamic(() => import('@/components/MapWithMarkers'), { ssr: false });

export default function SearchPage() {
  const { t } = useTranslation();
  const [allProperties, setAllProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [center, setCenter] = useState(null);
  const [radius, setRadius] = useState(5000); // 单位: 米

  // 地址转坐标
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

  const handleSearchClick = () => {
    if (searchTerm.length > 2) {
      geocodeAddress(searchTerm);
    }
  };

  // 获取所有房源
  useEffect(() => {
    const fetchProperties = async () => {
      const { data, error } = await supabase.from('properties').select('*');
      if (!error) {
        setAllProperties(data);
        setFilteredProperties(data); // 默认先显示全部
      }
    };
    fetchProperties();
  }, []);

  // 计算两点之间距离（单位：米）
  const haversineDistance = (coord1, coord2) => {
    const toRad = (x) => (x * Math.PI) / 180;
    const R = 6371000; // 地球半径（米）

    const dLat = toRad(coord2.lat - coord1.lat);
    const dLon = toRad(coord2.lng - coord1.lng);
    const lat1 = toRad(coord1.lat);
    const lat2 = toRad(coord2.lat);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // ✅ 当中心点或距离变化时，自动筛选房源
  useEffect(() => {
    if (!center || allProperties.length === 0) return;

    const filtered = allProperties.filter((property) => {
      if (!property.latitude || !property.longitude) return false;
      const distance = haversineDistance(center, {
        lat: property.latitude,
        lng: property.longitude,
      });
      return distance <= radius;
    });

    setFilteredProperties(filtered);
  }, [center, radius, allProperties]);

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center">
        <Input
          type="text"
          placeholder={t('Enter address') || 'Enter address'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/2"
        />
        <Button onClick={handleSearchClick} className="bg-blue-600 hover:bg-blue-700 text-white px-4">
          🔍 {t('Search') || 'Search'}
        </Button>
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
        <MapWithMarkers
          properties={filteredProperties}
          centerLat={center.lat}
          centerLng={center.lng}
          radiusKm={radius / 1000}
        />
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
