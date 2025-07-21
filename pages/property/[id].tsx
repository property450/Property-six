// pages/property/[id].tsx
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import Image from 'next/image';
import Head from 'next/head';
import Header from '../../components/Header';

export default function PropertyDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (id) fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching property:', error.message);
      setErrorMsg('无法加载房源信息');
    } else {
      setProperty(data);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="p-4 text-center">加载中...</div>;
  }

  if (errorMsg || !property) {
    return <div className="p-4 text-center text-red-500">{errorMsg || '找不到房源'}</div>;
  }

  const images = property.image || (property.image_url ? [property.image_url] : []);

  return (
    <>
      <Head>
        <title>{property.title || '房源详情'}</title>
      </Head>
      <Header />
      <main className="max-w-5xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">{property.title}</h1>

        {/* 图片展示 */}
        {images.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {images.map((url, index) => (
              <div key={index} className="relative w-full h-64 rounded overflow-hidden shadow">
                <Image
                  src={url}
                  alt={`房源图片 ${index + 1}`}
                  layout="fill"
                  objectFit="cover"
                  className="rounded"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 mb-6">暂无图片</div>
        )}

        {/* 房源详情 */}
        <div className="space-y-2 text-lg">
          <p><strong>价格：</strong>RM {property.price}</p>
          <p><strong>地点：</strong>{property.location}</p>
          <p><strong>类型：</strong>{property.type}</p>
          <p><strong>房间数：</strong>{property.bedrooms}</p>
          <p><strong>浴室数：</strong>{property.bathrooms}</p>
          <p><strong>描述：</strong>{property.description}</p>
        </div>
      </main>
    </>
  );
}
