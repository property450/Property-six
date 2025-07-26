import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import TypeSelector from '@/components/TypeSelector';
import { useUser } from '@supabase/auth-helpers-react';

const MapWithSearch = dynamic(() => import('@/components/MapWithSearch'), { ssr: false });

export default function UploadPropertyPage() {
  const router = useRouter();
  const user = useUser();
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [selectedType, setSelectedType] = useState('');
  // 初始化数量字段
const [bathroomCount, setBathroomCount] = useState(0);
const [bedroomCount, setBedroomCount] = useState(0);
const [carParkCount, setCarParkCount] = useState(0);
const [storeCount, setStoreCount] = useState(0);
  const [images, setImages] = useState([]);

  const handleUpload = async () => {
    const { data, error } = await supabase
      .from('properties')
      .insert([{
        title,
        address,
        price: parseFloat(price),
        description,
        type: selectedType,
        bedrooms: roomCount,
        bathrooms: bathroomCount,
        carpark: carParkCount,
        store: storeCount,
        latitude: lat,
        longitude: lng,
        user_id: user?.id,
        images,
      }]);

    if (error) {
      console.error('上传失败:', error);
      alert('上传失败，请检查资料是否填写完整');
    } else {
      alert('上传成功！');
      router.push('/');
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-4">上传房产</h1>
      <Input placeholder="标题" value={title} onChange={(e) => setTitle(e.target.value)} className="mb-2" />
      <Input placeholder="地址" value={address} onChange={(e) => setAddress(e.target.value)} className="mb-2" />
      <Input placeholder="价格" value={price} onChange={(e) => setPrice(e.target.value)} className="mb-2" />
      <Input placeholder="房间数" value={roomCount} onChange={(e) => setRoomCount(e.target.value)} className="mb-2" />
      <Input placeholder="浴室数" value={bathroomCount} onChange={(e) => setBathroomCount(e.target.value)} className="mb-2" />
      <Input placeholder="停车位数量" value={carParkCount} onChange={(e) => setCarParkCount(e.target.value)} className="mb-2" />
      <Input placeholder="储藏室数量" value={storeCount} onChange={(e) => setStoreCount(e.target.value)} className="mb-2" />
      <TypeSelector selectedType={selectedType} setSelectedType={setSelectedType} />
      <Input placeholder="描述" value={description} onChange={(e) => setDescription(e.target.value)} className="mb-2" />
      <MapWithSearch setLat={setLat} setLng={setLng} />
      <Button className="mt-4" onClick={handleUpload}>上传</Button>
    </div>
  );
}
