// pages/upload-property.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/supabaseClient';
import dynamic from 'next/dynamic';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import TypeSelector from '@/components/TypeSelector';
import RoomCountSelector from '@/components/RoomCountSelector';
import PriceRangeSelector from '@/components/PriceRangeSelector';
import ImageUpload from '@/components/ImageUpload';

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

export default function UploadProperty() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [type, setType] = useState({ mainType: '', subType: '' });
  const [rooms, setRooms] = useState({ bedroom: 0, bathroom: 0, parking: 0, storage: 0 });
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [images, setImages] = useState([]); // [{ file, url, isCover }]
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpload = async () => {
    if (!title || !price || !location.lat || !location.lng) {
      alert('请填写所有必填字段');
      return;
    }

    setLoading(true);

    // 上传图片
    const uploadedImageUrls = [];
    for (const image of images) {
      const fileExt = image.file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const { data, error } = await supabase.storage.from('property-images').upload(fileName, image.file);
      if (error) {
        console.error('图片上传失败:', error);
        continue;
      }
      const url = supabase.storage.from('property-images').getPublicUrl(fileName).data.publicUrl;
      uploadedImageUrls.push({ url, isCover: image.isCover });
    }

    // 发送到 Supabase 数据库
    const { error: insertError } = await supabase.from('properties').insert([
      {
        title,
        description,
        price: parseFloat(price),
        type: type.mainType,
        subtype: type.subType,
        bedroom: rooms.bedroom,
        bathroom: rooms.bathroom,
        parking: rooms.parking,
        storage: rooms.storage,
        lat: location.lat,
        lng: location.lng,
        images: uploadedImageUrls,
        created_at: new Date(),
      },
    ]);

    setLoading(false);

    if (insertError) {
      alert('上传失败');
      console.error(insertError);
    } else {
      alert('上传成功');
      router.push('/');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">上传房源</h1>

      <Input placeholder="标题" value={title} onChange={(e) => setTitle(e.target.value)} className="mb-3" />

      <textarea
        className="w-full border rounded p-2 mb-3"
        rows={3}
        placeholder="描述"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <Input
        placeholder="价格 (RM)"
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="mb-3"
      />

      <TypeSelector selectedType={type} onChange={setType} />

      <RoomCountSelector
        label="卧室"
        value={rooms.bedroom}
        onChange={(value) => setRooms({ ...rooms, bedroom: value })}
      />

      <RoomCountSelector
        label="浴室"
        value={rooms.bathroom}
        onChange={(value) => setRooms({ ...rooms, bathroom: value })}
      />

      <RoomCountSelector
        label="车位"
        value={rooms.parking}
        onChange={(value) => setRooms({ ...rooms, parking: value })}
      />

      <RoomCountSelector
        label="储藏室"
        value={rooms.storage}
        onChange={(value) => setRooms({ ...rooms, storage: value })}
      />

      <div className="my-4">
        <h2 className="font-semibold mb-2">地图选点</h2>
        <MapPicker location={location} onLocationChange={setLocation} />
      </div>

      <div className="my-4">
        <h2 className="font-semibold mb-2">上传图片</h2>
        <ImageUpload images={images} setImages={setImages} />
      </div>

      <Button onClick={handleUpload} disabled={loading}>
        {loading ? '上传中...' : '提交房源'}
      </Button>
    </div>
  );
}
