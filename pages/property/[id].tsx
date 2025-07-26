// pages/property/[id].js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useUser } from '@supabase/auth-helpers-react';
import { FaHeart, FaRegHeart } from 'react-icons/fa';

export default function PropertyDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [property, setProperty] = useState(null);
  const [images, setImages] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const user = useUser();

  useEffect(() => {
    if (id) {
      fetchProperty();
    }
  }, [id]);

  const fetchProperty = async () => {
    const { data, error } = await supabase.from('properties').select('*').eq('id', id).single();
    if (data) {
      setProperty(data);
      if (data.image_urls) {
        try {
          const urls = JSON.parse(data.image_urls);
          setImages(Array.isArray(urls) ? urls : []);
        } catch {
          setImages([]);
        }
      }
      checkIfFavorite(data.id);
    }
  };

  const checkIfFavorite = async (propertyId) => {
    if (!user) return;
    const { data } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', user.id)
      .eq('property_id', propertyId)
      .single();
    setIsFavorite(!!data);
  };

  const toggleFavorite = async () => {
    if (!user || !property) return;
    if (isFavorite) {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('property_id', property.id);
      setIsFavorite(false);
    } else {
      await supabase.from('favorites').insert({
        user_id: user.id,
        property_id: property.id,
      });
      setIsFavorite(true);
    }
  };

  if (!property) {
    return <div className="p-4">载入中...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-2">{property.title}</h1>
      <div className="flex items-center justify-between mb-4">
        <p className="text-lg text-gray-600">RM {property.price?.toLocaleString()}</p>
        <Button onClick={toggleFavorite} variant="ghost" className="text-red-500">
          {isFavorite ? <FaHeart size={24} /> : <FaRegHeart size={24} />}
        </Button>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {images.map((url, index) => (
            <div key={index} className="relative w-full h-64 rounded overflow-hidden shadow">
              <Image
                src={url}
                alt={`Property Image ${index + 1}`}
                layout="fill"
                objectFit="cover"
              />
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <p><strong>地点：</strong> {property.address}</p>
        <p><strong>类型：</strong> {property.type}</p>
        <p><strong>房间数：</strong> {property.bedrooms}</p>
        <p><strong>浴室数：</strong> {property.bathrooms}</p>
        <p><strong>描述：</strong> {property.description}</p>
      </div>
    </div>
  );
}
