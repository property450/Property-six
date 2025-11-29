// components/UnitLayoutForm.js
"use client";
import { useState, useRef } from "react";

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

// 和 TypeSelector 同步的 Category / Sub Type 配置
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

// 千分位显示（单位数量用）
const formatInt = (val) => {
  if (val === "" || val == null) return "";
  const num = Number(val);
  if (Number.isNaN(num)) return "";
  return num.toLocaleString();
};

/** 把 AreaSelector 返回的对象转换成总 sqft */
const getAreaSqftFromAreaSelector = (area) => {
  if (!area) return 0;

  const convertToSqFt = (val, unit) => {
    const num = parseFloat(String(val || "").replace(/,/g, ""));
    if (isNaN(num) || num <= 0) return 0;
    const u = String(unit || "").toLowerCase();

    if (u.includes("square meter") || u.includes("sq m") || u.includes("sqm")) {
      return num * 10.7639;
    }
    if (u.includes("acre")) {
      return num * 43560;
    }
    if (u.includes("hectare")) {
      return num * 107639;
    }
    return num; // 默认 sqft
  };

  if (area.values && area.units) {
    const buildUpSqft = convertToSqFt(area.values.buildUp, area.units.buildUp);
    const landSqft = convertToSqFt(area.values.land, area.units.land);
    return (buildUpSqft || 0) + (landSqft || 0);
  }

  if (typeof area === "object") {
    const buildUp = Number(area.buildUp || 0);
    const land = Number(area.land || 0);
    return buildUp + land;
  }

  const num = parseFloat(String(area).replace(/,/g, ""));
  return isNaN(num) ? 0 : num;
};

/** 从 price 字段解析 min / max */
const getPriceRange = (priceValue) => {
  let minPrice = 0;
  let maxPrice = 0;

  if (priceValue == null || priceValue === "") {
    return { minPrice: 0, maxPrice: 0 };
  }

  if (typeof priceValue === "string" && priceValue.includes("-")) {
    const [minStr, maxStr] = priceValue.split("-");
    if (minStr) minPrice = Number(minStr) || 0;
    if (maxStr) maxPrice = Number(maxStr) || 0;
  } else if (typeof priceValue === "object") {
    minPrice = Number(priceValue.min) || 0;
    maxPrice = Number(priceValue.max) || 0;
  } else {
    const num = Number(priceValue) || 0;
    minPrice = num;
    maxPrice = num;
  }

  return { minPrice, maxPrice };
};

/** 生成「每平方英尺: RM xxx.xx ~ RM yyy.yy」 */
const getPsfText = (areaObj, priceValue) => {
  const totalAreaSqft = getAreaSqftFromAreaSelector(areaObj);
  const { minPrice, maxPrice } = getPriceRange(priceValue);

  if (!totalAreaSqft || totalAreaSqft <= 0) return "";
  if (!minPrice && !maxPrice) return "";

  const lowPrice = minPrice > 0 ? minPrice : maxPrice;
  const highPrice = maxPrice > 0 ? maxPrice : minPrice;

  const lowPsf = lowPrice / totalAreaSqft;
  const highPsf = highPrice > 0 ? highPrice / totalAreaSqft : lowPsf;

  if (!isFinite(lowPsf)) return "";

  if (Math.abs(highPsf - lowPsf) < 0.005) {
    return `每平方英尺: RM ${lowPsf.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })}`;
  }

  return `每平方英尺: RM ${lowPsf.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })} ~ RM ${highPsf.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}`;
};

export default function UnitLayoutForm({
  index,
  data = {},
  onChange,
  projectType,
}) {
  const fileInputRef = useRef(null);
  const [unitOpen, setUnitOpen] = useState(false);

  const handleChange = (field, value) => {
    const updated = { ...data, [field]: value };
    onChange(updated);
  };

  const handleUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    handleChange("layoutPhotos", [...(data.layoutPhotos || []), ...files]);
  };

  // 单位数量显示
  const unitDisplay = formatInt(data.unitCount);

  const handleUnitInput = (rawInput) => {
    const raw = String(rawInput || "").replace(/,/g, "");
    if (!/^\d*$/.test(raw)) return;
    const num = raw ? Number(raw) : "";
    handleChange("unitCount", num);
  };

  const handleUnitPick = (num) => {
    handleChange("unitCount", num);
    setUnitOpen(false);
  };

  const currentCategory = data.propertyCategory || "";
  const subTypeList = CATEGORY_OPTIONS[currentCategory] || [];

  const psfText = getPsfText(data.buildUp, data.price);

  return (
    <div className="border p-4 rounded-lg bg-white mb-4 shadow-sm">
      <h3 className="font-semibold mb-3">Layout {index + 1}</h3>

      {/* 上传 Layout 按钮 + 预览（长形按钮） */}
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
          onChange={handleUpload}
        />

        <ImageUpload
          images={data.layoutPhotos || []}
          setImages={(updated) => handleChange("layoutPhotos", updated)}
        />
      </div>

      {/* Type 名称 */}
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
          value={currentCategory}
          onChange={(e) => {
            const cat = e.target.value;
            handleChange("propertyCategory", cat);
            handleChange("subType", "");
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
      {currentCategory && (
        <div className="mb-3">
          <label className="block font-medium mb-1">Sub Type</label>
          <select
            value={data.subType || ""}
            onChange={(e) => handleChange("subType", e.target.value)}
            className="border p-2 rounded w-full"
          >
            <option value="">请选择具体类型</option>
            {subTypeList.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 这个房型有多少个单位？ */}
      <div className="mb-3">
        <label className="block font-medium mb-1">
          这个房型有多少个单位？
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="选择单位数量（可手动输入）"
            value={unitDisplay}
            onChange={(e) => handleUnitInput(e.target.value)}
            onFocus={() => setUnitOpen(true)}
            onClick={() => setUnitOpen(true)}
            className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring focus:border-blue-500"
          />
          {unitOpen && (
            <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-auto">
              {Array.from({ length: 500 }, (_, i) => i + 1).map((num) => (
                <li
                  key={num}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleUnitPick(num);
                  }}
                >
                  {num.toLocaleString()}
                </li>
              ))}
            </ul>
          )}
        </div>
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
        type={projectType}
      />

      {/* PSF 显示 */}
      {psfText && (
        <p className="text-sm text-gray-600 mt-1">{psfText}</p>
      )}

      {/* 房间数量（保持“请选择数量”逻辑） */}
      <RoomCountSelector
        value={{
          bedrooms: data.bedrooms || "",
          bathrooms: data.bathrooms || "",
          kitchens: data.kitchens || "",
          livingRooms: data.livingRooms || "",
        }}
        onChange={(v) => onChange({ ...data, ...v })}
      />

      {/* 停车位 */}
      <CarparkCountSelector
        value={data.carpark || ""}
        onChange={(v) => handleChange("carpark", v)}
        mode={
          projectType?.includes("New Project") ||
          projectType?.includes("Completed Unit")
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
