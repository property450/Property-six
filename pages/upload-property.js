// pages/upload-property.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../supabaseClient';
import dynamic from 'next/dynamic';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import TypeSelector from '@/components/TypeSelector';
import RoomCountSelector from '@/components/RoomCountSelector';
import BathroomCountSelector from '@/components/BathroomCountSelector';
import ParkingCountSelector from '@/components/ParkingCountSelector';
import StorageCountSelector from '@/components/StorageCountSelector';
import ImageUpload from '@/components/ImageUpload';

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

export default function UploadProperty() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [type, setType] = useState('');
  const [subtype, setSubtype] = useState('');
  const [bedrooms, setBedrooms] = useState(0);
  const [bathrooms, setBathrooms] = useState(0);
  const [carpark, setCarpark] = useState(0);
  const [store, setStore] = useState(0);
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [images, setImages] = useState([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUser(data.user);
      else router.push('/login');
    });
  }, []);

  const handleSubmit = async () => {
    if (!title || !price || !type || !location.lat || !images.length) {
      alert('请填写所有必要字段');
      return;
    }

    const { data, error } = await supabase.from('properties').insert([{
      user_id: user.id,
      title,
      description,
      price: Number(price),
      type,
      subtype,
      bedrooms,
      bathrooms,
      carpark,
      store,
      latitude: location.lat,
      longitude: location.lng,
      created_at: new Date(),
    ]]).select().single();

    if (error) {
      alert('上传失败：' + error.message);
      return;
    }

    const propertyId = data.id;

    for (let i = 0; i < images.length; i++) {
      const file = images[i].file;
      const fileExt = file.name.split('.').pop();
      const filePath = `${propertyId}/${Date.now()}_${i}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('图片上传失败:', uploadError);
        continue;
      }

      const { data: publicUrlData } = supabase.storage
        .from('property-images')
        .getPublicUrl(filePath);

      const is_cover = i === 0;

      await supabase.from('property_images').insert([{
        property_id: propertyId,
        url: publicUrlData.publicUrl,
        is_cover,
      }]);
    }

    router.push('/');
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-4">上传房产</h1>

      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="标题" />
      <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="价格 (RM)" type="number" />
      <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="描述" />

      <TypeSelector onChange={(main, sub) => {
        setType(main);
        setSubtype(sub);
      }} />

      <RoomCountSelector value={bedrooms} onChange={setBedrooms} />
      <BathroomCountSelector value={bathrooms} onChange={setBathrooms} />
      <ParkingCountSelector value={carpark} onChange={setCarpark} />
      <StorageCountSelector value={store} onChange={setStore} />

      <MapPicker onSelectLocation={setLocation} />

      <ImageUpload images={images} setImages={setImages} />

      <Button onClick={handleSubmit} className="w-full mt-4">提交</Button>
    </div>
  );
}
