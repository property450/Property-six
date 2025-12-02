// components/UnitLayoutForm.js
"use client";

import { useState, useRef, useEffect } from "react";

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
import FloorCountSelector from "./FloorCountSelector";

// ================================
// 公用方法（不动你的逻辑）
// ================================
function getAreaSqftFromAreaSelector(area) {
  if (!area) return 0;
  const convertToSqFt = (val, unit) => {
    const num = parseFloat(String(val || "").replace(/,/g, ""));
    if (isNaN(num) || num <= 0) return 0;
    const u = String(unit || "").toLowerCase();

    if (u.includes("square meter") || u.includes("sq m") || u.includes("sqm"))
      return num * 10.7639;
    if (u.includes("acre")) return num * 43560;
    if (u.includes("hectare")) return num * 107639;
    return num;
  };

  if (area.values && area.units) {
    const buildUpSqft = convertToSqFt(area.values.buildUp, area.units.buildUp);
    const landSqft = convertToSqFt(area.values.land, area.units.land);
    return (buildUpSqft || 0) + (landSqft || 0);
  }

  if (typeof area === "object") {
    return Number(area.buildUp || 0) + Number(area.land || 0);
  }

  const num = parseFloat(String(area).replace(/,/g, ""));
  return isNaN(num) ? 0 : num;
}

function getPriceRange(val) {
  let minPrice = 0,
    maxPrice = 0;

  if (!val) return { minPrice: 0, maxPrice: 0 };
  if (typeof val === "string" && val.includes("-")) {
    const [mn, mx] = val.split("-");
    minPrice = Number(mn) || 0;
    maxPrice = Number(mx) || 0;
  } else if (typeof val === "object") {
    minPrice = Number(val.min) || 0;
    maxPrice = Number(val.max) || 0;
  } else {
    minPrice = Number(val) || 0;
    maxPrice = minPrice;
  }
  return { minPrice, maxPrice };
}

function getPsfText(areaObj, priceValue) {
  const totalArea = getAreaSqftFromAreaSelector(areaObj);
  const { minPrice, maxPrice } = getPriceRange(priceValue);

  if (!totalArea || (!minPrice && !maxPrice)) return "";

  const low = minPrice > 0 ? minPrice : maxPrice;
  const high = maxPrice > 0 ? maxPrice : minPrice;

  const lowPSF = low / totalArea;
  const highPSF = high / totalArea;

  if (!isFinite(lowPSF)) return "";

  if (Math.abs(highPSF - lowPSF) < 0.005)
    return `每平方英尺: RM ${lowPSF.toFixed(2)}`;

  return `每平方英尺: RM ${lowPSF.toFixed(2)} ~ RM ${highPSF.toFixed(2)}`;
}

// ================================
// Category / Subtype
// ================================
const CATEGORY_OPTIONS = {
  "Bungalow / Villa": ["Bungalow", "Link Bungalow", "Twin Villa", "Zero-Lot Bungalow", "Bungalow land"],
  "Apartment / Condo / Service Residence": ["Apartment", "Condominium", "Flat", "Service Residence"],
  "Semi-Detached House": ["Cluster House", "Semi-Detached House"],
  "Terrace / Link House": ["Terraced House", "Townhouse"],
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
  Land: ["Agricultural Land", "Industrial Land", "Commercial Land", "Residential Land", "Oil Palm Estate", "Rubber Plantation", "Fruit Orchard", "Paddy Field", "Vacant Agricultural Land"],
};

// ⭐ New Project layout 里的 Property Subtype
const SUBTYPE_OPTIONS = ["Penthouse", "Duplex", "Triplex", "Dual Key", "None / Not Applicable"];

// ⭐ 哪些类型需要显示“层数”
const NEED_STOREYS_CATEGORY = new Set([
  "Bungalow / Villa",
  "Business Property",
  "Industrial Property",
  "Semi-Detached House",
  "Terrace / Link House",
]);

// ================================
// 上传图片 label 生成（原逻辑保留）
// ================================
const toCount = (v) => {
  const num = Number(String(v || "").replace(/,/g, ""));
  return Number.isFinite(num) && num > 0 ? Math.floor(num) : 0;
};

