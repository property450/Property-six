// pages/property/[id].js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useUser } from '@supabase/auth-helpers-react';
import Image from 'next/image';
import Link from 'next/link';

export default function PropertyDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const user = useUser();

  const [property, setProperty] = useState(null);
  const [images, setImages] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProperty();
    }
  }, [id]);

  useEffect(() => {
    if (user && id) {
      checkFavorite();
    }
  }, [user, id]);

  async function fetchProperty() {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching property:', error);
    } else {
      setProperty(data);
      if (data.image_urls) {
        setImages(data.image_urls);
      }
    }
  }

  async function checkFavorite() {
    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', user.id)
      .eq('property_id', id)
      .single();

    setIsFavorite(!!data);
  }

  async function toggleFavorite() {
    if (!user) {
      alert('Please log in first');
      return;
    }

    if (isFavorite) {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('property_id', id);
      setIsFavorite(false);
    } else {
      await supabase
        .from('favorites')
        .insert({ user_id: user.id, property_id: id });
      setIsFavorite(true);
    }
  }

  if (!property) return <div>Loading...</div>;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{property.title}</h1>
        <button
          onClick={toggleFavorite}
          className={`p-2 rounded ${
            isFavorite ? 'bg-red-500 text-white' : 'bg-gray-200'
          }`}
        >
          {isFavorite ? '取消收藏' : '收藏'}
        </button>
      </div>

      {/* 多图展示 */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {images.map((url, index) => (
          <div key={index} className="relative w-full h-48">
            <Image
              src={url}
              alt={`Image ${index}`}
              layout="fill"
              objectFit="cover"
              className="rounded"
            />
          </div>
        ))}
      </div>

      {/* 房产信息 */}
      <div className="space-y-2 text-gray-800">
        <p><strong>价格：</strong> RM {property.price}</p>
        <p><strong>房间：</strong> {property.bedrooms}</p>
        <p><strong>浴室：</strong> {property.bathrooms}</p>
        <p><strong>车位：</strong> {property.carparks}</p>
        <p><strong>描述：</strong> {property.description}</p>
        <p><strong>地点：</strong> {property.location}</p>
      </div>

      {/* 编辑按钮（仅限上传人） */}
      {user?.id === property.user_id && (
        <Link href={`/edit-property/${property.id}`}>
          <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">
            编辑房产信息
          </button>
        </Link>
      )}
    </div>
  );
}
