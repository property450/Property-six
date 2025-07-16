import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '@supabase/auth-helpers-react';
import Link from 'next/link';
import PropertyCard from '../components/PropertyCard';

export default function MyProfile() {
  const [user, setUser] = useState(null);
  const [myProperties, setMyProperties] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const sessionUser = useUser();

  useEffect(() => {
    if (sessionUser) {
      setUser(sessionUser);
      fetchData(sessionUser.id);
    }
  }, [sessionUser]);

  async function fetchData(userId) {
    const { data: myProps } = await supabase.from('properties').select('*').eq('user_id', userId);
    setMyProperties(myProps || []);

    const { data: favs } = await supabase.from('favorites').select('property_id').eq('user_id', userId);
    const favIds = favs.map((f) => f.property_id);
    if (favIds.length > 0) {
      const { data: favProps } = await supabase.from('properties').select('*').in('id', favIds);
      setFavorites(favProps || []);
    }
    setLoading(false);
  }

  const handleDelete = async (id) => {
    if (confirm('确定删除该房源？')) {
      await supabase.from('properties').delete().eq('id', id);
      setMyProperties((prev) => prev.filter((p) => p.id !== id));
    }
  };

  if (!user) return <div className="p-4">请先登录...</div>;
  if (loading) return <div className="p-4">加载中...</div>;

  return (
    <div className="p-4 space-y-8 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold mb-4">📤 我上传的房源</h2>
        {myProperties.length === 0 ? (
          <p>暂无上传记录</p>
        ) : (
          myProperties.map((property) => (
            <div key={property.id} className="relative">
              <PropertyCard property={property} />
              <div className="absolute top-2 right-2 flex gap-2">
                <Link
                  href={`/edit-property/${property.id}`}
                  className="text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                >编辑</Link>
                <button
                  onClick={() => handleDelete(property.id)}
                  className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                >删除</button>
              </div>
            </div>
          ))
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">❤️ 我的收藏</h2>
        {favorites.length === 0 ? (
          <p>暂无收藏房源</p>
        ) : (
          favorites.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))
        )}
      </div>
    </div>
  );
}
