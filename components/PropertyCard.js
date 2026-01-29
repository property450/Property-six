import Link from 'next/link';
import { useUser } from '@supabase/auth-helpers-react';
import { supabase } from '../supabaseClient';
import { useState } from 'react';

/**
 * ✅ 统一从 JSON 表单解析卡片显示数据
 * 保证：编辑页看到什么，这里就显示什么
 */
function getListingSummary(property) {
  const {
    title,
    price,
    bedrooms,
    bathrooms,
    carparks,
    type,
    location,
    image_urls = [],
    single_form_data_v2,
    homestay_form,
    hotel_resort_form,
  } = property;

  // 默认 fallback（旧 column）
  let summary = {
    title: title || '未命名房源',
    price: price || 0,
    bedrooms: bedrooms || 0,
    bathrooms: bathrooms || 0,
    carparks: carparks || 0,
    type: type || '未分类',
    location: location || '',
    cover: image_urls?.[0] || '/no-image.jpg',
  };

  // 👉 Sale / Rent（主表单）
  if (single_form_data_v2 && typeof single_form_data_v2 === 'object') {
    const s = single_form_data_v2;

    summary.title = s.title || summary.title;
    summary.price = s.price || summary.price;
    summary.bedrooms = s.bedrooms ?? summary.bedrooms;
    summary.bathrooms = s.bathrooms ?? summary.bathrooms;
    summary.carparks = s.carparks ?? summary.carparks;
    summary.type = s.category || summary.type;
    summary.location = s.location || summary.location;
    summary.cover = s.coverImage || summary.cover;
  }

  // 👉 Homestay
  if (homestay_form && typeof homestay_form === 'object') {
    const h = homestay_form;

    summary.title = h.title || summary.title;
    summary.price = h.price || summary.price;
    summary.bedrooms = h.bedrooms ?? summary.bedrooms;
    summary.bathrooms = h.bathrooms ?? summary.bathrooms;
    summary.carparks = h.carparks ?? summary.carparks;
    summary.type = 'Homestay';
    summary.location = h.location || summary.location;
    summary.cover = h.coverImage || summary.cover;
  }

  // 👉 Hotel / Resort
  if (hotel_resort_form && typeof hotel_resort_form === 'object') {
    const h = hotel_resort_form;

    summary.title = h.title || summary.title;
    summary.price = h.price || summary.price;
    summary.bedrooms = h.roomCount ?? summary.bedrooms;
    summary.bathrooms = h.bathrooms ?? summary.bathrooms;
    summary.carparks = h.carparks ?? summary.carparks;
    summary.type = 'Hotel / Resort';
    summary.location = h.location || summary.location;
    summary.cover = h.coverImage || summary.cover;
  }

  return summary;
}

export default function PropertyCard({ property }) {
  const user = useUser();
  const [isFav, setIsFav] = useState(false);

  const {
    id,
  } = property;

  // ✅ 关键：所有显示都来自这里
  const {
    title,
    price,
    bedrooms,
    bathrooms,
    carparks,
    type,
    location,
    cover,
  } = getListingSummary(property);

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

        <p className="text-lg font-bold text-blue-700">
          RM {Number(price || 0).toLocaleString()}
        </p>

        <div className="flex flex-wrap gap-3 text-sm text-gray-700">
          <span>🛏 {bedrooms} 房</span>
          <span>🛁 {bathrooms} 浴</span>
          <span>🚗 {carparks} 车</span>
        </div>

        <p className="text-xs text-gray-500">🏷 {type}</p>

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
