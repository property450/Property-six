import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { supabase } from '../supabaseClient';
import { toast } from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ImageUpload from '@/components/ImageUpload';
import TypeSelector from '@/components/TypeSelector';
import RoomSelector from '@/components/RoomCountSelector';
import { useUser } from '@supabase/auth-helpers-react';

const AddressSearchInput = dynamic(() => import('@/components/AddressSearchInput'), { ssr: false });

export default function UploadProperty() {
  const router = useRouter();
  const user = useUser();

  const [carparkPosition, setCarparkPosition] = useState('');
const [customCarparkPosition, setCustomCarparkPosition] = useState('');

  const handleCarparkPositionChange = (value) => {
  setCarparkPosition(value);
  if (value !== '其他（自定义）') {
    setCustomCarparkPosition('');
  }
};

  useEffect(() => {
    if (user === null) {
      router.push('/login');
    }
  }, [user]);

  if (user === null) {
    return <div>正在检查登录状态...</div>;
  }

  if (!user) {
    return null;
  }

  // ---------- 状态管理 ------------
  const [price, setPrice] = useState('');
const [selectedPrice, setSelectedPrice] = useState('');
  const [customFacing, setCustomFacing] = useState('');
  const [facing, setFacing] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [images, setImages] = useState([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [type, setType] = useState('');
  const [floor, setFloor] = useState('');
  const [builtYear, setBuiltYear] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [carpark, setCarpark] = useState('');
  const [store, setStore] = useState('');
  // 组件最上方加这个 state：
const [area, setArea] = useState('');
  const [isCustomArea, setIsCustomArea] = useState(false);
  const [amenities, setAmenities] = useState('');
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ 接收地址搜索返回的结果
  const handleLocationSelect = ({ lat, lng, address }) => {
    setLatitude(lat);
    setLongitude(lng);
    setAddress(address);
  };

  const handleSubmit = async () => {
    console.log('🚀 上传按钮已点击');

    if (!title || !price || !address || !latitude || !longitude || images.length === 0) {
      toast.error('请填写完整信息并至少上传一张图片');
      return;
    }

    setLoading(true);

    try {
      const { data: propertyData, error } = await supabase
        .from('properties')
        .insert([{
          title,
          description,
          price: Number(price),
          address,
          lat: latitude,
          lng: longitude,
          user_id: user.id,
          link,
          type,
          floor,
          built_year: builtYear,
          bedrooms,
          bathrooms,
          carpark,
          store,
          area,
          amenities,
          facing,
          carpark_position: carparkPosition === '其他（自定义）' ? customCarparkPosition : carparkPosition,
        }])
        .select()
        .single();

      if (error) throw error;

      const propertyId = propertyData.id;

      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const fileName = `${Date.now()}_${image.name}`;
        const filePath = `${propertyId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(filePath, image);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('property-images')
          .getPublicUrl(filePath);

        const imageUrl = publicUrlData.publicUrl;

        await supabase.from('property-images').insert([{
          property_id: propertyId,
          image_url: imageUrl,
          is_cover: i === coverIndex,
        }]);
      }

      toast.success('房源上传成功');
      router.push('/');
    } catch (err) {
      console.error(err);
      toast.error('上传失败，请检查控制台');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-4">上传房源</h1>

      <Input placeholder="标题" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Input placeholder="描述" value={description} onChange={(e) => setDescription(e.target.value)} />
      <Input placeholder="链接（可选）" value={link} onChange={(e) => setLink(e.target.value)} />

      <TypeSelector value={type} onChange={setType} />
      <RoomSelector label="卧室" value={bedrooms} onChange={setBedrooms} />
      <RoomSelector label="浴室" value={bathrooms} onChange={setBathrooms} />
      <RoomSelector label="停车位" value={carpark} onChange={setCarpark} />
      <RoomSelector label="储藏室" value={store} onChange={setStore} />

  <div className="space-y-2">
  <label className="block text-sm font-medium text-gray-700">价格</label>

  <select
    value={selectedPrice}
    onChange={(e) => {
      const value = e.target.value;
      setSelectedPrice(value);
      if (value !== "自定义") {
        setPrice(value); // 设置实际价格
      }
    }}
    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
  >
    <option value="">请选择价格</option>
    {[100000, 200000, 300000, 400000, 500000, 800000, 1000000].map((price) => (
      <option key={price} value={price}>{price.toLocaleString()}</option>
    ))}
    <option value="自定义">自定义</option>
  </select>

  {selectedPrice === "自定义" && (
    <input
      type="number"
      placeholder="请输入自定义价格"
      value={price}
      onChange={(e) => setPrice(e.target.value)}
      className="block w-full mt-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
    />
  )}
</div>

  {facing === '其他' && (
  <input
    type="text"
    className="mt-2 block w-full border border-gray-300 rounded-md shadow-sm p-2"
    placeholder="请输入其他朝向"
    value={customFacing}
    onChange={(e) => setCustomFacing(e.target.value)}
  />
)}

  <div className="space-y-4">
  <label className="block text-sm font-medium text-gray-700">朝向</label>
  <select
    value={facing}
    onChange={(e) => setFacing(e.target.value)}
    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
  >
    <option value="">请选择朝向</option>
    <option value="东">东</option>
    <option value="南">南</option>
    <option value="西">西</option>
    <option value="北">北</option>
    <option value="东南">东南</option>
    <option value="东北">东北</option>
    <option value="西南">西南</option>
    <option value="西北">西北</option>
    <option value="其他">其他</option>
  </select>
</div>

  <div className="space-y-4">
  <label className="block text-sm font-medium text-gray-700">车位位置</label>
  <select
    value={carparkPosition}
    onChange={(e) => handleCarparkPositionChange(e.target.value)}
    className="w-full border border-gray-300 rounded px-3 py-2"
  >
    {[
      ...Array.from({ length: 10 }, (_, i) => `Basement ${10 - i}`).flatMap(item =>
        item.includes('4') ? [item, 'Basement 3A'] : [item]
      ),
      ...Array.from({ length: 3 }, (_, i) => `LG${3 - i}`),
      'G',
      'UG',
      ...Array.from({ length: 3 }, (_, i) => `M${i + 1}`),
      ...Array.from({ length: 15 }, (_, i) => `Level ${i + 1}`).flatMap(item =>
        item.includes('4') ? [item, 'Level 13A'] : [item]
      ),
      '其他（自定义）',
    ].map((option) => (
      <option key={option} value={option}>
        {option}
      </option>
    ))}
  </select>

  {carparkPosition === '其他（自定义）' && (
    <input
      type="text"
      placeholder="请输入自定义车位位置"
      value={customCarparkPosition}
      onChange={(e) => setCustomCarparkPosition(e.target.value)}
      className="w-full border border-gray-300 rounded px-3 py-2"
    />
  )}
</div>

     {/* 面积 */}
<div className="space-y-2">
  <label htmlFor="size" className="block text-sm font-medium text-gray-700">面积 (sf)</label>
  <input
    list="size-options"
    id="size"
    name="size"
    value={area}
    onChange={(e) => {
      const input = e.target.value;
      if (input.endsWith('sf')) {
        setArea(input);
      } else {
        setArea(input + 'sf');
      }
    }}
    placeholder="请输入或选择面积"
    className="w-full border border-gray-300 rounded px-3 py-2"
  />
  <datalist id="size-options">
    {Array.from({ length: 149 }, (_, i) => 200 + i * 200).map((value) => (
      <option key={value} value={`${value}sf`} />
    ))}
  </datalist>
</div>


onChange={(e) => {
  const input = e.target.value;
  if (input.endsWith('sf')) {
    setSize(input);
  } else {
    setSize(input + 'sf');
  }
}}

{/* 建成年份 */}
<div className="space-y-1">
  <label className="text-sm font-medium">建成年份</label>
  <select
    value={builtYear}
    onChange={(e) => setBuiltYear(e.target.value)}
    className="w-full border rounded px-3 py-2"
  >
    <option value="">请选择年份</option>
    {Array.from({ length: 70 }, (_, i) => {
      const year = new Date().getFullYear() - i;
      return (
        <option key={year} value={year}>
          {year}
        </option>
      );
    })}
  </select>
</div>

      <Input placeholder="设施/配套（如泳池、电梯等）" value={amenities} onChange={(e) => setAmenities(e.target.value)} />

      {/* ✅ 使用新版本 AddressSearchInput */}
      <AddressSearchInput onLocationSelect={handleLocationSelect} />

      <ImageUpload images={images} setImages={setImages} coverIndex={coverIndex} setCoverIndex={setCoverIndex} />

      <Button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-blue-600 text-white p-3 rounded hover:bg-blue-700 w-full"
      >
        {loading ? '上传中...' : '提交房源'}
      </Button>
    </div>
  );
}
