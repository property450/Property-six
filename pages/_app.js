// pages/upload-property.js
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { supabase } from '@/supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import AddressSearchInput from '@/components/AddressSearchInput';
import ImageUploader from '@/components/ImageUploader';
import TypeSelector from '@/components/TypeSelector';
import NumberSelector from '@/components/NumberSelector';

const UploadProperty = () => {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [type, setType] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [carparks, setCarparks] = useState('');
  const [storerooms, setStorerooms] = useState('');
  const [images, setImages] = useState([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    console.log('🚀 上传按钮已点击');
    if (!title || !price || !address || !latitude || !longitude || images.length === 0) {
      toast.error('请填写完整信息并至少上传一张图片');
      return;
    }

    setLoading(true);

    try {
      const imageUrls = [];
      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        const fileExt = file.name.split('.').pop();
        const filePath = `property_${Date.now()}_${i}.${fileExt}`;
        const { data, error } = await supabase.storage
          .from('property-images')
          .upload(filePath, file);

        if (error) {
          throw error;
        }

        const url = supabase.storage.from('property-images').getPublicUrl(filePath).data.publicUrl;
        imageUrls.push(url);
      }

      const { data, error } = await supabase
        .from('properties')
        .insert([
          {
            title,
            price: Number(price),
            type,
            address,
            latitude,
            longitude,
            bedrooms: Number(bedrooms),
            bathrooms: Number(bathrooms),
            carparks: Number(carparks),
            storerooms: Number(storerooms),
            images: imageUrls,
            coverIndex,
          },
        ]);

      if (error) {
        throw error;
      }

      toast.success('房源上传成功！');
      router.push('/');
    } catch (err) {
      console.error(err);
      toast.error('上传失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">上传房源</h1>
      <Input placeholder="标题" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Input placeholder="价格 (RM)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />

      <TypeSelector selectedType={type} setSelectedType={setType} />

      <AddressSearchInput
        address={address}
        setAddress={setAddress}
        setLatitude={setLatitude}
        setLongitude={setLongitude}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <NumberSelector label="房间数" value={bedrooms} setValue={setBedrooms} />
        <NumberSelector label="浴室数" value={bathrooms} setValue={setBathrooms} />
        <NumberSelector label="车位数" value={carparks} setValue={setCarparks} />
        <NumberSelector label="储藏室" value={storerooms} setValue={setStorerooms} />
      </div>

      <ImageUploader
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

export default UploadProperty;
