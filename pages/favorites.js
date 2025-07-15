// pages/favorites.js
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '@supabase/auth-helpers-react';
import Link from 'next/link';
import Image from 'next/image';

export default function FavoritesPage() {
  const user = useUser();
  const [favorites, setFavorites] = useState([]);
  const [images, setImages] = useState({});

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

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
        imageMap[property.id] = property.image_urls[0];
      }
    }
    setImages(imageMap);
  }

  if (!user) return <div className="p-4">请先登录</div>;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">我的收藏</h1>
      {favorites.length === 0 ? (
        <p>您还没有收藏任何房源</p>
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
    </div>
  );
}

