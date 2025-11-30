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

/** 把 AreaSelector 返回的对象，转换成「总平方英尺」 */
function getAreaSqftFromAreaSelector(area) {
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
    return num; // 默认当 sqft
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
}

/** 从 price 字段解析出 min / max */
function getPriceRange(priceValue) {
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
}

/** 生成「每平方英尺 RM xxx.xx ~ RM yyy.yy」 */
function getPsfText(areaObj, priceValue) {
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
}

// 和 TypeSelector 一样的 Category / SubType 选项
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

// ⭐ 把 range carpark 转成一个数字（和 subsale 一样，是单值）
function getCarparkCountForConfig(carpark) {
  if (carpark == null || carpark === "") return "";
  if (typeof carpark === "object") {
    const min = Number(carpark.min || 0);
    const max = Number(carpark.max || 0);
    const v = max || min;
    return v ? String(v) : "";
  }
  return String(carpark);
}

export default function UnitLayoutForm({ index, data, onChange }) {
  const layout = data || {};

  const [type, setType] = useState(layout.type || "");
  const fileInputRef = useRef(null);
  const [transitInfo, setTransitInfo] = useState(layout.transit || null);

  const [areaForPsf, setAreaForPsf] = useState(layout.buildUp || {});
  const [priceForPsf, setPriceForPsf] = useState(layout.price || "");

  useEffect(() => {
    if (layout.buildUp) setAreaForPsf(layout.buildUp);
  }, [layout.buildUp]);

  useEffect(() => {
    if (layout.price !== undefined) setPriceForPsf(layout.price);
  }, [layout.price]);

  // 统一更新：只往外抛「完整的 layout 对象」
  const updateLayout = (patch) => {
    const updated = { ...layout, ...patch };
    onChange && onChange(updated);
  };

  const handleFieldChange = (field, value) => {
    updateLayout({ [field]: value });
  };

  const handleLayoutUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newPhotos = [...(layout.layoutPhotos || []), ...files];
    handleFieldChange("layoutPhotos", newPhotos);
  };

    // ✅ 和 subsale 一样的 config 结构，用来生成对应的照片上传框
  // 🚫 注意：按照你的需求，这里故意不把 carpark 传进去（不生成车位照片分类）
  const config = {
    bedrooms: layout.bedrooms || "",
    bathrooms: layout.bathrooms || "",
    kitchens: layout.kitchens || "",
    livingRooms: layout.livingRooms || "",
    // carpark: 不传，让 ImageUpload 不生成车位相关分组
    extraSpaces: layout.extraSpaces || [],
    facilities: layout.facilities || [],
    furniture: layout.furniture || [],
    orientation: layout.facing || "",
    transit: layout.transit || null,
  };

  const psfText = getPsfText(areaForPsf, priceForPsf);

  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white">
      <h3 className="font-semibold mb-3">Layout {index + 1}</h3>

      {/* 上传 Layout 按钮 + 预览（户型图/平面图） */}
      <div className="mb-3">
        <button
          type="button"
          className="mb-3 px-3 py-2 bg-gray-100 border rounded hover:bg-gray-200 w-full"
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
        >
          点击上传 Layout 图纸
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
          images={layout.layoutPhotos || []}
          setImages={(updated) => handleFieldChange("layoutPhotos", updated)}
        />
      </div>

      {/* Type 名称 */}
      <input
        type="text"
        placeholder="输入 Type 名称"
        value={type}
        onChange={(e) => {
          setType(e.target.value);
          handleFieldChange("type", e.target.value);
        }}
        className="border p-2 rounded w-full mb-3"
      />

      {/* Property Category */}
      <div className="mb-3">
        <label className="block font-medium mb-1">Property Category</label>
        <select
          value={layout.propertyCategory || ""}
          onChange={(e) => {
            const cat = e.target.value;
            updateLayout({
              propertyCategory: cat,
              subType: "",
            });
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
      {layout.propertyCategory &&
        CATEGORY_OPTIONS[layout.propertyCategory] && (
          <div className="mb-3">
            <label className="block font-medium mb-1">Sub Type</label>
            <select
              value={layout.subType || ""}
              onChange={(e) => handleFieldChange("subType", e.target.value)}
              className="border p-2 rounded w-full"
            >
              <option value="">请选择具体类型</option>
              {CATEGORY_OPTIONS[layout.propertyCategory].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        )}

      {/* 这个房型有多少个单位？ */}
      <div className="mb-3">
        <label className="block font-medium mb-1">这个房型有多少个单位？</label>
        <input
          type="number"
          placeholder="例如：120"
          value={layout.unitCount || ""}
          onChange={(e) => handleFieldChange("unitCount", e.target.value)}
          className="border p-2 rounded w-full"
        />
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

      {/* 房间数量 */}
      <RoomCountSelector
        value={{
          bedrooms: layout.bedrooms || "",
          bathrooms: layout.bathrooms || "",
          kitchens: layout.kitchens || "",
          livingRooms: layout.livingRooms || "",
        }}
        onChange={(patch) => {
          updateLayout(patch);
        }}
      />

      {/* 停车位数量 */}
      <CarparkCountSelector
        value={layout.carpark}
        onChange={(val) => handleFieldChange("carpark", val)}
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
        onChange={(val) => handleFieldChange("extraSpaces", val)}
      />

      {/* 朝向 */}
      <FacingSelector
        value={layout.facing}
        onChange={(val) => handleFieldChange("facing", val)}
      />

      {/* 车位楼层 */}
      <CarparkLevelSelector
        value={layout.carparkPosition}
        onChange={(val) => handleFieldChange("carparkPosition", val)}
        mode="range"
      />

      {/* 家具 / 设施 */}
      <FurnitureSelector
        value={layout.furniture || []}
        onChange={(val) => handleFieldChange("furniture", val)}
      />

      <FacilitiesSelector
        value={layout.facilities || []}
        onChange={(val) => handleFieldChange("facilities", val)}
      />

      {/* 交通信息 */}
      <div className="mb-4">
        <label className="font-medium">交通信息</label>
        <TransitSelector
          onChange={(val) => {
            setTransitInfo(val);
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

      {/* ⭐ 最后：根据 config 生成对应卧室/浴室/车位等的照片上传框 */}
      <div className="mb-3">
        <label className="block mb-1 font-medium">上传此 Layout 的照片</label>
        <ImageUpload
          config={config}
          images={layout.photos || []}
          setImages={(updated) => handleFieldChange("photos", updated)}
        />
      </div>
    </div>
  );
}
