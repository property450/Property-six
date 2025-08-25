"use client";
import { useState } from "react";

// ✅ 复用你现有的组件
import PriceInput from "./PriceInput";
import CarparkCountSelector from "./CarparkCountSelector";
import BuildYearSelector from "./BuildYearSelector";
import ExtraSpacesSelector from "./ExtraSpacesSelector";
import FacingSelector from "./FacingSelector";
import FurnitureSelector from "./FurnitureSelector";
import FacilitiesSelector from "./FacilitiesSelector";
import CarparkLevelSelector from "./CarparkLevelSelector";
import RoomCountSelector from "./RoomCountSelector";
import AreaSelector from "./AreaSelector";
import ImageUpload from "./ImageUpload"; // ✅ 引入你现有的上传组件

export default function UnitLayoutForm({ index, data, onChange }) {
  const [type, setType] = useState(data.type || "");

  function PricePerSqft({ price, buildUp }) {
    if (!price || !buildUp) return null;
    const value = (price / buildUp).toFixed(2);
    return <p className="text-sm text-gray-600">≈ RM {value} / sqft</p>;
  }

  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  // ✅ 动态生成 config（和 upload-property.js 一致）
  const config = {
    bedrooms: Number(data.rooms) || 0,
    bathrooms: Number(data.bathrooms) || 0,
    kitchens: Number(data.kitchens) || 0,
    livingRooms: Number(data.livingRooms) || 0,
    carpark: Number(data.carpark) || 0,
    extraSpaces: data.extraSpaces || [],
  };

  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white">
      <h3 className="font-semibold mb-3">Layout {index + 1}</h3>

      {/* 上传按钮（如果需要） */}
      <button className="mb-3 px-3 py-2 bg-gray-100 border rounded hover:bg-gray-200 w-full">
        点击上传 Layout
      </button>

      {/* Type 名称 */}
      <input
        type="text"
        placeholder="输入 Type 名称"
        value={type}
        onChange={(e) => {
          setType(e.target.value);
          handleChange("type", e.target.value);
        }}
        className="border p-2 rounded w-full mb-3"
      />

      {/* ✅ 照片上传：使用你原本的 ImageUpload */}
      <div className="mb-3">
        <label className="block mb-1 font-medium">上传照片</label>
        <ImageUpload
          config={config}
          images={data.photos || []}        // 每个房型独立的照片
          setImages={(files) => handleChange("photos", files)}
        />
      </div>

      {/* ✅ 直接用你原本的组件 */}
      <AreaSelector
        value={data.buildUp}
        onChange={(val) => handleChange("buildUp", val)}
      />

      <PriceInput
        value={data.price}
        onChange={(val) => handleChange("price", val)}
        type="range"
      />

      <PricePerSqft price={data.price} buildUp={data.buildUp} />

      <RoomCountSelector
        label="卧室"
        value={data.rooms}
        onChange={(val) => handleChange("rooms", val)}
      />

      <RoomCountSelector
        label="浴室"
        value={data.bathrooms}
        onChange={(val) => handleChange("bathrooms", val)}
      />

      <CarparkCountSelector
        value={data.carpark}
        onChange={(val) => handleChange("carpark", val)}
        mode="range"
      />

      <ExtraSpacesSelector
        value={data.extraSpaces || []}
        onChange={(val) => handleChange("extraSpaces", val)}
      />

      <FacingSelector
        value={data.facing}
        onChange={(val) => handleChange("facing", val)}
      />

      <CarparkLevelSelector
        value={data.carparkPosition}
        onChange={(val) => handleChange("carparkPosition", val)}
        mode="range"
      />

      <FurnitureSelector
        value={data.furniture}
        onChange={(val) => handleChange("furniture", val)}
      />

      <FacilitiesSelector
        value={data.facilities}
        onChange={(val) => handleChange("facilities", val)}
      />

      <BuildYearSelector
        value={data.buildYear}
        onChange={(val) => handleChange("buildYear", val)}
        quarter={data.quarter}
        onQuarterChange={(val) => handleChange("quarter", val)}
        showQuarter={true}
      />
    </div>
  );
}
