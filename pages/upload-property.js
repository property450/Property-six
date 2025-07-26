// pages/upload-property.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import TypeSelector from '@/components/TypeSelector';
import ImageUploader from '@/components/ImageUpload';
import MapSelector from '@/components/MapSelector';
import NumberInputSelector from '@/components/NumberInputSelector';
import { useUser } from '@supabase/auth-helpers-react';

export default function UploadPropertyPage() {
  const user = useUser();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [selectedType, setSelectedType] = useState({ main: '', sub: '' });

  const [bathroomCount, setBathroomCount] = useState(0);
  const [bedroomCount, setBedroomCount] = useState(0);
  const [carParkCount, setCarParkCount] = useState(0);
  const [storeCount, setStoreCount] = useState(0);

  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);

  const [images, setImages] = useState([]); // 多图列表
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    // 简单验证
    if (
      !title ||
      !description ||
      !price ||
      !selectedType.main ||
      lat === null ||
      lng === null ||
      images.length === 0
    ) {
      alert('请完整填写所有资料和上传至少一张图片');
      return;
    }

    setUploading(true);

    // 插入房产数据
    const { data, error } = await supabase
      .from('properties')
      .insert([
        {
          title,
          description,
          price: parseFloat(price),
          type: selectedType.main,
          subtype: selectedType.sub,
          bedrooms: bedroomCount,
          bathrooms: bathroomCount,
          parking: carParkCount,
          store: storeCount,
          latitude: lat,
          longitude: lng,
          user_id: user?.id,
          created_at: new Date(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('上传失败:', error.message);
      alert('上传失败，请重试');
      setUploading(false);
      return;
    }

    const propertyId = data.id;

    // 上传每张图片到 bucket 并插入路径
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const fileExt = image.name.split('.').pop();
      const filePath = `${propertyId}/${Date.now()}-${i}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(filePath, image);

      if (uploadError) {
        console.error('图片上传失败:', uploadError.message);
        continue;
      }

      // 插入图片路径到 images table
      await supabase.from('property_images').insert([
        {
          property_id: propertyId,
          image_path: filePath,
          is_cover: i === 0, // 第一张为封面图
        },
      ]);
    }

    alert('上传成功！');
    router.push('/');
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">上传房源</h1>

      <Input
        type="text"
        placeholder="房源标题"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="mb-3"
      />

      <textarea
        placeholder="房源描述"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full border p-2 mb-3 rounded"
        rows={4}
      />

      <Input
        type="number"
        placeholder="价格 (RM)"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="mb-3"
      />

      <TypeSelector selected={selectedType} setSelected={setSelectedType} />

      <div className="grid grid-cols-2 gap-4 my-4">
        <NumberInputSelector label="房间数" value={bedroomCount} setValue={setBedroomCount} />
        <NumberInputSelector label="浴室数" value={bathroomCount} setValue={setBathroomCount} />
        <NumberInputSelector label="停车位" value={carParkCount} setValue={setCarParkCount} />
        <NumberInputSelector label="储藏室" value={storeCount} setValue={setStoreCount} />
      </div>

      <MapSelector lat={lat} lng={lng} setLat={setLat} setLng={setLng} />

      <ImageUploader images={images} setImages={setImages} />

      <Button className="mt-4 w-full" onClick={handleUpload} disabled={uploading}>
        {uploading ? '上传中...' : '上传房源'}
      </Button>
    </div>
  );
}
