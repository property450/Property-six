"use client";
import { useState, useEffect } from "react";

// 复用现有组件
import PriceInput from "./PriceInput";
import CarparkCountSelector from "./CarparkCountSelector";
import BuildYearSelector from "./BuildYearSelector";
import ExtraSpacesSelector from "./ExtraSpacesSelector";
import FacingSelector from "./FacingSelector";
import FurnitureSelector from "./FurnitureSelector";
import FacilitiesSelector from "./FacilitiesSelector";
import CarparkLevelSelector from "./CarparkLevelSelector";
import RoomCountSelector from "./RoomCountSelector"; // ✅ 使用 RoomCountSelector
import AreaSelector from "./AreaSelector";
import ImageUpload from "./ImageUpload";

export default function UnitLayoutForm({ index, data, onChange }) {
  const [type, setType] = useState(data.type || "");
  const fileInputRef = useRef(null); // ✅ 这里加上
  
  function PricePerSqft({ price, buildUp }) {
    if (!price || !buildUp) return null;
    const value = (price / buildUp).toFixed(2);
    return <p className="text-sm text-gray-600">≈ RM {value} / sqft</p>;
  }

  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  // 每次 data 更新时生成 config
  const [config, setConfig] = useState({});
  useEffect(() => {
    setConfig({
      bedrooms: Number(data.bedrooms) || 0,
      bathrooms: Number(data.bathrooms) || 0,
      kitchens: Number(data.kitchens) || 0,
      livingRooms: Number(data.livingRooms) || 0,
      carpark: Number(data.carpark) || 0,
      extraSpaces: data.extraSpaces || [],
      facilities: data.facilities || [],
      furniture: data.furniture || [],
      orientation: data.facing || null,
    });
  }, [data]);

  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white">
      <h3 className="font-semibold mb-3">Layout {index + 1}</h3>

  {/* ✅ 上传 Layout 按钮 */}
      <div className="mb-3">
        <button
          type="button"
          className="mb-3 px-3 py-2 bg-gray-100 border rounded hover:bg-gray-200 w-full"
          onClick={() => fileInputRef.current.click()}
        >
          点击上传 Layout
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleLayoutUpload}
        />

            {/* 已上传的 Layout 图片预览 */}
        <ImageUpload
          images={data.layoutPhotos || []}
          setImages={(updated) => handleChange("layoutPhotos", updated)}
        />
      </div>

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

      {/* 照片上传 */}
      <div className="mb-3">
        <label className="block mb-1 font-medium">上传照片</label>
        <ImageUpload
          config={config}
          images={data.photos || []}
          setImages={(updated) => handleChange("photos", updated)}
        />
      </div>

      {/* 面积、价格 */}
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

      {/* ✅ 只引入一次 RoomCountSelector，让它自己处理卧室/浴室/厨房/客厅 */}
      <RoomCountSelector
  value={{
    bedrooms: data.bedrooms,
    bathrooms: data.bathrooms,
    kitchens: data.kitchens,
    livingRooms: data.livingRooms,
  }}
  onChange={(updated) => onChange({ ...data, ...updated })}
/>

      {/* 🚗 停车位选择 */}
<CarparkCountSelector
  value={data.carpark}
  onChange={(val) => handleChange("carpark", val)}
  mode={
    data.projectType === "New Project / Under Construction" ||
    data.projectType === "Completed Unit / Developer Unit"
      ? "range"
      : "single"
  }
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
