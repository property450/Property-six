// pages/upload-property.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@supabase/auth-helpers-react';
import { supabase } from '@/supabaseClient';
import TypeSelector from '@/components/TypeSelector';
import RoomCountSelector from '@/components/RoomCountSelector';
import ImageUpload from '@/components/ImageUpload';
import MapPicker from '@/components/MapPicker';

export default function UploadPropertyPage() {
  const { user } = useUser();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [type, setType] = useState('');
  const [bedrooms, setBedrooms] = useState(0);
  const [bathrooms, setBathrooms] = useState(0);
  const [carpark, setCarpark] = useState(0);
  const [store, setStore] = useState(0);
  const [images, setImages] = useState([]);
  const [location, setLocation] = useState({ lat: null, lng: null });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert('请先登录');

    const { data, error } = await supabase.from('properties').insert([{
      title,
      price: Number(price),
      type,
      bedrooms,
      bathrooms,
      carpark,
      store,
      latitude: location.lat,
      longitude: location.lng,
      user_id: user.id,
      images,
    }]);

    if (error) {
      console.error('上传失败', error);
      alert('上传失败');
    } else {
      alert('上传成功');
      router.push('/');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">上传房源</h1>
      <form onSubmit={handleSubmit} className="space-y-4">

        <input
          type="text"
          placeholder="房产标题"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border rounded p-2"
          required
        />

        <input
          type="number"
          placeholder="价格"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full border rounded p-2"
          required
        />

        <TypeSelector selectedType={type} setSelectedType={setType} />

        <RoomCountSelector
          label="房间数"
          value={bedrooms}
          setValue={setBedrooms}
        />

        <RoomCountSelector
          label="浴室数"
          value={bathrooms}
          setValue={setBathrooms}
        />

        <RoomCountSelector
          label="车位数"
          value={carpark}
          setValue={setCarpark}
        />

        <RoomCountSelector
          label="储藏室"
          value={store}
          setValue={setStore}
        />

        <ImageUpload images={images} setImages={setImages} />

        <MapPicker setLocation={setLocation} />

        <button
          type="submit"
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          提交房源
        </button>
      </form>
    </div>
  );
}
