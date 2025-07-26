// pages/upload-property.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { supabase } from '@/supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import TypeSelector from '@/components/TypeSelector';
import RoomCountSelector from '@/components/RoomCountSelector';
import PriceRangeSelector from '@/components/PriceRangeSelector';
import ImageUpload from '@/components/ImageUpload';
import MapPicker from '@/components/MapPicker';

export default function UploadProperty() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState({ lat: null, lng: null });
  const [mainType, setMainType] = useState('');
  const [subType, setSubType] = useState('');
  const [roomCount, setRoomCount] = useState(0);
  const [images, setImages] = useState([]);
  const [coverIndex, setCoverIndex] = useState(0);

  const router = useRouter();

  const handleUpload = async () => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return alert('请先登录');

    const { data, error } = await supabase
      .from('properties')
      .insert([
        {
          title,
          description,
          price: parseFloat(price),
          location,
          lat: coordinates.lat,
          lng: coordinates.lng,
          type: { mainType, subType },
          room_count: roomCount,
          user_id: user.id,
        },
      ])
      .select()
      .single();

    if (error) return alert('房源上传失败：' + error.message);

    const propertyId = data.id;

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const fileExt = image.name.split('.').pop();
      const filePath = `${propertyId}/${Date.now()}-${i}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(filePath, image);

      if (!uploadError) {
        await supabase.from('property_images').insert([
          {
            property_id: propertyId,
            image_url: filePath,
            is_cover: i === coverIndex,
          },
        ]);
      }
    }

    alert('房源上传成功！');
    router.push('/');
  };

  const handleMapSelect = (lat, lng, address) => {
    setCoordinates({ lat, lng });
    setLocation(address);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold mb-4">上传房源</h1>

      <Input placeholder="标题" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea
        placeholder="描述"
        className="w-full border rounded p-2"
        rows={3}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <Input placeholder="价格 (RM)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />

      <TypeSelector
        mainType={mainType}
        setMainType={setMainType}
        subType={subType}
        setSubType={setSubType}
      />

      <RoomCountSelector value={roomCount} onChange={setRoomCount} />
      <PriceRangeSelector value={price} onChange={setPrice} />

      <ImageUpload images={images} setImages={setImages} coverIndex={coverIndex} setCoverIndex={setCoverIndex} />

      {/* 避免 SSR 报错，仅客户端渲染 */}
      {typeof window !== 'undefined' && (
        <MapPicker onSelect={handleMapSelect} />
      )}

      <Input placeholder="地点" value={location} onChange={(e) => setLocation(e.target.value)} />

      <Button onClick={handleUpload}>上传房源</Button>
    </div>
  );
}
