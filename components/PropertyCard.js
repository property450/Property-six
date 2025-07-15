import Link from 'next/link';
import { useUser } from '@supabase/auth-helpers-react';
import { supabase } from '../supabaseClient';
import { useState } from 'react';

export default function PropertyCard({ property }) {
  const {
    id,
    title,
    price,
    location,
    bedrooms,
    bathrooms,
    carparks,
    type,
    image_urls = [],
  } = property;

  const cover = image_urls.length > 0 ? image_urls[0] : '/no-image.jpg';
  const user = useUser();
  const [isFav, setIsFav] = useState(false);

  async function toggleFavorite() {
    if (!user) {
      alert('请先登录再收藏房源');
      return;
    }

    if (isFav) {
      await supabase.from('favorites').delete().match({ user_id: user.id, property_id: id });
      setIsFav(false);
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, property_id: id });
      setIsFav(true);
    }
  }

  return (
    <div className="group flex flex-col md:flex-row border rounded-2xl shadow hover:shadow-lg transition overflow-hidden bg-white">
      <img
        src={cover}
        alt={title}
        loading="lazy"
        className="w-full md:w-64 h-48 md:h-auto object-cover"
      />

      <div className="p-4 flex-1 space-y-2">
        <div className="flex justify-between items-start">
          <h2 className="text-xl font-semibold text-gray-800 line-clamp-1">{title}</h2>
          <button
            onClick={toggleFavorite}
            className={`text-xl ${isFav ? 'text-red-500' : 'text-gray-400'} hover:scale-110 transition`}
            title={isFav ? '取消收藏' : '添加收藏'}
          >
            ❤️
          </button>
        </div>

        <p className="text-gray-500 text-sm line-clamp-1">📍 {location}</p>

        <p className="text-lg font-bold text-blue-700">RM {Number(price).toLocaleString()}</p>

        <div className="flex flex-wrap gap-3 text-sm text-gray-700">
          <span>🛏 {bedrooms || 0} 房</span>
          <span>🛁 {bathrooms || 0} 浴</span>
          <span>🚗 {carparks || 0} 车</span>
        </div>

        <p className="text-xs text-gray-500">🏷 {type || '未分类'}</p>

        <Link
          href={`/property/${id}`}
          className="inline-block bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 text-sm mt-2"
        >
          查看详情
        </Link>
      </div>
    </div>
  );
}
