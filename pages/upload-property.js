// pages/upload-property.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { supabase } from '@/supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ImageUpload from '@/components/ImageUpload';
import TypeSelector from '@/components/TypeSelector';
import RoomCountSelector from '@/components/RoomCountSelector';
import BathroomCountSelector from '@/components/BathroomCountSelector';
import ParkingCountSelector from '@/components/ParkingCountSelector';
import StorageCountSelector from '@/components/StorageCountSelector';

// 👇 解决 window 错误（MapPicker 只在客户端加载）
const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

export default function UploadPropertyPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [images, setImages] = useState([]);
  const [type, setType] = useState('');
  const [rooms, setRooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [parking, setParking] = useState('');
  const [storage, setStorage] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!title || !price || !location || !latitude || !longitude || !images.length) {
      alert('请填写所有字段并上传至少一张图片');
      return;
    }

    setUploading(true);

    try {
      // 1. 插入房源信息
      const { data: property, error } = await supabase
        .from('properties')
        .insert([{
          title,
          price: parseFloat(price),
          location,
          latitude,
          longitude,
          type,
          rooms,
          bathrooms,
          parking,
          storage,
        }])
        .select()
        .single();

      if (error) throw error;

      const propertyId = property.id;

      // 2. 上传图片到 Supabase bucket 并插入路径到 property_images 表
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const fileExt = image.name.split('.').pop();
        const filePath = `${propertyId}/${Date.now()}_${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(filePath, image);

        if (uploadError) throw uploadError;

        const { data: publicURLData } = supabase.storage
          .from('property-images')
          .getPublicUrl(filePath);

        const imageUrl = publicURLData.publicUrl;

        await supabase.from('property_images').insert([{
          property_id: propertyId,
          image_url: imageUrl,
          is_cover: i === 0, // 第一张为封面
        }]);
      }

      alert('上传成功');
      router.push('/');
    } catch (err) {
      console.error('上传失败:', err);
      alert('上传失败，请稍后再试');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">上传房源</h1>

      <Input placeholder="标题" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Input placeholder="价格（RM）" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
      <Input placeholder="地址" value={location} onChange={(e) => setLocation(e.target.value)} />

      <TypeSelector selectedType={type} onTypeChange={setType} />
      <RoomCountSelector value={rooms} onChange={setRooms} />
      <BathroomCountSelector value={bathrooms} onChange={setBathrooms} />
      <ParkingCountSelector value={parking} onChange={setParking} />
      <StorageCountSelector value={storage} onChange={setStorage} />

      <div>
        <label className="font-semibold">地图定位：</label>
        <MapPicker onLocationSelect={(lat, lng) => {
          setLatitude(lat);
          setLongitude(lng);
        }} />
        {latitude && longitude && (
          <p className="text-sm text-gray-500 mt-1">已选位置：{latitude.toFixed(6)}, {longitude.toFixed(6)}</p>
        )}
      </div>

      <ImageUpload images={images} setImages={setImages} />

      <Button onClick={handleUpload} disabled={uploading}>
        {uploading ? '上传中...' : '提交房源'}
      </Button>
    </div>
  );
}
