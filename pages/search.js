import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../supabaseClient';
import PropertyCard from '../components/PropertyCard';

export default function SearchPage() {
  const router = useRouter();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const { keyword = '' } = router.query;

  useEffect(() => {
    if (keyword) fetchResults(keyword);
  }, [keyword]);

  async function fetchResults(q) {
    setLoading(true);
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .ilike('title', `%${q}%`);

    if (error) {
      console.error('搜索失败:', error);
    } else {
      setResults(data);
    }
    setLoading(false);
  }

  return (
    <div className="p-4 space-y-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🔍 搜索结果</h1>
      {loading ? (
        <p>加载中...</p>
      ) : results.length === 0 ? (
        <p>未找到与 "{keyword}" 匹配的房源</p>
      ) : (
        results.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))
      )}
    </div>
  );
}
