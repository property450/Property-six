//pages/upload-property.js
"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { supabase } from '../supabaseClient';
import { toast } from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import TypeSelector from '@/components/TypeSelector';
import UnitTypeSelector from '@/components/UnitTypeSelector';
import UnitLayoutForm from '@/components/UnitLayoutForm';
import AreaSelector from '@/components/AreaSelector';
import PriceInput from '@/components/PriceInput';
import RoomCountSelector from '@/components/RoomCountSelector';
import CarparkCountSelector from '@/components/CarparkCountSelector';
import ExtraSpacesSelector from '@/components/ExtraSpacesSelector';
import FacingSelector from '@/components/FacingSelector';
import CarparkLevelSelector from '@/components/CarparkLevelSelector';
import FacilitiesSelector from '@/components/FacilitiesSelector';
import FurnitureSelector from '@/components/FurnitureSelector';
import BuildYearSelector from '@/components/BuildYearSelector';
import ImageUpload from '@/components/ImageUpload';

import { useUser } from '@supabase/auth-helpers-react';

const AddressSearchInput = dynamic(
  () => import('@/components/AddressSearchInput'),
  { ssr: false }
);

export default function UploadProperty() {
  const router = useRouter();
  const user = useUser();

  useEffect(() => {
    if (user === null) router.push('/login');
  }, [user, router]);

  if (!user) return <div>正在检查登录状态...</div>;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [type, setType] = useState('');
  const [propertyStatus, setPropertyStatus] = useState('');
  const [unitLayouts, setUnitLayouts] = useState([]);
  const [singleFormData, setSingleFormData] = useState({
    buildUp: '',
    price: '',
    rooms: 0,
    bathrooms: 0,
    kitchens: 0,
    livingRooms: 0,
    carpark: 0,
    store: 0,
    facilities: [],
    furniture: [],
    extraSpaces: [],
    facing: '',
    photos: {},
    floorPlans: 0,
    buildYear: '',
    quarter: ''
  });
  const [areaData, setAreaData] = useState({
    types: ['buildUp'],
    units: { buildUp: 'square feet', land: 'square feet' },
    values: { buildUp: '', land: '' },
  });
  const [sizeInSqft, setSizeInSqft] = useState('');
  const [pricePerSqFt, setPricePerSqFt] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleLocationSelect = ({ lat, lng, address }) => {
    setLatitude(lat);
    setLongitude(lng);
    setAddress(address);
  };

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
  const handleAreaChange = (data) => {
    setAreaData(data);
    const buildUpSq = convertToSqft(data.values.buildUp, data.units.buildUp);
    const landSq = convertToSqft(data.values.land, data.units.land);
    setSizeInSqft(buildUpSq + landSq);
  };

  useEffect(() => {
    const p = Number(String(singleFormData.price || '').replace(/,/g, '')) || 0;
    if (p > 0 && sizeInSqft > 0) {
      setPricePerSqFt((p / sizeInSqft).toFixed(2));
    } else {
      setPricePerSqFt('');
    }
  }, [singleFormData.price, sizeInSqft]);

  const handleSubmit = async () => {
    if (!title || !address || !latitude || !longitude) {
      toast.error('请填写完整信息');
      return;
    }

    setLoading(true);
    try {
      const { data: propertyData, error } = await supabase.from('properties')
        .insert([{
          title,
          description,
          unit_layouts: JSON.stringify(unitLayouts.length > 0 ? unitLayouts : [singleFormData]),
          price: singleFormData.price || undefined,
          price_per_sq_ft: pricePerSqFt,
          address,
          lat: latitude,
          lng: longitude,
          user_id: user.id,
          type,
          build_year: singleFormData.buildYear,
          bedrooms: singleFormData.rooms,
          bathrooms: singleFormData.bathrooms,
          carpark: singleFormData.carpark,
          store: singleFormData.store,
          area: JSON.stringify(areaData),
          facilities: singleFormData.facilities,
          furniture: singleFormData.furniture,
          facing: singleFormData.facing,
        }])
        .select()
        .single();
      if (error) throw error;

      const propertyId = propertyData.id;

      const uploadImages = unitLayouts.length > 0
        ? unitLayouts.flatMap(u => Object.values(u.photos).flat())
        : images;

      for (let i = 0; i < uploadImages.length; i++) {
        const img = uploadImages[i];
        const fileName = `${Date.now()}_${img.file?.name || i}`;
        const filePath = `${propertyId}/${fileName}`;
        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(filePath, img.file);
        if (uploadError) throw uploadError;
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

      <AddressSearchInput onLocationSelect={handleLocationSelect} />

      <TypeSelector
        value={type}
        onChange={setType}
        onFormChange={(formData) => setPropertyStatus(formData.propertyStatus)}
      />
      <UnitTypeSelector
        propertyStatus={propertyStatus}
        onChange={(layouts) => setUnitLayouts(layouts)}
      />

      {unitLayouts.length > 0 ? (
        <div className="space-y-4 mt-6">
          {unitLayouts.map((layout, index) => (
            <UnitLayoutForm
              key={index}
              index={index}
              data={layout}
              onChange={(updated) => {
                const newLayouts = [...unitLayouts];
                newLayouts[index] = updated;
                setUnitLayouts(newLayouts);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4 mt-6">
          <AreaSelector onChange={handleAreaChange} initialValue={areaData} />
          <PriceInput
            value={singleFormData.price}
            onChange={(val) => setSingleFormData({ ...singleFormData, price: val })}
          />

          {/* 单输入框 RoomCountSelector */}
          <RoomCountSelector
            label="卧室"
            value={singleFormData.rooms}
            onChange={(val) => setSingleFormData({ ...singleFormData, rooms: val })}
            singleInput={true}
          />
          <RoomCountSelector
            label="浴室"
            value={singleFormData.bathrooms}
            onChange={(val) => setSingleFormData({ ...singleFormData, bathrooms: val })}
            singleInput={true}
          />
          <RoomCountSelector
            label="厨房"
            value={singleFormData.kitchens}
            onChange={(val) => setSingleFormData({ ...singleFormData, kitchens: val })}
            singleInput={true}
          />
          <RoomCountSelector
            label="客厅"
            value={singleFormData.livingRooms}
            onChange={(val) => setSingleFormData({ ...singleFormData, livingRooms: val })}
            singleInput={true}
          />

          <CarparkCountSelector
            value={singleFormData.carpark}
            onChange={(val) => setSingleFormData({ ...singleFormData, carpark: val })}
            mode="range"
          />

          <ExtraSpacesSelector
            value={singleFormData.extraSpaces || []}
            onChange={(val) => setSingleFormData({ ...singleFormData, extraSpaces: val })}
          />

          <FacingSelector
            value={singleFormData.facing}
            onChange={(val) => setSingleFormData({ ...singleFormData, facing: val })}
          />

          <CarparkLevelSelector
            value={singleFormData.carparkPosition}
            onChange={(val) => setSingleFormData({ ...singleFormData, carparkPosition: val })}
            mode="range"
          />

          <FurnitureSelector
            value={singleFormData.furniture}
            onChange={(val) => setSingleFormData({ ...singleFormData, furniture: val })}
          />

          <FacilitiesSelector
            value={singleFormData.facilities}
            onChange={(val) => setSingleFormData({ ...singleFormData, facilities: val })}
          />

          <BuildYearSelector
            value={singleFormData.buildYear}
            onChange={(val) => setSingleFormData({ ...singleFormData, buildYear: val })}
            quarter={singleFormData.quarter}
            onQuarterChange={(val) => setSingleFormData({ ...singleFormData, quarter: val })}
            showQuarter={true}
          />

          <ImageUpload
            config={{
              bedrooms: singleFormData.rooms,
              bathrooms: singleFormData.bathrooms,
              kitchens: singleFormData.kitchens,
              livingRooms: singleFormData.livingRooms,
              carpark: singleFormData.carpark,
              extraSpaces: singleFormData.extraSpaces,
              facilities: singleFormData.facilities,
              furniture: singleFormData.furniture,
            }}
            images={singleFormData.photos}
            setImages={(updated) => setSingleFormData({ ...singleFormData, photos: updated })}
          />
        </div>
      )}

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
