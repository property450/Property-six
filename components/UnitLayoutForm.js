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

// 千分位格式化（用于单位数量显示）
const formatNumber = (val) => {
  if (val === "" || val === null || val === undefined) return "";
  const num = Number(val);
  if (Number.isNaN(num)) return "";
  return num.toLocaleString();
};

// 和 TypeSelector 保持同步的分类/子类
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

export default function UnitLayoutForm({ index, data, onChange }) {
  const fileInputRef = useRef(null);

  // 保持你原本的合并逻辑：每次改一个 field，就把这个 layout 整个回传
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

      {/* 上传 Layout */}
      <button
        type="button"
        className="border px-3 py-2 rounded bg-gray-100 mb-2"
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

      {/* Layout 平面图预览 */}
      <ImageUpload
        images={data.layoutPhotos || []}
        setImages={(imgs) => handleChange("layoutPhotos", imgs)}
      />

      {/* Type 名 */}
      <input
        className="border p-2 rounded w-full my-3"
        placeholder="输入 Type 名称"
        value={data.type || ""}
        onChange={(e) => handleChange("type", e.target.value)}
      />

      {/* Property Category */}
      <div className="mb-3">
        <label className="block font-medium mb-1">Property Category</label>
        <select
          value={data.propertyCategory || ""}
          onChange={(e) => {
            const c = e.target.value;
            handleChange("propertyCategory", c);
            handleChange("subType", ""); // 切换类别时清空子类
          }}
          className="border p-2 rounded w-full"
        >
          <option value="">请选择类别</option>
          {Object.keys(CATEGORY_OPTIONS).map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Sub Type */}
      {data.propertyCategory && (
        <div className="mb-3">
          <label className="block font-medium mb-1">Sub Type</label>
          <select
            value={data.subType || ""}
            onChange={(e) => handleChange("subType", e.target.value)}
            className="border p-2 rounded w-full"
          >
            <option value="">请选择具体类型</option>
            {CATEGORY_OPTIONS[data.propertyCategory].map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 这个房型有多少个单位？（带 datalist + 千分位） */}
      <div className="mb-3">
        <label className="block font-medium mb-1">这个房型有多少个单位？</label>

        <input
          list={`unitCountList-${index}`}
          type="text"
          value={formatNumber(data.unitCount)}
          onChange={(e) => {
            const raw = e.target.value.replace(/,/g, "");
            if (!/^\d*$/.test(raw)) return; // 只能数字
            handleChange("unitCount", raw ? Number(raw) : "");
          }}
          className="border p-2 rounded w-full"
          placeholder="可选择或手动输入，例如 120"
        />

        <datalist id={`unitCountList-${index}`}>
          {Array.from({ length: 500 }, (_, i) => i + 1).map((num) => (
            <option key={num} value={num.toLocaleString()} />
          ))}
        </datalist>
      </div>

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

      {/* 房间数量（保持“请选择数量”的空字符串逻辑） */}
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

      <TransitSelector
        onChange={(v) => handleChange("transit", v)}
      />

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
