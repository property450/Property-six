// components/UnitLayoutForm.js
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
import TransitSelector from "./TransitSelector";

// ---------- 和 TypeSelector 同步的 Category / SubType 选项 ----------
const CATEGORY_OPTIONS = {
  "Bungalow / Villa": [
    "Bungalow",
    "Link Bungalow",
    "Twin Villa",
    "Zero-Lot Bungalow",
    "Bungalow land",
  ],

  "Apartment / Condo / Service Residence": [
    "Apartment",
    "Condominium",
    "Flat",
    "Service Residence",
  ],

  "Semi-Detached House": ["Cluster House", "Semi-Detached House"],

  "Terrace / Link House": [
    "1-storey Terraced House",
    "1.5-storey Terraced House",
    "2-storey Terraced House",
    "2.5-storey Terraced House",
    "3-storey Terraced House",
    "3.5-storey Terraced House",
    "4-storey Terraced House",
    "4.5-storey Terraced House",
    "Terraced House",
    "Townhouse",
  ],

  "Business Property": [
    "Hotel / Resort",
    "Hostel / Dormitory",
    "Boutique Hotel",
    "Office",
    "Office Suite",
    "Business Suite",
    "Retail Shop",
    "Retail Space",
    "Retail Office",
    "Shop",
    "Shop / Office",
    "Sofo",
    "Soho",
    "Sovo",
    "Commercial Bungalow",
    "Commercial Semi-Detached House",
    "Mall / Commercial Complex",
    "School / University",
    "Hospital / Medical Centre",
    "Mosque / Temple / Church",
    "Government Office",
    "Community Hall / Public Utilities",
  ],

  "Industrial Property": [
    "Factory",
    "Cluster Factory",
    "Semi-D Factory",
    "Detached Factory",
    "Terrace Factory",
    "Warehouse",
    "Showroom cum Warehouse",
    "Light Industrial",
    "Heavy Industrial",
  ],

  Land: [
    "Agricultural Land",
    "Industrial Land",
    "Commercial Land",
    "Residential Land",
    "Oil Palm Estate",
    "Rubber Plantation",
    "Fruit Orchard",
    "Paddy Field",
    "Vacant Agricultural Land",
  ],
};

// 房型单位数量 1 ~ 500
const UNIT_COUNT_OPTIONS = Array.from({ length: 500 }, (_, i) => i + 1);

// 千分位格式
const formatNumber = (num) => {
  if (num === "" || num === undefined || num === null) return "";
  const n = Number(String(num).replace(/,/g, ""));
  if (Number.isNaN(n)) return "";
  return n.toLocaleString();
};

// 去掉千分位
const parseNumber = (str) => String(str || "").replace(/,/g, "");

