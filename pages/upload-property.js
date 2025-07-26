// pages/upload-property.js

import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import TypeSelector from '@/components/TypeSelector';
import RoomCountSelector from '@/components/RoomCountSelector';
import PriceRangeSelector from '@/components/PriceRangeSelector';
import MapPicker from '@/components/MapPicker';
import ImageUpload from '@/components/ImageUpload';

export default function UploadProperty() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [type, setType] = useState('');
  const [bedrooms, setBedrooms] = useState(0);
  const [bathrooms, setBathrooms] = useState(0);
  const [carpark, setCarpark] = useState(0);
  const [store, setStore] = useState(0);
  const [location, setLocation] = useState(null); // { lat, lng }
  const [images, setImages] = useState([]);
  const [coverIndex, setCoverIndex] = useState(0);

  const handleSubmit = async () => {
    if (!title || !price || !type || !location) {
      alert('请填写所有必填字段');
      return;
    }

    // 插入 property 数据
    const { data, error } = await supabase
      .from('properties')
      .insert([{
        title,
        description,
        price: Number(price),
        type,
        bedrooms,
        bathrooms,
        carpark,
        store,
        latitude: location.lat,
        longitude: location.lng,
        created_at: new Date(),
      }])
      .select()
      .single();

    if (error) {
      alert('上传失败: ' + error.message);
      return;
    }

    const propertyId = data.id;

    // 插入 images
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      await supabase.from('property_images').insert([{
        property_id: propertyId,
        url: image.url,
        is_cover: i === coverIndex,
      }]);
    }

    alert('房产上传成功！');
    router.push('/');
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">上传房源</h1>

      <Input placeholder="标题" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Input placeholder="价格 (RM)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
      <Input placeholder="描述" value={description} onChange={(e) => setDescription(e.target.value)} />

      <TypeSelector value={type} onChange={setType} />

      <RoomCountSelector label="房间数" value={bedrooms} onChange={setBedrooms} />
      <RoomCountSelector label="浴室数" value={bathrooms} onChange={setBathrooms} />
      <RoomCountSelector label="车位数" value={carpark} onChange={setCarpark} />
      <RoomCountSelector label="储藏室数" value={store} onChange={setStore} />

      <MapPicker onLocationSelect={setLocation} />

      <ImageUpload images={images} setImages={setImages} coverIndex={coverIndex} setCoverIndex={setCoverIndex} />

      <Button onClick={handleSubmit}>提交上传</Button>
    </div>
  );
}
