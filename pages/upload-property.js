// pages/upload-property.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../supabaseClient';
import ImageUpload from '@/components/ImageUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import TypeSelector from '@/components/TypeSelector';

export default function UploadProperty() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [images, setImages] = useState([]);
  const [selectedType, setSelectedType] = useState(''); // ✅ 新增类型选择状态

  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    type: '',
    location: '',
    latitude: '',
    longitude: '',
  });

  // 将 selectedType 写入 form.type 中 ✅
  useEffect(() => {
    setForm((prev) => ({ ...prev, type: selectedType }));
  }, [selectedType]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert('请先登录');

    const { data, error } = await supabase.from('properties').insert([{
      ...form,
      user_id: user.id,
      images: images.map(img => img.url),
      cover_image: images.find(img => img.isCover)?.url || images[0]?.url || '',
    }]);

    if (error) {
      console.error('上传失败:', error);
      return;
    }

    router.push('/');
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">上传房源</h1>
      <form onSubmit={handleSubmit} className="space-y-4">

        <Input
          name="title"
          placeholder="标题"
          value={form.title}
          onChange={handleChange}
        />

        <Input
          name="price"
          type="number"
          placeholder="价格"
          value={form.price}
          onChange={handleChange}
        />

        <Input
          name="location"
          placeholder="地址"
          value={form.location}
          onChange={handleChange}
        />

        <div className="grid grid-cols-2 gap-2">
          <Input
            name="latitude"
            type="number"
            placeholder="纬度 (latitude)"
            value={form.latitude}
            onChange={handleChange}
          />
          <Input
            name="longitude"
            type="number"
            placeholder="经度 (longitude)"
            value={form.longitude}
            onChange={handleChange}
          />
        </div>

        {/* ✅ 类型选择器 */}
        <div>
          <label className="block text-sm font-medium mb-1">类型</label>
          <TypeSelector
            selectedType={selectedType}
            setSelectedType={setSelectedType}
          />
        </div>

        <textarea
          name="description"
          placeholder="描述"
          value={form.description}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />

        {/* ✅ 图片上传组件 */}
        <ImageUpload images={images} setImages={setImages} />

        <Button type="submit" className="w-full mt-4">发布房源</Button>
      </form>
    </div>
  );
}
