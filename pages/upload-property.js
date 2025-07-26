// pages/upload-property.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import TypeSelector from '@/components/TypeSelector';
import PriceRangeSelector from '@/components/PriceRangeSelector';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

const AddressSearchInput = dynamic(() => import('@/components/AddressSearchInput'), { ssr: false });
const ImageUploader = dynamic(() => import('@/components/ImageUpload'), { ssr: false });

export default function UploadProperty() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [price, setPrice] = useState('');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000000);
  const [selectedType, setSelectedType] = useState('');
  const [bedrooms, setBedrooms] = useState(0);
  const [bathrooms, setBathrooms] = useState(0);
  const [carparks, setCarparks] = useState(0);
  const [storeRooms, setStoreRooms] = useState(0);
  const [images, setImages] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { data, error } = await supabase.from('properties').insert([
      {
        title,
        description,
        address,
        latitude,
        longitude,
        price,
        type: selectedType,
        bedrooms,
        bathrooms,
        carparks,
        storerooms: storeRooms,
        images
      },
    ]);

    if (error) {
      toast.error('上传失败');
    } else {
      toast.success('上传成功');
      router.push('/');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">上传房产</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input placeholder="标题" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input placeholder="描述" value={description} onChange={(e) => setDescription(e.target.value)} />

        <AddressSearchInput 
          address={address}
          setAddress={setAddress}
          setLatitude={setLatitude}
          setLongitude={setLongitude}
        />

        <Input type="number" placeholder="价格 (RM)" value={price} onChange={(e) => setPrice(e.target.value)} />

        <PriceRangeSelector min={minPrice} max={maxPrice} setMinPrice={setMinPrice} setMaxPrice={setMaxPrice} />

        <TypeSelector selectedType={selectedType} setSelectedType={setSelectedType} />

        <div className="grid grid-cols-2 gap-2">
          <Input type="number" placeholder="房间数" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} />
          <Input type="number" placeholder="卫生间数" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} />
          <Input type="number" placeholder="车位数" value={carparks} onChange={(e) => setCarparks(e.target.value)} />
          <Input type="number" placeholder="储藏室数" value={storeRooms} onChange={(e) => setStoreRooms(e.target.value)} />
        </div>

        <ImageUploader images={images} setImages={setImages} />

        <Button type="submit">上传房产</Button>
      </form>
    </div>
  );
}
