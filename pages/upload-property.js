// pages/upload-property.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../supabaseClient';
import dynamic from 'next/dynamic';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import TypeSelector from '@/components/TypeSelector';
import RoomCountSelector from '@/components/RoomCountSelector';
import PriceRangeSelector from '@/components/PriceRangeSelector';
import ImageUpload from '@/components/ImageUpload';

const MapPicker = dynamic(() => import('@/components/MapPicker'), {
  ssr: false,
});

export default function UploadProperty() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mainType, setMainType] = useState('');
  const [subType, setSubType] = useState('');
  const [customSubType, setCustomSubType] = useState('');
  const [bedrooms, setBedrooms] = useState(0);
  const [bathrooms, setBathrooms] = useState(0);
  const [carparks, setCarparks] = useState(0);
  const [storeRooms, setStoreRooms] = useState(0);
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [images, setImages] = useState([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const router = useRouter();

  const handleUpload = async () => {
    if (!title || !price || !location.lat || !location.lng) {
      alert('请填写所有必填信息');
      return;
    }

    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      alert('请先登录');
      return;
    }

    const imageUrls = [];
    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      const fileName = `${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('property-images')
        .upload(fileName, file);
      if (error) {
        console.error('上传失败:', error);
        continue;
      }
      const url = supabase.storage.from('property-images').getPublicUrl(fileName).data.publicUrl;
      imageUrls.push(url);
    }

    const { error: insertError } = await supabase.from('properties').insert([
      {
        user_id: user.id,
        title,
        description,
        type: `${mainType} > ${customSubType || subType}`,
        bedrooms,
        bathrooms,
        carparks,
        store_rooms: storeRooms,
        price,
        lat: location.lat,
        lng: location.lng,
        images: imageUrls,
        cover_index: coverIndex,
      },
    ]);

    if (insertError) {
      console.error('插入失败:', insertError);
    } else {
      alert('上传成功');
      router.push('/');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">上传房源</h1>

      <Input placeholder="标题" value={title} onChange={e => setTitle(e.target.value)} />
      <textarea
        className="w-full p-2 border rounded"
        placeholder="描述"
        value={description}
        onChange={e => setDescription(e.target.value)}
      />

      <TypeSelector
        mainType={mainType}
        setMainType={setMainType}
        subType={subType}
        setSubType={setSubType}
        customSubType={customSubType}
        setCustomSubType={setCustomSubType}
      />

      <RoomCountSelector label="房间数" count={bedrooms} setCount={setBedrooms} />
      <RoomCountSelector label="浴室数" count={bathrooms} setCount={setBathrooms} />
      <RoomCountSelector label="车位数" count={carparks} setCount={setCarparks} />
      <RoomCountSelector label="储藏室" count={storeRooms} setCount={setStoreRooms} />

      <PriceRangeSelector min={0} max={50000000} value={price} onChange={val => setPrice(val)} />

      <MapPicker location={location} setLocation={setLocation} />

      <ImageUpload images={images} setImages={setImages} coverIndex={coverIndex} setCoverIndex={setCoverIndex} />

      <Button onClick={handleUpload}>提交房源</Button>
    </div>
  );
}
