// pages/upload-property.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../supabaseClient';
import dynamic from 'next/dynamic';
import TypeSelector from '@/components/TypeSelector';
import RoomCountSelector from '@/components/RoomCountSelector';
import BathroomCountSelector from '@/components/BathroomCountSelector';
import ParkingCountSelector from '@/components/ParkingCountSelector';
import StorageCountSelector from '@/components/StorageCountSelector';
import ImageUploader from '@/components/ImageUploader';

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

export default function UploadProperty() {
  const [type, setType] = useState('');
  const [bedrooms, setBedrooms] = useState(0);
  const [bathrooms, setBathrooms] = useState(0);
  const [carpark, setCarpark] = useState(0);
  const [store, setStore] = useState(0);
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [images, setImages] = useState([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');

  const router = useRouter();

  const handleUpload = async () => {
    if (!type || !location.lat || !location.lng || images.length === 0) {
      alert('请填写所有字段并上传图片');
      return;
    }

    const imageUrls = images.map((img, index) => ({
      url: img,
      is_cover: index === coverIndex,
    }));

    const { error } = await supabase.from('properties').insert([
      {
        title,
        price: Number(price),
        type,
        bedrooms,
        bathrooms,
        carpark,
        store,
        latitude: location.lat,
        longitude: location.lng,
        images: imageUrls,
        created_at: new Date(),
      },
    ]);

    if (error) {
      alert('上传失败: ' + error.message);
    } else {
      alert('上传成功');
      router.push('/');
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">上传房源</h1>

      <input
        className="w-full p-2 border rounded"
        type="text"
        placeholder="标题"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <input
        className="w-full p-2 border rounded"
        type="number"
        placeholder="价格"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />

      <TypeSelector value={type} onChange={setType} />
      <RoomCountSelector value={bedrooms} onChange={setBedrooms} />
      <BathroomCountSelector value={bathrooms} onChange={setBathrooms} />
      <ParkingCountSelector value={carpark} onChange={setCarpark} />
      <StorageCountSelector value={store} onChange={setStore} />

      <MapPicker onLocationSelect={(latlng) => setLocation(latlng)} />

      <ImageUploader
        onUploadComplete={(urls) => setImages(urls)}
        onCoverSelect={(index) => setCoverIndex(index)}
      />

      <button
        className="bg-blue-600 text-white px-4 py-2 rounded w-full"
        onClick={handleUpload}
      >
        提交房源
      </button>
    </div>
  );
}
