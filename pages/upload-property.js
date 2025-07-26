import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/supabaseClient';
import dynamic from 'next/dynamic';
import ImageUpload from '@/components/ImageUpload';
import TypeSelector from '@/components/TypeSelector';
import RoomCountSelector from '@/components/RoomCountSelector';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function UploadProperty() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [roomCount, setRoomCount] = useState('');
  const [bathroomCount, setBathroomCount] = useState('');
  const [carParkCount, setCarParkCount] = useState('');
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    setUploading(true);

    let lat = null;
    let lng = null;

    // 🧠 自动地址转经纬度
    try {
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
      const geoData = await geoRes.json();
      if (geoData.length > 0) {
        lat = parseFloat(geoData[0].lat);
        lng = parseFloat(geoData[0].lon);
      } else {
        alert('无法解析地址，请检查是否正确。');
        setUploading(false);
        return;
      }
    } catch (error) {
      alert('地址解析失败，请稍后重试');
      setUploading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('properties')
      .insert([{
        title,
        address,
        price: parseFloat(price),
        description,
        type: selectedType,
        room_count: roomCount,
        bathroom_count: bathroomCount,
        car_park_count: carParkCount,
        latitude: lat,
        longitude: lng,
        user_id: user?.id,
        images,
      }]);

    if (error) {
      alert('上传失败');
      console.error(error);
    } else {
      router.push('/');
    }

    setUploading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">上传房产</h1>
      <Input placeholder="标题" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Input placeholder="地址" value={address} onChange={(e) => setAddress(e.target.value)} />
      <Input placeholder="价格 (RM)" value={price} onChange={(e) => setPrice(e.target.value)} />
      <TypeSelector selectedType={selectedType} setSelectedType={setSelectedType} />
      <RoomCountSelector label="房间数量" count={roomCount} setCount={setRoomCount} />
      <RoomCountSelector label="浴室数量" count={bathroomCount} setCount={setBathroomCount} />
      <RoomCountSelector label="车位数量" count={carParkCount} setCount={setCarParkCount} />
      <textarea placeholder="描述" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border p-2 rounded" />
      <ImageUpload images={images} setImages={setImages} />
      <Button onClick={handleUpload} disabled={uploading}>
        {uploading ? '上传中...' : '上传'}
      </Button>
    </div>
  );
}
