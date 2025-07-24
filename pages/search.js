// pages/search.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../supabaseClient';
import MapWithMarkers from '@/components/MapWithMarkers';
import PropertyCard from '@/components/PropertyCard';
import SearchFilter from '@/components/SearchFilter'; // 高级搜索组件
import { useTranslation } from 'next-i18next';

export default function SearchPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [properties, setProperties] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [center, setCenter] = useState(null); // 用于地图中心点
  const [radius, setRadius] = useState(null); // 范围（公里）

  const { q, radius: radiusParam } = router.query;

  useEffect(() => {
    const fetchProperties = async () => {
      const { data, error } = await supabase.from('properties').select('*');
      if (error) {
        console.error(error);
      } else {
        setProperties(data);
      }
    };

    fetchProperties();
  }, []);

  useEffect(() => {
    if (q) {
      handleAddressSearch(q);
    } else {
      setFiltered(properties);
    }
  }, [q, properties]);

  const handleAddressSearch = async (query) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
      );
      const result = await res.json();
      if (result && result.length > 0) {
        const { lat, lon } = result[0];
        setCenter([parseFloat(lat), parseFloat(lon)]);
        filterByDistance(parseFloat(lat), parseFloat(lon));
      } else {
        setFiltered([]);
      }
    } catch (error) {
      console.error('地址解析失败：', error);
    }
  };

  const filterByDistance = (lat, lon) => {
    const km = parseFloat(radiusParam) || 5;
    setRadius(km);
    const R = 6371; // 地球半径
    const filteredList = properties.filter((prop) => {
      if (!prop.latitude || !prop.longitude) return false;
      const dLat = (lat - prop.latitude) * (Math.PI / 180);
      const dLon = (lon - prop.longitude) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat * (Math.PI / 180)) *
          Math.cos(prop.latitude * (Math.PI / 180)) *
          Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      return distance <= km;
    });
    setFiltered(filteredList);
  };

  return (
    <div className="p-4 space-y-6">
      <SearchFilter />
      {center && (
        <MapWithMarkers
          properties={filtered}
          center={center}
          radius={radius}
        />
      )}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    </div>
  );
}
