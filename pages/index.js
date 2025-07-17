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
        <h1 className="text-3xl font-bold">🏠 最新房源 / Latest Listings</h1>

        <FilterPanel setProperties={setProperties} />

        {loading ? (
          <p>加载中 / Loading...</p>
        ) : properties.length === 0 ? (
          <p>暂无房源 / No listings found</p>
        ) : (
          <>
            {/* 房源列表 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>

            {/* 房源地图 */}
            <div className="mt-8">
              <h2 className="text-2xl font-semibold mb-2">🗺 地图查看 / View on Map</h2>
              <MapWithMarkers properties={properties} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
