"use client";
import { useState } from "react";
import PriceInput from "./PriceInput";
import CarparkCountSelector from "./CarparkCountSelector";
import BuildYearSelector from "./BuildYearSelector";
import ExtraSpacesSelector from "./ExtraSpacesSelector";
import FacingSelector from "./FacingSelector";
import FurnitureSelector from "./FurnitureSelector";
import FacilitiesSelector from "./FacilitiesSelector";
import CarparkLevelSelector from "./CarparkLevelSelector";

export default function UnitLayoutForm({ index, data, onChange }) {
  const [type, setType] = useState(data.type || "");

  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value }); // ✅ 合并
  };

  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white">
      <h3 className="font-semibold mb-3">Layout {index + 1}</h3>

      {/* 上传按钮 */}
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

      {/* Build up */}
      <div className="mb-3">
        <label className="block mb-1 font-medium">Build Up</label>
        <div className="flex gap-2">
          <input
            type="number"
            className="border p-2 rounded w-full"
            placeholder="请输入数值"
            onChange={(e) => handleChange("buildUp", e.target.value)}
          />
          <select
            className="border p-2 rounded"
            onChange={(e) => handleChange("buildUpUnit", e.target.value)}
          >
            <option value="sqft">Square Feet</option>
            <option value="sqm">Square Meters</option>
            <option value="acre">Acre</option>
          </select>
        </div>
      </div>

      {/* Land Area */}
      <div className="mb-3">
        <label className="block mb-1 font-medium">Land Area</label>
        <div className="flex gap-2">
          <input
            type="number"
            className="border p-2 rounded w-full"
            placeholder="请输入数值"
            onChange={(e) => handleChange("landArea", e.target.value)}
          />
          <select
            className="border p-2 rounded"
            onChange={(e) => handleChange("landAreaUnit", e.target.value)}
          >
            <option value="sqft">Square Feet</option>
            <option value="sqm">Square Meters</option>
            <option value="acre">Acre</option>
          </select>
        </div>
      </div>

      {/* 价格范围 */}
      <PriceInput
        value={data.price || ""}
        onChange={(val) => handleChange("price", val)}
        type="range"
      />

      {/* 房间数量 */}
      <input
        type="number"
        placeholder="房间数量"
        className="border p-2 rounded w-full mb-3"
        onChange={(e) => handleChange("rooms", e.target.value)}
      />

      {/* 浴室数量 */}
      <input
        type="number"
        placeholder="浴室数量"
        className="border p-2 rounded w-full mb-3"
        onChange={(e) => handleChange("bathrooms", e.target.value)}
      />

      {/* 厨房数量 */}
      <input
        type="number"
        placeholder="厨房数量"
        className="border p-2 rounded w-full mb-3"
        onChange={(e) => handleChange("kitchens", e.target.value)}
      />

      {/* 客厅数量 */}
      <input
        type="number"
        placeholder="客厅数量"
        className="border p-2 rounded w-full mb-3"
        onChange={(e) => handleChange("livingRooms", e.target.value)}
      />

      {/* 停车位数量范围 */}
      <CarparkCountSelector
        value={data.carpark || ""}
        onChange={(val) => handleChange("carpark", val)}
        mode="range"
      />

      {/* 总共有多少间 */}
      <input
        type="number"
        placeholder="总套数"
        className="border p-2 rounded w-full mb-3"
        onChange={(e) => handleChange("totalUnits", e.target.value)}
      />

      {/* 额外空间 */}
      <ExtraSpacesSelector
        value={data.extraSpaces || []}
        onChange={(val) => handleChange("extraSpaces", val)}
      />

      {/* 朝向 */}
      <FacingSelector
        value={data.facing || ""}
        onChange={(val) => handleChange("facing", val)}
      />

      {/* 车位位置范围 */}
      <CarparkLevelSelector
        value={data.carparkPosition || ""}
        onChange={(val) => handleChange("carparkPosition", val)}
        mode="range"
      />

      {/* 家私 */}
      <FurnitureSelector
        value={data.furniture || []}
        onChange={(val) => handleChange("furniture", val)}
      />

      {/* 设施 */}
      <FacilitiesSelector
        value={data.facilities || []}
        onChange={(val) => handleChange("facilities", val)}
      />

      {/* 项目完成日期 */}
      <BuildYearSelector
        value={data.buildYear || ""}
        onChange={(val) => handleChange("buildYear", val)}
        quarter={data.quarter}
        onQuarterChange={(val) => handleChange("quarter", val)}
        showQuarter={true}
      />
    </div>
  );
}
