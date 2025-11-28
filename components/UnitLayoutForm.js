// components/UnitLayoutForm.js
"use client";

import { useRef } from "react";

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
  // ❗ 完全受控：不在这里存 state，直接用父组件传进来的 data
  const layout = data || {};
  const fileInputRef = useRef(null);

  // 统一更新：只负责把修改后的 layout 回传给父组件
  const updateLayout = (patch) => {
    const updated = { ...layout, ...patch };
    onChange && onChange(updated);
  };

  // 上传 layout 图片
  const handleLayoutUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newPhotos = [...(layout.layoutPhotos || []), ...files];
    updateLayout({ layoutPhotos: newPhotos });
  };

  // 图片打标签 config（由当前 layout 直接算出来）
  const config = {
    bedrooms: Number(layout.bedrooms) || 0,
    bathrooms: Number(layout.bathrooms) || 0,
    kitchens: Number(layout.kitchens) || 0,
    livingRooms: Number(layout.livingRooms) || 0,
    carpark: Number(layout.carpark) || 0,
    extraSpaces: layout.extraSpaces || [],
    facilities: layout.facilities || [],
    furniture: layout.furniture || [],
    orientation: layout.facing || null,
    transit: layout.transit || null,
  };

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

        {/* 平面图上传（简单模式） */}
        <ImageUpload
          config={{}}
          images={layout.layoutPhotos || []}
          setImages={(updated) => updateLayout({ layoutPhotos: updated })}
        />
      </div>

      {/* Type 名称 */}
      <input
        type="text"
        placeholder="输入 Type 名称"
        value={layout.type || ""}
        onChange={(e) => updateLayout({ type: e.target.value })}
        className="border p-2 rounded w-full mb-3"
      />

      {/* Layout 照片（带房间标签） */}
      <div className="mb-3">
        <label className="block mb-1 font-medium">上传照片</label>
        <ImageUpload
          config={config}
          images={layout.photos || []}
          setImages={(updated) => updateLayout({ photos: updated })}
        />
      </div>

      {/* 面积：AreaSelector -> layout.buildUp（对象：{types,units,values}） */}
      <AreaSelector
        initialValue={layout.buildUp || {}}
        onChange={(val) => updateLayout({ buildUp: val })}
      />

      {/* 价格：PriceInput -> layout.price，psf 在 PriceInput 里显示 */}
      <PriceInput
        value={layout.price}
        onChange={(val) => updateLayout({ price: val })}
        type={layout.projectType}
        area={layout.buildUp}
      />

      {/* 房间数量 */}
      <RoomCountSelector
        value={{
          bedrooms: layout.bedrooms,
          bathrooms: layout.bathrooms,
          kitchens: layout.kitchens,
          livingRooms: layout.livingRooms,
        }}
        onChange={(updated) => updateLayout(updated)}
      />

      {/* 停车位 */}
      <CarparkCountSelector
        value={layout.carpark}
        onChange={(val) => updateLayout({ carpark: val })}
        mode={
          layout.projectType === "New Project / Under Construction" ||
          layout.projectType === "Completed Unit / Developer Unit"
            ? "range"
            : "single"
        }
      />

      {/* 额外空间 */}
      <ExtraSpacesSelector
        value={layout.extraSpaces || []}
        onChange={(val) => updateLayout({ extraSpaces: val })}
      />

      {/* 朝向 */}
      <FacingSelector
        value={layout.facing || []}
        onChange={(val) => updateLayout({ facing: val })}
      />

      {/* 车位楼层 */}
      <CarparkLevelSelector
        value={layout.carparkPosition}
        onChange={(val) => updateLayout({ carparkPosition: val })}
        mode="range"
      />

      {/* 家具 / 设施 */}
      <FurnitureSelector
        value={layout.furniture}
        onChange={(val) => updateLayout({ furniture: val })}
      />

      <FacilitiesSelector
        value={layout.facilities}
        onChange={(val) => updateLayout({ facilities: val })}
      />

      {/* 交通信息 */}
      <div className="mb-4">
        <label className="font-medium">交通信息</label>
        <TransitSelector
          value={layout.transit || null}
          onChange={(val) => updateLayout({ transit: val })}
        />
      </div>

      {/* 建成年份 + 季度 */}
      <BuildYearSelector
        value={layout.buildYear}
        onChange={(val) => updateLayout({ buildYear: val })}
        quarter={layout.quarter}
        onQuarterChange={(val) => updateLayout({ quarter: val })}
        showQuarter={true}
      />
    </div>
  );
}
