"use client";
import { useState } from "react";
import CarparkCountSelector from "./CarparkCountSelector";
import BuildYearSelector from "./BuildYearSelector";
// 这里可以引入你已有的 PriceRangeSelector, FacilitySelector, FurnitureSelector 等组件

export default function UnitLayoutForm({ index, data, onChange }) {
  const [layout, setLayout] = useState(data.layout || null);
  const [type, setType] = useState(data.type || "");

  const handleChange = (field, value) => {
    onChange({ [field]: value });
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
      <div className="mb-3">
        <label className="block mb-1 font-medium">价格范围</label>
        {/* 用你现有的价格范围输入组件 */}
      </div>

      {/* 房间数量 */}
      <div className="mb-3">
        <label className="block mb-1 font-medium">房间数量</label>
        <input
          type="number"
          className="border p-2 rounded w-full"
          onChange={(e) => handleChange("rooms", e.target.value)}
        />
      </div>

      {/* 浴室数量 */}
      <div className="mb-3">
        <label className="block mb-1 font-medium">浴室数量</label>
        <input
          type="number"
          className="border p-2 rounded w-full"
          onChange={(e) => handleChange("bathrooms", e.target.value)}
        />
      </div>

      {/* 厨房、客厅、停车位数量范围、额外空间、朝向、家具、设施、完成日期... */}
      {/* 都可以用你现有的组件，比如 CarparkCountSelector、BuildYearSelector 等 */}
    </div>
  );
}
