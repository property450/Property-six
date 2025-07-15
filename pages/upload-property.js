// pages/upload-property.js
import { useUser } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import TypeSelector from '../components/TypeSelector';

export default function UploadProperty() {
  const user = useUser();
  const router = useRouter();

  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    type: '',
    bedrooms: '',
    bathrooms: '',
    carparks: '',
    storerooms: '',
  });

  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user === null) {
      router.push('/login');
    }
  }, [user]);

  if (!user) return <div className="p-4">请先登录...</div>;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    setImages([...e.target.files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    let uploadedUrls = [];
    if (images.length > 0) {
      for (const file of images) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const { data, error } = await supabase.storage
          .from('property-images')
          .upload(fileName, file);

        if (error) {
          alert('图片上传失败: ' + error.message);
          setUploading(false);
          return;
        } else {
          const url = supabase.storage
            .from('property-images')
            .getPublicUrl(fileName).data.publicUrl;
          uploadedUrls.push(url);
        }
      }
    }

    const { error: insertError } = await supabase.from('properties').insert({
      ...form,
      price: Number(form.price),
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
      carparks: Number(form.carparks),
      storerooms: Number(form.storerooms),
      image_urls: uploadedUrls,
      user_id: user.id,
      created_at: new Date().toISOString(),
    });

    if (insertError) {
      alert('上传失败：' + insertError.message);
      setUploading(false);
    } else {
      alert('上传成功');
      router.push('/');
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">上传房源</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="房产标题"
          className="border p-2 w-full"
          required
        />
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="描述"
          className="border p-2 w-full"
        />
        <input
          name="price"
          value={form.price}
          onChange={handleChange}
          placeholder="价格 (RM)"
          type="number"
          className="border p-2 w-full"
          required
        />
        <input
          name="location"
          value={form.location}
          onChange={handleChange}
          placeholder="地点"
          className="border p-2 w-full"
        />

        <TypeSelector value={form.type} onChange={(val) => setForm({ ...form, type: val })} />

        <div className="grid grid-cols-2 gap-4">
          <input
            name="bedrooms"
            value={form.bedrooms}
            onChange={handleChange}
            placeholder="房间数"
            type="number"
            className="border p-2"
          />
          <input
            name="bathrooms"
            value={form.bathrooms}
            onChange={handleChange}
            placeholder="浴室数"
            type="number"
            className="border p-2"
          />
          <input
            name="carparks"
            value={form.carparks}
            onChange={handleChange}
            placeholder="车位数"
            type="number"
            className="border p-2"
          />
          <input
            name="storerooms"
            value={form.storerooms}
            onChange={handleChange}
            placeholder="储藏室数"
            type="number"
            className="border p-2"
          />
        </div>

        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          className="w-full"
        />

        <button
          type="submit"
          disabled={uploading}
          className="bg-green-600 text-white px-4 py-2 rounded w-full"
        >
          {uploading ? '上传中...' : '提交房源'}
        </button>
      </form>
    </div>
  );
}
