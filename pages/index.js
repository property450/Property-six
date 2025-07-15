// pages/index.js
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import Header from '../components/Header';
import PropertyCard from '../components/PropertyCard';
import MapWithMarkers from '../components/MapWithMarkers';
import FilterPanel from '../components/FilterPanel';

export default function Home() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  async function fetchProperties() {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.error('加载失败:', error);
    setProperties(data || []);
    setLoading(false);
  }

  return (
    <div>
      <Header />
      <main className="max-w-7xl mx-auto p-4 space-y-6">
        <h1 className="text-3xl font-bold">🏠 最新房源 / Latest Listings</h1>
        <FilterPanel setProperties={setProperties} />
        {loading ? (
          <p>加载中...</p>
        ) : properties.length === 0 ? (
          <p>暂无房源 / No listings</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
        <MapWithMarkers properties={properties} />
      </main>
    </div>
  );
}
