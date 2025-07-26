import { useState } from 'react';
import { supabase } from '../supabaseClient';
import dynamic from 'next/dynamic';
import PriceRangeSelector from '@/components/PriceRangeSelector';
import TypeSelector from '@/components/TypeSelector';

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

export default function UploadProperty() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);
  const [type, setType] = useState('');
  const [subtype, setSubtype] = useState('');
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { data, error } = await supabase.from('properties').insert([
      {
        title,
        description,
        price,
        type,
        subtype,
        lat,
        lng,
      },
    ]);

    if (error) {
      console.error('上传失败:', error.message);
    } else {
      alert('房源上传成功');
      setTitle('');
      setDescription('');
      setPrice(0);
      setLat(null);
      setLng(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">上传房源</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="标题"
          className="w-full p-2 border rounded"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="描述"
          className="w-full p-2 border rounded"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          type="number"
          placeholder="价格"
          className="w-full p-2 border rounded"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
        />

        {/* Price Range Selector */}
        <PriceRangeSelector
          min={minPrice}
          max={maxPrice}
          setMinPrice={setMinPrice}
          setMaxPrice={setMaxPrice}
        />

        {/* Type Selector */}
        <TypeSelector
          selectedType={type}
          setSelectedType={setType}
          selectedSubtype={subtype}
          setSelectedSubtype={setSubtype}
        />

        {/* Map Picker */}
        <MapPicker setLat={setLat} setLng={setLng} />

        <button type="submit" className="bg-blue-600 text-white p-2 rounded">
          提交房源
        </button>
      </form>
    </div>
  );
}
