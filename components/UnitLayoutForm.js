"use client";
import { useState, useEffect, useRef } from "react";

// 复用现有组件
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
import ImageUpload from "./ImageUpload";
import TransitSelector from "./TransitSelector";

export default function UnitLayoutForm({ index, data, onChange }) {
  const [type, setType] = useState(data.type || "");
  const fileInputRef = useRef(null);
  const [transitInfo, setTransitInfo] = useState(data.transit || null);

  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  // 上传 layout 图片
  const handleLayoutUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newPhotos = [...(data.layoutPhotos || []), ...files];
    handleChange("layoutPhotos", newPhotos);
  };

  // 图片打标签 config
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
      transit: data.transit || null,
    });
  }, [data]);

  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white">
      <h3 className="font-semibold mb-3">Layout {index + 1}</h3>

      {/* 上传 Layout 按钮 + 预览 */}
      <div className="mb-3">
        <button
          type="button"
          className="mb-3 px-3 py-2 bg-gray-100 border rounded hover:bg-gray-200 w-full"
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
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

      {/* Layout 照片 */}
      <div className="mb-3">
        <label className="block mb-1 font-medium">上传照片</label>
        <ImageUpload
          config={config}
          images={data.photos || []}
          setImages={(updated) => handleChange("photos", updated)}
        />
      </div>

      {/* 面积：AreaSelector 会把 {types, units, values} 回传到 data.buildUp */}
      <AreaSelector
        initialValue={data.buildUp || {}}
        onChange={(val) => handleChange("buildUp", val)}
      />

      {/* 价格：PriceInput 负责显示 + 计算 psf */}
      <PriceInput
        value={data.price}
        onChange={(val) => handleChange("price", val)}
        type={data.projectType}
        area={data.buildUp}
      />

      {/* 房间数量 */}
      <RoomCountSelector
        value={{
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          kitchens: data.kitchens,
          livingRooms: data.livingRooms,
        }}
        onChange={(updated) => onChange({ ...data, ...updated })}
      />

      {/* 停车位 */}
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

      {/* 额外空间 */}
      <ExtraSpacesSelector
        value={data.extraSpaces || []}
        onChange={(val) => handleChange("extraSpaces", val)}
      />

      {/* 朝向 */}
      <FacingSelector
        value={data.facing || []}
        onChange={(val) => handleChange("facing", val)}
      />

      {/* 车位楼层 */}
      <CarparkLevelSelector
        value={data.carparkPosition}
        onChange={(val) => handleChange("carparkPosition", val)}
        mode="range"
      />

      {/* 家具 / 设施 */}
      <FurnitureSelector
        value={data.furniture}
        onChange={(val) => handleChange("furniture", val)}
      />

      <FacilitiesSelector
        value={data.facilities}
        onChange={(val) => handleChange("facilities", val)}
      />

      {/* 交通信息 */}
      <div className="mb-4">
        <label className="font-medium">交通信息</label>
        <TransitSelector
          onChange={(val) => {
            setTransitInfo(val);
            handleChange("transit", val);
          }}
        />
      </div>

      {/* 建成年份 + 季度 */}
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
