import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { useRouter } from 'next/router';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import PriceRangeSelector from '@/components/PriceRangeSelector';
import TypeSelector from '@/components/TypeSelector';
import MapPicker from '@/components/MapPicker';
import { toast } from 'sonner';

export default function UploadProperty() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  const [mainType, setMainType] = useState('');
  const [subType, setSubType] = useState('');
  const [customSubType, setCustomSubType] = useState('');
  const [selectedType, setSelectedType] = useState('');

  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const [bedroom, setBedroom] = useState('');
  const [bathroom, setBathroom] = useState('');
  const [carpark, setCarpark] = useState('');
  const [store, setStore] = useState('');

  // 🧠 自动地理编码（输入地址后获取经纬度）
  useEffect(() => {
    const fetchCoordinates = async () => {
      if (address.length > 5) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
          const data = await res.json();
          if (data && data[0]) {
            setLatitude(parseFloat(data[0].lat));
            setLongitude(parseFloat(data[0].lon));
          }
        } catch (err) {
          console.error('Geocode Error:', err);
        }
      }
    };
    fetchCoordinates();
  }, [address]);

  // 🧠 自动组合最终类型
  useEffect(() => {
    if (mainType && (subType || customSubType)) {
      setSelectedType(`${mainType} > ${customSubType || subType}`);
    }
  }, [mainType, subType, customSubType]);

  // ✅ 提交表单
  const handleSubmit = async () => {
    if (!title || !address || !latitude || !longitude || !selectedType) {
      toast.error('请填写所有必填项');
      return;
    }

    const { error } = await supabase.from('properties').insert([{
      title,
      address,
      latitude,
      longitude,
      type: selectedType,
      min_price: minPrice,
      max_price: maxPrice,
      bedroom,
      bathroom,
      carpark,
      store,
    }]);

    if (error) {
      toast.error('上传失败，请重试');
    } else {
      toast.success('上传成功！');
      router.push('/');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-4">上传房产</h1>

      <Input placeholder="标题" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Input placeholder="地址" value={address} onChange={(e) => setAddress(e.target.value)} />

      <div>
        <TypeSelector
          mainType={mainType}
          subType={subType}
          customSubType={customSubType}
          setMainType={setMainType}
          setSubType={setSubType}
          setCustomSubType={setCustomSubType}
        />
      </div>

      <div>
        <PriceRangeSelector
          min={minPrice}
          max={maxPrice}
          setMinPrice={setMinPrice}
          setMaxPrice={setMaxPrice}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">房间</label>
          <Input type="number" value={bedroom} onChange={(e) => setBedroom(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium">卫生间</label>
          <Input type="number" value={bathroom} onChange={(e) => setBathroom(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium">车位</label>
          <Input type="number" value={carpark} onChange={(e) => setCarpark(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium">储藏室</label>
          <Input type="number" value={store} onChange={(e) => setStore(e.target.value)} />
        </div>
      </div>

      <MapPicker
        latitude={latitude}
        longitude={longitude}
        setLatitude={setLatitude}
        setLongitude={setLongitude}
      />

      <Button className="mt-4" onClick={handleSubmit}>
        提交房产
      </Button>
    </div>
  );
}
