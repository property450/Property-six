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

  // ---------- mode 判断 ----------
  const [type, setType] = useState('');
  const mode =
    type === "New Project / Under Construction" ||
    type === "Completed Unit / Developer Unit"
      ? "range"
      : "single";

  // ---------- 你的 state 保留 ----------
  const [areaData, setAreaData] = useState({
    types: ['buildUp'],
    units: { buildUp: 'square feet', land: 'square feet' },
    values: { buildUp: '', land: '' },
  });
  const [sizeInSqft, setSizeInSqft] = useState('');
  const [price, setPrice] = useState('');
  const [carpark, setCarpark] = useState('');
  const [carparkPosition, setCarparkPosition] = useState('');
  const [customCarparkPosition, setCustomCarparkPosition] = useState('');
  const [facing, setFacing] = useState('');
  const [customFacing, setCustomFacing] = useState('');
  const [rooms, setRooms] = useState({ bedrooms: '', bathrooms: '', kitchens: '', livingRooms: '' });
  const [extraSpaces, setExtraSpaces] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [furniture, setFurniture] = useState([]);
  const [floorPlans, setFloorPlans] = useState([]);
  const [buildYear, setBuildYear] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [images, setImages] = useState([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleCarparkPositionChange = (value) => {
    setCarparkPosition(value);
    if (value !== '其他（自定义）') {
      setCustomCarparkPosition('');
    }
  };

  const handleLocationSelect = ({ lat, lng, address }) => {
    setLatitude(lat);
    setLongitude(lng);
    setAddress(address);
  };

  // ✅ 如果切换类型，保证数据格式正确
  useEffect(() => {
    if (mode === "range") {
      if (typeof price !== "object") setPrice({ min: "", max: "" });
      if (typeof carpark !== "object") setCarpark({ min: "", max: "" });
      if (typeof carparkPosition !== "object")
        setCarparkPosition({ min: "", max: "" });
    } else {
      if (typeof price === "object") setPrice("");
      if (typeof carpark === "object") setCarpark("");
      if (typeof carparkPosition === "object") setCarparkPosition("");
    }
  }, [mode]);

  // 🚀 你的 handleSubmit 等逻辑保持不变，这里略（和之前一样）

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-4">上传房源</h1>

      <AddressSearchInput onLocationSelect={handleLocationSelect} />
      <TypeSelector value={type} onChange={setType} />
      <AreaSelector onChange={setAreaData} initialValue={areaData} />

      {/* ✅ 价格 - 支持 single / range */}
      <PriceInput value={price} onChange={setPrice} area={sizeInSqft} mode={mode} />

      <RoomCountSelector value={rooms} onChange={setRooms} />
      {/* ✅ 车位数量 - 支持 single / range */}
      <CarparkCountSelector value={carpark} onChange={setCarpark} mode={mode} />
      <ExtraSpacesSelector value={extraSpaces} onChange={setExtraSpaces} />
      <FacingSelector
        value={facing}
        onChange={setFacing}
        customValue={customFacing}
        onCustomChange={setCustomFacing}
      />
      {/* ✅ 车位位置 - 支持 single / range */}
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

      <ImageUpload images={images} setImages={setImages} />

      <Button
        onClick={() => handleSubmit()}
        disabled={loading}
        className="bg-blue-600 text-white p-3 rounded hover:bg-blue-700 w-full"
      >
        {loading ? '上传中...' : '提交房源'}
      </Button>
    </div>
  );
}
