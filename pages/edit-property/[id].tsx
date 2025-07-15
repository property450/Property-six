// pages/edit-property/[id].js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useUser } from '@supabase/auth-helpers-react';

export default function EditPropertyPage() {
  const router = useRouter();
  const { id } = router.query;
  const user = useUser();

  const [property, setProperty] = useState(null);

  useEffect(() => {
    if (id) {
      fetchProperty();
    }
  }, [id]);

  async function fetchProperty() {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching property:', error);
    } else {
      setProperty(data);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const { error } = await supabase
      .from('properties')
      .update(property)
      .eq('id', id);

    if (error) {
      alert('更新失败');
      console.error(error);
    } else {
      router.push(`/property/${id}`);
    }
  }

  function handleChange(e) {
    setProperty({ ...property, [e.target.name]: e.target.value });
  }

  if (!property) return <div>加载中...</div>;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4">编辑房产信息</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="title"
          value={property.title || ''}
          onChange={handleChange}
          placeholder="房产标题"
          className="border p-2 w-full"
        />
        <textarea
          name="description"
          value={property.description || ''}
          onChange={handleChange}
          placeholder="描述"
          className="border p-2 w-full"
        />
        <input
          type="number"
          name="price"
          value={property.price || ''}
          onChange={handleChange}
          placeholder="价格"
          className="border p-2 w-full"
        />
        <input
          type="number"
          name="bedrooms"
          value={property.bedrooms || ''}
          onChange={handleChange}
          placeholder="房间数量"
          className="border p-2 w-full"
        />
        <input
          type="number"
          name="bathrooms"
          value={property.bathrooms || ''}
          onChange={handleChange}
          placeholder="浴室数量"
          className="border p-2 w-full"
        />
        <input
          type="text"
          name="location"
          value={property.location || ''}
          onChange={handleChange}
          placeholder="地点"
          className="border p-2 w-full"
        />
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          保存修改
        </button>
      </form>
    </div>
  );
}
