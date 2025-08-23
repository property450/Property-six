// pages/upload-property.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { supabase } from '../supabaseClient';
import { toast } from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ImageUpload from '@/components/ImageUpload';
import TypeSelector from '@/components/TypeSelector';
import RoomCountSelector from '@/components/RoomCountSelector';
import { useUser } from '@supabase/auth-helpers-react';
import AreaSelector from '@/components/AreaSelector';
import CarparkLevelSelector from '@/components/CarparkLevelSelector';
import FacingSelector from '@/components/FacingSelector';
import PriceInput from '@/components/PriceInput';
import FacilitiesSelector from "@/components/FacilitiesSelector";
import BuildYearSelector from '@/components/BuildYearSelector';
import ExtraSpacesSelector from "@/components/ExtraSpacesSelector";
import CarparkCountSelector from "@/components/CarparkCountSelector";
import FurnitureSelector from "@/components/FurnitureSelector";
import FloorPlanSelector from "@/components/FloorPlanSelector";

const AddressSearchInput = dynamic(() => import('@/components/AddressSearchInput'), { ssr: false });

export default function UploadProperty() {
  const router = useRouter();
  const user = useUser();

  // areaData 与 AreaSelector 的 onChange 返回结构一致：
  const [areaData, setAreaData] = useState({
    types: ['buildUp'],
    units: { buildUp: 'square feet', land: 'square feet' },
    values: { buildUp: '', land: '' },
  });

  const [sizeInSqft, setSizeInSqft] = useState('');
  const [pricePerSqFt, setPricePerSqFt] = useState('');

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
  }, [user, router]);

  if (user === null) return <div>正在检查登录状态...</div>;
  if (!user) return null;

  // ---------- 表单状态 ----------
  const [price, setPrice] = useState('');
  const [customFacing, setCustomFacing] = useState('');
  const [facing, setFacing] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [images, setImages] = useState({});
  const [coverIndex, setCoverIndex] = useState(0);
  const [type, setType] = useState('');
  const [floor, setFloor] = useState('');
  const [buildYear, setBuildYear] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [kitchens, setKitchens] = useState('');
  const [livingRooms, setLivingRooms] = useState('');
  const [carpark, setCarpark] = useState("");
  const [store, setStore] = useState('');
  const [facilities, setFacilities] = useState([]);
  const [furniture, setFurniture] = useState([]);
  const [floorPlans, setFloorPlans] = useState([]);
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 70 + 5 + 1 }, (_, i) => currentYear + 5 - i);
  const [useCustomYear, setUseCustomYear] = useState(false);
  const [customBuildYear, setCustomBuildYear] = useState('');
  const [extraSpaces, setExtraSpaces] = useState([]);
  const [rooms, setRooms] = useState({
    bedrooms: '',
    bathrooms: '',
    kitchens: '',
    livingRooms: ''
  });

  // ---------- 🚀 新增: 根据 type 切换模式 ----------
  const mode =
    type === "New Project / Under Construction" ||
    type === "Completed Unit / Developer Unit"
      ? "range"
      : "single";

  // ---------- config ----------
  const config = {
    bedrooms: rooms.bedrooms,
    bathrooms: Number(rooms.bathrooms) || 0,
    kitchens: Number(rooms.kitchens) || 0,
    livingRooms: Number(rooms.livingRooms) || 0,
    carpark: Number(carpark) || 0,
    storage: Number(store) || 0,
    orientation: !!facing,
    facilities: facilities || [],
    extraSpaces: extraSpaces || [],
    furniture: furniture || [],
    floorPlans: Number(floorPlans) || 0,
  };

  // 单位转换
  const convertToSqft = (val, unit) => {
    const num = parseFloat(String(val || '').replace(/,/g, ''));
    if (isNaN(num) || num <= 0) return 0;
    switch (unit) {
      case 'square meter':
      case 'square metres':
      case 'sq m':
        return num * 10.7639;
      case 'acres':
        return num * 43560;
      case 'hectares':
        return num * 107639;
      default:
        return num;
    }
  };

  // 处理面积
  const handleAreaChange = (data) => {
    setAreaData(data);
    const buildUpSq = convertToSqft(data.values?.buildUp ?? '', data.units?.buildUp ?? 'square feet');
    const landSq = convertToSqft(data.values?.land ?? '', data.units?.land ?? 'square feet');
    const total = (buildUpSq || 0) + (landSq || 0);
    setSizeInSqft(total > 0 ? total : '');
  };

  // 自动计算每平方英尺
  useEffect(() => {
    if (mode === "single") {
      const p = Number(String(price || '').replace(/,/g, '')) || 0;
      const s = Number(sizeInSqft) || 0;
      if (p > 0 && s > 0) {
        setPricePerSqFt((p / s).toFixed(2));
      } else {
        setPricePerSqFt('');
      }
    } else {
      setPricePerSqFt('');
    }
  }, [price, sizeInSqft, mode]);

  const handleSubmit = async () => {
    if (!title || !price || !address || !latitude || !longitude || images.length === 0) {
      toast.error('请填写完整信息并至少上传一张图片');
      return;
    }

    const computedPricePerSqFt = pricePerSqFt ? Number(pricePerSqFt) : null;

    setLoading(true);
    try {
      const { data: propertyData, error } = await supabase
        .from('properties')
        .insert([{
          title,
          description,
          // 🚀 如果是 range，就存成 "min-max"
          price: mode === "range"
            ? `${price.min || ""}-${price.max || ""}`
            : Number(String(price).replace(/,/g, '')),
          price_per_sq_ft: computedPricePerSqFt,
          address,
          lat: latitude,
          lng: longitude,
          user_id: user.id,
          link,
          type,
          floor,
          built_year: useCustomYear ? customBuildYear : buildYear,
          bedrooms,
          bathrooms,
          carpark: mode === "range"
            ? `${carpark.min || ""}-${carpark.max || ""}`
            : carpark,
          store,
          area: JSON.stringify(areaData),
          amenities: facilities,
          facing: facing === '其他' ? customFacing : facing,
          carpark_position: mode === "range"
            ? `${carparkPosition.min || ""}-${carparkPosition.max || ""}`
            : (carparkPosition === '其他（自定义）' ? customCarparkPosition : carparkPosition),
        }])
        .select()
        .single();

      if (error) throw error;
      const propertyId = propertyData.id;

      // 上传图片
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

      <AddressSearchInput onLocationSelect={({ lat, lng, address }) => {
        setLatitude(lat);
        setLongitude(lng);
        setAddress(address);
      }} />

      <TypeSelector value={type} onChange={setType} />
      <AreaSelector onChange={handleAreaChange} initialValue={areaData} />

      {/* 🚀 PriceInput: 自动切换模式 */}
      <PriceInput value={price} onChange={setPrice} area={sizeInSqft} mode={mode} />

      <RoomCountSelector value={rooms} onChange={setRooms} />
      <CarparkCountSelector value={carpark} onChange={setCarpark} mode={mode} />
      <ExtraSpacesSelector value={extraSpaces} onChange={setExtraSpaces} />

      <FacingSelector
        value={facing}
        onChange={setFacing}
        customValue={customFacing}
        onCustomChange={setCustomFacing}
      />

      <CarparkLevelSelector
        value={carparkPosition}
        onChange={handleCarparkPositionChange}
        customValue={customCarparkPosition}
        setCustomValue={setCustomCarparkPosition}
        mode={mode}
      />

      <FacilitiesSelector value={facilities} onChange={setFacilities} />
      <FurnitureSelector value={furniture} onChange={setFurniture} />
      <FloorPlanSelector value={floorPlans} onChange={setFloorPlans} />
      <BuildYearSelector value={buildYear} onChange={setBuildYear} />

      <Input
        placeholder="描述"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <ImageUpload config={config} images={images} setImages={setImages} />

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
