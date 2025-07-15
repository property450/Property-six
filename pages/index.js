// pages/index.js
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import PropertyCard from '../components/PropertyCard';

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
    <div className="p-4 space-y-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🏠 最新房源</h1>
      {loading ? (
        <p>加载中...</p>
      ) : properties.length === 0 ? (
        <p>暂无房源</p>
      ) : (
        properties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))
      )}
    </div>
  );
}
