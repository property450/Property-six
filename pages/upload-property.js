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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
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
  const [area, setArea] = useState('');
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
      <Input placeholder="价格（RM）" value={price} onChange={(e) => setPrice(e.target.value)} />
      <Input placeholder="链接（可选）" value={link} onChange={(e) => setLink(e.target.value)} />

      <TypeSelector value={type} onChange={setType} />
      <RoomSelector label="卧室" value={bedrooms} onChange={setBedrooms} />
      <RoomSelector label="浴室" value={bathrooms} onChange={setBathrooms} />
      <RoomSelector label="停车位" value={carpark} onChange={setCarpark} />
      <RoomSelector label="储藏室" value={store} onChange={setStore} />

  <div className="space-y-4">
  <Label>车位位置</Label>
  <Select onValueChange={handleCarparkPositionChange}>
    <SelectTrigger>
      <SelectValue placeholder="选择车位位置" />
    </SelectTrigger>
    <SelectContent>
      {[
        'Basement',
        'LG Level',
        'G Level',
        ...Array.from({ length: 15 }, (_, i) => `Level ${i + 1}`),
        '其他（自定义）',
      ].map((option) => (
        <SelectItem key={option} value={option}>
          {option}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>

  {carparkPosition === '其他（自定义）' && (
    <Input
      placeholder="请输入自定义车位位置"
      value={customCarparkPosition}
      onChange={(e) => setCustomCarparkPosition(e.target.value)}
    />
  )}
</div>

      {/* 面积 */}
<div className="space-y-1">
  <label className="text-sm font-medium">面积 (平方尺)</label>
  <select
    value={area}
    onChange={(e) => setArea(e.target.value)}
    className="w-full border rounded px-3 py-2"
  >
    <option value="">请选择面积</option>
    {Array.from({ length: 20 }, (_, i) => {
      const sqft = (i + 5) * 100;
      return (
        <option key={sqft} value={sqft}>
          {sqft} 平方尺
        </option>
      );
    })}
  </select>
</div>

{/* 楼层 */}
<div className="space-y-1">
  <label className="text-sm font-medium">楼层</label>
  <select
    value={floor}
    onChange={(e) => setFloor(e.target.value)}
    className="w-full border rounded px-3 py-2"
  >
    <option value="">请选择楼层</option>
    {Array.from({ length: 51 }, (_, i) => (
      <option key={i} value={i}>
        {i === 0 ? '底楼' : `${i} 楼`}
      </option>
    ))}
  </select>
</div>

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
