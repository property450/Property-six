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
import TransitSelector from "./TransitSelector";

// 和 TypeSelector 同步的分类/子类
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

export default function UnitLayoutForm({ index, data = {}, onChange }) {
  const fileInputRef = useRef(null);

  // 通用更新（保持你原来的写法，只是封装一下）
  const handleChange = (field, value) => {
    const updated = { ...data, [field]: value };
    onChange?.(updated);
  };

  const handleUpload = (e) => {
    const files = Array.from(e.target.files || []);
    handleChange("layoutPhotos", [...(data.layoutPhotos || []), ...files]);
  };

  return (
    <div className="border p-4 rounded-lg bg-white mb-4 shadow-sm">
      {/* 标题 + 长形按钮（帮你换回长的） */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Layout {index + 1}</h3>
        <button
          type="button"
          className="border px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
          onClick={() => fileInputRef.current?.click()}
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
      </div>

      {/* Type 名称 */}
      <input
        className="border p-2 rounded w-full mb-3"
        placeholder="输入 Type 名称"
        value={data.type || ""}
        onChange={(e) => handleChange("type", e.target.value)}
      />

      {/* Property Category —— 恢复简单写法，保证肯定有反应 */}
      <div className="mb-3">
        <label className="block font-medium mb-1">Property Category</label>
        <select
          className="w-full border rounded px-3 py-2 bg-white"
          value={data.propertyCategory || ""}
          onChange={(e) => {
            const category = e.target.value;
            handleChange("propertyCategory", category);
            // 换 Category 时清空 Sub Type，防止残留
            handleChange("subType", "");
          }}
        >
          <option value="">请选择类别</option>
          {Object.keys(CATEGORY_OPTIONS).map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* 这个房型有多少个单位？—— 下拉 + 手动输入 + 千分位 */}
      <div className="mb-3">
        <label className="block font-medium mb-1">这个房型有多少个单位？</label>
        <input
          type="text"
          className="w-full border rounded px-3 py-2 bg-white"
          placeholder="选择单位数量（可手动输入）"
          value={
            data.unitCount === "" || data.unitCount == null
              ? ""
              : Number(data.unitCount).toLocaleString()
          }
          onChange={(e) => {
            const raw = e.target.value.replace(/,/g, "");
            // 只允许数字
            if (!/^\d*$/.test(raw)) return;
            handleChange("unitCount", raw ? Number(raw) : "");
          }}
          list={`unit-count-list-${index}`}
        />
        <datalist id={`unit-count-list-${index}`}>
          {Array.from({ length: 500 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n.toLocaleString()} />
          ))}
        </datalist>
      </div>

      {/* Sub Type —— 只依赖 data.propertyCategory，不用什么 currentCategory / subTypeList 了 */}
      {data.propertyCategory && (
        <div className="mb-3">
          <label className="block font-medium mb-1">Sub Type</label>
          <select
            className="w-full border rounded px-3 py-2 bg-white"
            value={data.subType || ""}
            onChange={(e) => handleChange("subType", e.target.value)}
          >
            <option value="">请选择具体类型</option>
            {(CATEGORY_OPTIONS[data.propertyCategory] || []).map((st) => (
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

      {/* 房间数量 —— 保持“请选择卧室数量”等占位文字，你 upload-property 里已经传 ""，这里不改 */}
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
