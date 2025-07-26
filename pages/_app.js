// pages/upload-property.js

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { supabase } from '@/supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import TypeSelector from '@/components/TypeSelector';
import RoomCountSelector from '@/components/RoomCountSelector';
import ImageUpload from '@/components/ImageUpload';
import { toast } from 'react-hot-toast';

const AddressSearchInput = dynamic(() => import('@/components/AddressSearchInput'), { ssr: false });

export default function UploadProperty() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [carparks, setCarparks] = useState('');
  const [storeRooms, setStoreRooms] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [images, setImages] = useState([]); // files
  const [coverIndex, setCoverIndex] = useState(0); // 0为默认封面图
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
   console.log('🚀 上传按钮已点击'); // 加这一行测试
    if (!title || !price || !address || !latitude || !longitude || images.length === 0) {
      toast.error('请填写完整信息并至少上传一张图片');
      return;
    }

    setLoading(true);

    // 1. 上传图片到 Supabase Storage
    const uploadedImageUrls = [];

    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      const filename = `${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage.from('property-images').upload(filename, file);

      if (error) {
        toast.error(`上传图片失败：${file.name}`);
        setLoading(false);
        return;
      }

      const imageUrl = supabase.storage.from('property-images').getPublicUrl(filename).data.publicUrl;
      uploadedImageUrls.push(imageUrl);
    }

    // 2. 插入房源信息到数据库
    const { error: insertError } = await supabase.from('properties').insert([
      {
        title,
        price: parseFloat(price),
        description,
        type,
        bedrooms,
        bathrooms,
        carparks,
        storerooms: storeRooms,
        address,
        latitude,
        longitude,
        images: uploadedImageUrls,
        coverImage: uploadedImageUrls[coverIndex] || uploadedImageUrls[0],
        created_at: new Date(),
      },
    ]);

    if (insertError) {
      toast.error('房源上传失败');
      setLoading(false);
      return;
    }

    toast.success('房源上传成功！');
    router.push('/'); // 上传成功跳转主页或其他页面
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">上传房源</h1>

      <Input placeholder="标题" value={title} onChange={(e) => setTitle(e.target.value)} className="mb-3" />
      <Input placeholder="价格 (RM)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="mb-3" />

      <TypeSelector selectedType={type} onChange={setType} className="mb-3" />

      <RoomCountSelector label="房间数量" value={bedrooms} onChange={setBedrooms} />
      <RoomCountSelector label="厕所数量" value={bathrooms} onChange={setBathrooms} />
      <RoomCountSelector label="车位数量" value={carparks} onChange={setCarparks} />
      <RoomCountSelector label="储藏室数量" value={storeRooms} onChange={setStoreRooms} />

      <AddressSearchInput
        onLocationSelect={(lat, lng, selectedAddress) => {
          setLatitude(lat);
          setLongitude(lng);
          setAddress(selectedAddress);
        }}
      />
      <div className="text-sm text-gray-500 mb-2">选中地址: {address}</div>

      <textarea
        placeholder="房源描述"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
        className="w-full border rounded p-2 mb-3"
      />

      <ImageUpload
        images={images}
        setImages={setImages}
        coverIndex={coverIndex}
        setCoverIndex={setCoverIndex}
      />

      <Button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-blue-600 text-white p-3 rounded hover:bg-blue-700 w-full"
      >
        {loading ? '上传中...' : '提交房源'}
      </Button>
    </div>
  );
};

