"use client";
import { useState, useEffect, useRef } from "react";

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

export default function UnitLayoutForm({ index, data, onChange }) {
  const [type, setType] = useState(data.type || "");
  const fileInputRef = useRef(null);

  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const handleLayoutUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const newPhotos = [...(data.layoutPhotos || []), ...files];
    handleChange("layoutPhotos", newPhotos);
  };

  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white">
      <h3 className="font-semibold mb-3">Layout {index + 1}</h3>

      {/* 上传 Layout 按钮 */}
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

        <ImageUpload
          images={data.layoutPhotos || []}
          setImages={(updated) => handleChange("layoutPhotos", updated)}
        />
      </div>

      {/* type 名称 */}
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
      <ImageUpload
        config={{
          bedrooms: Number(data.bedrooms) || 0,
          bathrooms: Number(data.bathrooms) || 0,
          kitchens: Number(data.kitchens) || 0,
          livingRooms: Number(data.livingRooms) || 0,
          carpark: Number(data.carpark) || 0,
          extraSpaces: data.extraSpaces || [],
          facilities: data.facilities || [],
          furniture: data.furniture || [],
        }}
        images={data.photos || []}
        setImages={(updated) => handleChange("photos", updated)}
      />

      {/* 房间选择 */}
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
          data.projectType?.includes("New Project") ||
          data.projectType?.includes("Developer Unit")
            ? "range"
            : "single"
        }
      />

      {/* 其他选择器... */}
    </div>
  );
}
