// pages/search.js
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import dynamic from 'next/dynamic';
import FilterPanel from '../components/FilterPanel';

const MapWithNoSSR = dynamic(() => import('../components/MapWithMarkers'), { ssr: false });

export default function SearchPage() {
  const [filters, setFilters] = useState({
    keyword: '',
    type: '',
    priceRange: [0, 1000000],
    distance: [0, 50],
  });

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFilteredProperties();
  }, [filters]);

  async function fetchFilteredProperties() {
    setLoading(true);
    let query = supabase.from('properties').select('*');

    if (filters.keyword) {
      query = query.ilike('title', `%${filters.keyword}%`);
    }
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.priceRange) {
      const [min, max] = filters.priceRange;
      query = query.gte('price', min).lte('price', max);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (!error) {
      setProperties(data);
    } else {
      console.error(error);
    }
    setLoading(false);
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">房产搜索</h1>

      <FilterPanel filters={filters} setFilters={setFilters} />

      {loading ? (
        <p>加载中...</p>
      ) : (
        <MapWithNoSSR properties={properties} />
      )}
    </div>
  );
}
