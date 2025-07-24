import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import PropertyCard from '@/components/PropertyCard';
import FilterPanel from '@/components/FilterPanel';
import dynamic from 'next/dynamic';

const MapWithMarkers = dynamic(() => import('@/components/MapWithMarkers'), { ssr: false });

export default function Home() {
  const [properties, setProperties] = useState([]);
  const [filters, setFilters] = useState({
    keyword: '',
    priceRange: [0, 1000000],
    distance: null,
  });
  const [loading, setLoading] = useState(true);

  const fetchProperties = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('properties').select('*').limit(12);
    if (!error) setProperties(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-2">🏡 Recommended Properties</h1>

      <FilterPanel filters={filters} setFilters={setFilters} onSearch={fetchProperties} />

      {/* ✅ 地图组件加在这里 */}
      <MapWithMarkers properties={properties} />

      {loading ? (
        <p className="text-gray-500 mt-4">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}