function getPhotoLabelsFromConfig(cfg) {
  const safe = cfg || {};
  let arr = [];

  if (safe.bedrooms) {
    const n = toCount(safe.bedrooms);
    for (let i = 1; i <= n; i++) arr.push(`卧室${i}`);
  }
  if (safe.bathrooms) {
    const n = toCount(safe.bathrooms);
    for (let i = 1; i <= n; i++) arr.push(`浴室${i}`);
  }
  if (safe.kitchens) {
    const n = toCount(safe.kitchens);
    for (let i = 1; i <= n; i++) arr.push(`厨房${i}`);
  }
  if (safe.livingRooms) {
    const n = toCount(safe.livingRooms);
    for (let i = 1; i <= n; i++) arr.push(`客厅${i}`);
  }

  return [...new Set(arr)];
}

// ================================
// 组件主体
// ================================
export default function UnitLayoutForm({ index, data, onChange }) {
  const layout = data || {};

  const [category, setCategory] = useState(layout.propertyCategory || "");
  const [subType, setSubType] = useState(layout.subType || "");
  const [propertySubtype, setPropertySubtype] = useState(layout.propertySubtype || "");
  const [showSubtype, setShowSubtype] = useState(false);
  const [storeys, setStoreys] = useState(layout.storeys || "");

  useEffect(() => {
    setShowSubtype(
      category === "Apartment / Condo / Service Residence" ||
      category === "Business Property"
    );
  }, [category]);

  const update = (patch) => {
    onChange && onChange({ ...layout, ...patch });
  };

  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white">
      <h3 className="font-semibold mb-3">Layout {index + 1}</h3>

      {/* Category */}
      <div className="mb-3">
        <label className="font-medium">Property Category</label>
        <select
          value={category}
          onChange={(e) => {
            const val = e.target.value;
            setCategory(val);
            setSubType("");
            setPropertySubtype("");
            update({ propertyCategory: val, subType: "", propertySubtype: "" });
          }}
          className="border p-2 rounded w-full"
        >
          <option value="">请选择类别</option>
          {Object.keys(CATEGORY_OPTIONS).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Sub Type */}
      {category && (
        <>
          <div className="mb-3">
            <label className="font-medium">Sub Type</label>
            <select
              className="border p-2 rounded w-full"
              value={subType}
              onChange={(e) => {
                setSubType(e.target.value);
                update({ subType: e.target.value });
              }}
            >
              <option value="">请选择</option>
              {CATEGORY_OPTIONS[category].map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          {/* 层数：只有指定 Category 才显示 */}
          {NEED_STOREYS_CATEGORY.has(category) && (
            <FloorCountSelector
              value={storeys}
              onChange={(v) => {
                setStoreys(v);
                update({ storeys: v });
              }}
            />
          )}

          {/* Property Subtype：Apartment/Business 才显示 */}
          {showSubtype && (
            <div className="mb-3">
              <label className="font-medium">Property Subtype</label>
              <select
                value={propertySubtype}
                onChange={(e) => {
                  setPropertySubtype(e.target.value);
                  update({ propertySubtype: e.target.value });
                }}
                className="border p-2 rounded w-full"
              >
                <option value="">请选择</option>
                {SUBTYPE_OPTIONS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          )}
        </>
      )}

      {/* 这个房型有多少个单位？：一个框 + 下拉选择 */}
      <div className="mb-3" ref={unitCountRef}>
        <label className="block font-medium mb-1">这个房型有多少个单位？</label>

        <div className="relative">
          {/* 输入框：可手动输入，自动千分位 */}
          <input
            type="text"
            placeholder="例如：120"
            value={formatNumber(unitCountLocal)}
            onChange={(e) => {
              const raw = parseNumber(e.target.value);
              if (!/^\d*$/.test(raw)) return; // 只接受数字

              setUnitCountLocal(raw);
              handleFieldChange("unitCount", raw);
            }}
            onFocus={() => setUnitDropdownOpen(true)}
            onClick={() => setUnitDropdownOpen(true)}
            className="border p-2 rounded w-full"
          />

          {/* 下拉：1 ~ 1,000 */}
          {unitDropdownOpen && (
            <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-auto">
              <li className="px-3 py-2 text-gray-500 cursor-default select-none border-b">
                从 1 ~ 1,000 中选择，或直接输入
              </li>
              {Array.from({ length: 1000 }, (_, i) => i + 1).map((num) => (
                <li
                  key={num}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const val = String(num);
                    setUnitCountLocal(val);
                    handleFieldChange("unitCount", val);
                    setUnitDropdownOpen(false);
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
        initialValue={areaForPsf || {}}
        onChange={(val) => {
          setAreaForPsf(val);
          handleFieldChange("buildUp", val);
        }}
      />

      {/* 价格 */}
      <PriceInput
        value={priceForPsf}
        onChange={(val) => {
          setPriceForPsf(val);
          handleFieldChange("price", val);
        }}
        type={layout.projectType}
      />

      {/* 每平方英尺 */}
      {psfText && <p className="text-sm text-gray-600 mt-1">{psfText}</p>}

      {/* 房间数量 —— 同时更新 photoConfig + layout */}
      <RoomCountSelector
        value={{
          bedrooms: photoConfig.bedrooms,
          bathrooms: photoConfig.bathrooms,
          kitchens: photoConfig.kitchens,
          livingRooms: photoConfig.livingRooms,
        }}
        onChange={(patch) => {
          setPhotoConfig((prev) => ({ ...prev, ...patch }));
          updateLayout(patch);
        }}
      />

      {/* 停车位数量 */}
      <CarparkCountSelector
        value={photoConfig.carpark}
        onChange={(val) => {
          setPhotoConfig((prev) => ({ ...prev, carpark: val }));
          handleFieldChange("carpark", val);
        }}
        mode={
          layout.projectType === "New Project / Under Construction" ||
          layout.projectType === "Completed Unit / Developer Unit"
            ? "range"
            : "single"
        }
      />

      {/* 额外空间 */}
      <ExtraSpacesSelector
        value={photoConfig.extraSpaces}
        onChange={(val) => {
          setPhotoConfig((prev) => ({ ...prev, extraSpaces: val }));
          handleFieldChange("extraSpaces", val);
        }}
      />

      {/* 朝向 */}
      <FacingSelector
        value={photoConfig.orientation}
        onChange={(val) => {
          setPhotoConfig((prev) => ({ ...prev, orientation: val }));
          handleFieldChange("facing", val);
        }}
      />

      {/* 车位楼层 */}
      <CarparkLevelSelector
        value={layout.carparkPosition}
        onChange={(val) => handleFieldChange("carparkPosition", val)}
        mode="range"
      />

      {/* 家具 / 设施 */}
      <FurnitureSelector
        value={photoConfig.furniture}
        onChange={(val) => {
          setPhotoConfig((prev) => ({ ...prev, furniture: val }));
          handleFieldChange("furniture", val);
        }}
      />

      <FacilitiesSelector
        value={photoConfig.facilities}
        onChange={(val) => {
          setPhotoConfig((prev) => ({ ...prev, facilities: val }));
          handleFieldChange("facilities", val);
        }}
      />

      {/* 交通信息（每个 layout 自己的） */}
      <div className="mb-4">
        <label className="font-medium">交通信息</label>
        <TransitSelector
          onChange={(val) => {
            handleFieldChange("transit", val);
          }}
        />
      </div>

      {/* 建成年份 + 季度 */}
      <BuildYearSelector
        value={layout.buildYear}
        onChange={(val) => handleFieldChange("buildYear", val)}
        quarter={layout.quarter}
        onQuarterChange={(val) => handleFieldChange("quarter", val)}
        showQuarter={true}
      />

      {/* 每个 Layout 自己的房源描述 */}
      <div className="mt-3 mb-3">
        <label className="block font-medium mb-1">房源描述</label>
        <textarea
          value={layout.description || ""}
          onChange={(e) => handleFieldChange("description", e.target.value)}
          placeholder="请输入这个房型的详细描述..."
          rows={3}
          className="w-full border rounded-lg p-2 resize-y"
        />
      </div>

      {/* ⭐ 这里直接生成所有对应的上传框 */}
      <div className="mb-3">
        <label className="block mb-1 font-medium">上传此 Layout 的照片</label>

        <div className="space-y-4">
          {uploadLabels.map((label) => (
            <div key={label} className="space-y-2 border rounded p-2">
              <p className="font-semibold">{label}</p>

              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handlePhotoChange(e, label)}
              />

                  <div className="grid grid-cols-3 gap-2">
                {(photosByLabel[label] || []).map((img, index) => (
                  <div key={img.url || index} className="relative">
                    <img
                      src={img.url}
                      alt={`preview-${index}`}
                      className={`w-full h-32 object-cover rounded ${
                        img.isCover ? "border-4 border-green-500" : ""
                      }`}
                    />
                    <button
                      type="button"
                      className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1 rounded"
                      onClick={() => removePhoto(label, index)}
                    >

                      X
                    </button>
                    <button
                      type="button"
                      className="absolute bottom-1 left-1 bg-black text-white text-xs px-1 rounded"
                      onClick={() => setCover(label, index)}
                    >
                      {img.isCover ? "封面" : "设为封面"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

              
