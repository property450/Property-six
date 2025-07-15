// pages/my-profile.js
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '@supabase/auth-helpers-react';
import Link from 'next/link';
import Image from 'next/image';

export default function MyProfile() {
  const user = useUser();
  const [myProperties, setMyProperties] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [images, setImages] = useState({});

  useEffect(() => {
    if (user) {
      fetchMyProperties();
      fetchFavorites();
    }
  }, [user]);

  async function fetchMyProperties() {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching my properties:', error);
    } else {
      setMyProperties(data);
      preloadImages(data);
    }
  }

  async function fetchFavorites() {
    const { data, error } = await supabase
      .from('favorites')
      .select('property_id, properties (*)')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching favorites:', error);
    } else {
      const properties = data.map((f) => f.properties);
      setFavorites(properties);
      preloadImages(properties);
    }
  }

  function preloadImages(properties) {
    const imageMap = {};
    for (const property of properties) {
      if (property.image_urls && property.image_urls.length > 0) {
        imageMap[property.id] = property.image_urls[0]; // 只取第一张图
      }
    }
    setImages(imageMap);
  }

  async function handleDelete(id) {
    const confirm = window.confirm('确定要删除该房源吗？');
    if (!confirm) return;

    const { error } = await supabase.from('properties').delete().eq('id', id);
    if (error) {
      console.error('删除失败:', error);
    } else {
      setMyProperties((prev) => prev.filter((item) => item.id !== id));
      alert('删除成功');
    }
  }

  if (!user) return <div className="p-4">请先登录</div>;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">我的主页</h1>

      {/* 我的上传房源 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">我上传的房源</h2>
        {myProperties.length === 0 ? (
          <p>暂无房源</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myProperties.map((property) => (
              <div key={property.id} className="border p-2 rounded">
                <Link href={`/property/${property.id}`}>
                  <div className="relative w-full h-48 mb-2">
                    {images[property.id] && (
                      <Image
                        src={images[property.id]}
                        alt={property.title}
                        layout="fill"
                        objectFit="cover"
                        className="rounded"
                      />
                    )}
                  </div>
                  <h3 className="font-bold">{property.title}</h3>
                  <p className="text-sm text-gray-600">RM {property.price}</p>
                </Link>
                <div className="flex justify-between mt-2">
                  <Link
                    href={`/edit-property/${property.id}`}
                    className="text-blue-600 text-sm"
                  >
                    编辑
                  </Link>
                  <button
                    onClick={() => handleDelete(property.id)}
                    className="text-red-600 text-sm"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 我的收藏 */}
      <section>
        <h2 className="text-xl font-semibold mb-2">我收藏的房源</h2>
        {favorites.length === 0 ? (
          <p>暂无收藏</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {favorites.map((property) => (
              <Link
                key={property.id}
                href={`/property/${property.id}`}
                className="border p-2 rounded block"
              >
                <div className="relative w-full h-48 mb-2">
                  {images[property.id] && (
                    <Image
                      src={images[property.id]}
                      alt={property.title}
                      layout="fill"
                      objectFit="cover"
                      className="rounded"
                    />
                  )}
                </div>
                <h3 className="font-bold">{property.title}</h3>
                <p className="text-sm text-gray-600">RM {property.price}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