export default function UnitLayoutForm({ index, data, onChange }) {
  const fileInputRef = useRef(null);

  // 👉 这两个字段改用本地 state，先保证自己有反应
  const [localCategory, setLocalCategory] = useState(
    data.propertyCategory || ""
  );
  const [localUnitCount, setLocalUnitCount] = useState(
    data.unitCount ?? ""
  );

  // 父组件 data 变化时，同步到本地（防止编辑后再切换房型时不同步）
  useEffect(() => {
    setLocalCategory(data.propertyCategory || "");
  }, [data.propertyCategory]);

  useEffect(() => {
    setLocalUnitCount(data.unitCount ?? "");
  }, [data.unitCount]);

  // 「这个房型有多少个单位？」 下拉开关
  const unitRef = useRef(null);
  const [unitOpen, setUnitOpen] = useState(false);

  useEffect(() => {
    const onDocClick = (e) => {
      if (unitRef.current && !unitRef.current.contains(e.target)) {
        setUnitOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // 统一更新 layout
  const handleChange = (field, value) => {
    const updated = { ...data, [field]: value };
    onChange(updated);
  };

  const handleUpload = (e) => {
    const files = Array.from(e.target.files || []);
    handleChange("layoutPhotos", [...(data.layoutPhotos || []), ...files]);
  };

  return (
    <div className="border p-4 rounded-lg bg-white mb-4 shadow-sm">
      <h3 className="font-semibold mb-3">Layout {index + 1}</h3>

      {/* 上传 Layout —— 全宽长按钮 */}
      <button
        type="button"
        className="w-full border px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 mb-2 text-center"
        onClick={() => fileInputRef.current && fileInputRef.current.click()}
      >
        点击上传 Layout
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        multiple
        onChange={handleUpload}
      />

      {/* Type 名称 */}
      <input
        className="border p-2 rounded w-full my-3"
        placeholder="输入 Type 名称"
        value={data.type || ""}
        onChange={(e) => handleChange("type", e.target.value)}
      />

      {/* Property Category —— 改用本地 state，点击一定有反应 */}
      <div className="mb-3">
        <label className="block font-medium mb-1">Property Category</label>
        <select
          value={localCategory}
          onChange={(e) => {
            const c = e.target.value;
            setLocalCategory(c);          // 本地先更新
            handleChange("propertyCategory", c);  // 再同步给父组件
            handleChange("subType", "");  // 换 Category 时清空 SubType
          }}
          className="border p-2 rounded w-full bg-white"
        >
          <option value="">请选择类别</option>
          {Object.keys(CATEGORY_OPTIONS).map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* 这个房型有多少个单位？ —— 仿照卧室/浴室的下拉样式 */}
      <div className="mb-3" ref={unitRef}>
        <label className="block font-medium mb-1">这个房型有多少个单位？</label>
        <div className="relative">
          <input
            type="text"
            className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring focus:border-blue-500"
            placeholder="选择单位数量（可手动输入）"
            value={
              localUnitCount !== "" ? formatNumber(localUnitCount) : ""
            }
            onChange={(e) => {
              const raw = parseNumber(e.target.value);
              if (!/^\d*$/.test(raw)) return; // 只允许数字
              const num = raw === "" ? "" : Number(raw);
              setLocalUnitCount(num);
              handleChange("unitCount", num);
            }}
            onFocus={() => setUnitOpen(true)}
            onClick={() => setUnitOpen(true)}
          />
          {unitOpen && (
            <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-auto">
              {UNIT_COUNT_OPTIONS.map((num) => (
                <li
                  key={num}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setLocalUnitCount(num);
                    handleChange("unitCount", num);
                    setUnitOpen(false);
                  }}
                >
                  {formatNumber(num)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Sub Type */}
      {localCategory && (
        <div className="mb-3">
          <label className="block font-medium mb-1">Sub Type</label>
          <select
            value={data.subType || ""}
            onChange={(e) => handleChange("subType", e.target.value)}
            className="border p-2 rounded w-full bg-white"
          >
            <option value="">请选择具体类型</option>
            {CATEGORY_OPTIONS[localCategory].map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 面积 */}
      <AreaSelector
        initialValue={data.buildUp}
        onChange={(v) => handleChange("buildUp", v)}
      />

      {/* 价格 */}
      <PriceInput
        value={data.price}
        onChange={(v) => handleChange("price", v)}
        type={data.projectType}
      />

      {/* 房间数量 —— 保持“请选择卧室数量”这种 placeholder */}
      <RoomCountSelector
        value={{
          bedrooms: data.bedrooms || "",
          bathrooms: data.bathrooms || "",
          kitchens: data.kitchens || "",
          livingRooms: data.livingRooms || "",
        }}
        onChange={(v) => onChange({ ...data, ...v })}
      />

      {/* 车位 */}
      <CarparkCountSelector
        value={data.carpark || ""}
        onChange={(v) => handleChange("carpark", v)}
        mode={
          data.projectType?.includes("New Project") ||
          data.projectType?.includes("Completed Unit")
            ? "range"
            : "single"
        }
      />

      <ExtraSpacesSelector
        value={data.extraSpaces || []}
        onChange={(v) => handleChange("extraSpaces", v)}
      />

      <FacingSelector
        value={data.facing || ""}
        onChange={(v) => handleChange("facing", v)}
      />

      <FurnitureSelector
        value={data.furniture || []}
        onChange={(v) => handleChange("furniture", v)}
      />

      <FacilitiesSelector
        value={data.facilities || []}
        onChange={(v) => handleChange("facilities", v)}
      />

      <TransitSelector onChange={(v) => handleChange("transit", v)} />

      <BuildYearSelector
        value={data.buildYear || ""}
        quarter={data.quarter || ""}
        onChange={(v) => handleChange("buildYear", v)}
        onQuarterChange={(v) => handleChange("quarter", v)}
        showQuarter={true}
      />
    </div>
  );
}
