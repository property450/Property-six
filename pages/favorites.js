import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '@supabase/auth-helpers-react';
import PropertyCard from '../components/PropertyCard';

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = useUser();

  useEffect(() => {
    if (user) fetchFavorites();
  }, [user]);

  async function fetchFavorites() {
    const { data: favs, error } = await supabase
      .from('favorites')
      .select('property_id')
      .eq('user_id', user.id);

    if (error) {
      console.error('加载收藏失败:', error);
      return;
    }

    const ids = favs.map((f) => f.property_id);
    if (ids.length === 0) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    const { data: properties, error: propErr } = await supabase
      .from('properties')
      .select('*')
      .in('id', ids);

    if (propErr) {
      console.error('加载房产失败:', propErr);
    } else {
      setFavorites(properties);
    }
    setLoading(false);
  }

  if (!user) return <div className="p-4">请先登录查看收藏房源</div>;
  if (loading) return <div className="p-4">加载中...</div>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-4">❤️ 我的收藏</h1>
      {favorites.length === 0 ? (
        <p>你还没有收藏任何房源</p>
      ) : (
        favorites.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))
      )}
    </div>
  );
}
