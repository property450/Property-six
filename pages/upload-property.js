import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import TypeSelector from '@/components/TypeSelector';
import ImageUpload from '@/components/ImageUpload';
import RoomCountSelector from '@/components/RoomCountSelector';
import axios from 'axios';

export default function UploadProperty() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [address, setAddress] = useState('');
  const [mainType, setMainType] = useState('');
  const [subType, setSubType] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [parking, setParking] = useState('');
  const [storeRoom, setStoreRoom] = useState('');
  const [images, setImages] = useState([]);

  const [uploading, setUploading] = useState(false);

  const getLatLngFromAddress = async (address) => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;
    const res = await axios.get(url);
    const result = res.data.results?.[0];
    if (!result) throw new Error('地址无法识别');
    return {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      const { lat, lng } = await getLatLngFromAddress(address);

      const { data, error } = await supabase
        .from('properties')
        .insert([{
          title,
          price: parseFloat(price),
          address,
          lat,
          lng,
          type: `${mainType} > ${subType}`,
          bedrooms: parseInt(bedrooms),
          bathrooms: parseInt(bathrooms),
          parking: parseInt(parking),
          storeRoom: parseInt(storeRoom),
          images
        }]);

      if (error) throw error;

      router.push('/');
    } catch (err) {
      alert(`上传失败: ${err.message}`);
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">上传房源</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input placeholder="标题" value={title} onChange={e => setTitle(e.target.value)} required />
        <Input placeholder="价格（RM）" type="number" value={price} onChange={e => setPrice(e.target.value)} required />
        <Input placeholder="地址" value={address} onChange={e => setAddress(e.target.value)} required />

        <TypeSelector
          mainType={mainType}
          subType={subType}
          setMainType={setMainType}
          setSubType={setSubType}
        />

        <RoomCountSelector
          label="卧室"
          value={bedrooms}
          onChange={setBedrooms}
        />
        <RoomCountSelector
          label="浴室"
          value={bathrooms}
          onChange={setBathrooms}
        />
        <RoomCountSelector
          label="车位"
          value={parking}
          onChange={setParking}
        />
        <RoomCountSelector
          label="储藏室"
          value={storeRoom}
          onChange={setStoreRoom}
        />

        <ImageUpload images={images} setImages={setImages} />

        <Button type="submit" disabled={uploading}>
          {uploading ? '上传中...' : '提交房源'}
        </Button>
      </form>
    </div>
  );
}
