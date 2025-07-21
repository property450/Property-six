// pages/index.js
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import Header from '../components/Header';
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

    if (error) {
      console.error('加载失败:', error);
    } else {
      setProperties(data || []);
    }
    setLoading(false);
  }

  return (
    <div>
      <Header />
      <main className="max-w-7xl mx-auto p-4 space-y-6">
        <h1 className="text-3xl font-bold">📍 房源地图 / Property Map</h1>

        <FilterPanel setProperties={setProperties} />

        {loading ? (
          <p>加载中 / Loading...</p>
        ) : properties.length === 0 ? (
          <p>暂无房源 / No listings found</p>
        ) : (
          <div className="h-[75vh] rounded-lg overflow-hidden shadow">
            <MapWithMarkers properties={properties} />
          </div>
        )}
      </main>
    </div>
  );
}
