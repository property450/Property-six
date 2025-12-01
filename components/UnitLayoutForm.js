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

// 工具函数：数字、数组、名字
const toCount = (value) => {
  if (value === undefined || value === null || value === "") return 0;
  const num = Number(String(value).replace(/,/g, "").trim());
  if (!Number.isFinite(num) || num <= 0) return 0;
  return Math.floor(num);
};

const toArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return [val];
};

const getName = (item) => {
  if (!item) return "";
  if (typeof item === "string") return item;
  return item.label || item.value || item.name || "";
};

// 从 layout 生成「要显示哪些上传框」
function getPhotoLabelsFromLayout(layout, roomCounts) {
  const safe = {
    bedrooms: layout.bedrooms ?? roomCounts.bedrooms ?? "",
    bathrooms: layout.bathrooms ?? roomCounts.bathrooms ?? "",
    kitchens: layout.kitchens ?? roomCounts.kitchens ?? "",
    livingRooms: layout.livingRooms ?? roomCounts.livingRooms ?? "",
    carpark: layout.carpark,
    store: layout.store,
    extraSpaces: layout.extraSpaces || [],
    furniture: layout.furniture || [],
    facilities: layout.facilities || [],
    orientation: layout.facing || [],
  };

  let labels = [];

  // 卧室
  if (safe.bedrooms) {
    const raw = String(safe.bedrooms).trim().toLowerCase();
    if (raw === "studio") {
      labels.push("Studio");
    } else {
      const num = toCount(safe.bedrooms);
      for (let i = 1; i <= num; i++) labels.push(`卧室${i}`);
    }
  }

  // 浴室
  {
    const num = toCount(safe.bathrooms);
    for (let i = 1; i <= num; i++) labels.push(`浴室${i}`);
  }

  // 厨房
  {
    const num = toCount(safe.kitchens);
    for (let i = 1; i <= num; i++) labels.push(`厨房${i}`);
  }

  // 客厅
  {
    const num = toCount(safe.livingRooms);
    for (let i = 1; i <= num; i++) labels.push(`客厅${i}`);
  }

  // 停车位
  {
    const v = safe.carpark;
    let added = false;
    if (v) {
      if (typeof v === "number" || typeof v === "string") {
        const num = toCount(v);
        if (num > 0) {
          labels.push("停车位");
          added = true;
        }
      }
      if (!added && typeof v === "object" && !Array.isArray(v)) {
        const min = toCount(v.min);
        const max = toCount(v.max);
        if (min > 0 || max > 0) {
          labels.push("停车位");
          added = true;
        }
      }
    }
    if (!added && v !== undefined && v !== null && v !== "") {
      labels.push("停车位");
    }
  }

  // 储藏室
  {
    const num = toCount(safe.store);
    for (let i = 1; i <= num; i++) labels.push(`储藏室${i}`);
  }

  // 朝向
  {
    const arr = toArray(safe.orientation);
    arr.forEach((item) => {
      const name = getName(item);
      if (name) labels.push(`朝向：${name}`);
    });
  }

  // 设施
  {
    const arr = toArray(safe.facilities);
    arr.forEach((item) => {
      const name = getName(item);
      if (name) labels.push(`设施：${name}`);
    });
  }

  // 额外空间
  {
    const arr = toArray(safe.extraSpaces);
    arr.forEach((extra) => {
      if (!extra) return;
      if (typeof extra === "string") {
        labels.push(`额外空间：${extra}`);
        return;
      }
      const name = getName(extra);
      if (!name) return;
      const c = toCount(extra.count || 1) || 1;
      if (c <= 1) {
        labels.push(`额外空间：${name}`);
      } else {
        for (let i = 1; i <= c; i++) {
          labels.push(`额外空间：${name}${i}`);
        }
      }
    });
  }

  // 家私
  {
    const arr = toArray(safe.furniture);
    arr.forEach((item) => {
      if (!item) return;
      if (typeof item === "string") {
        labels.push(`家私：${item}`);
        return;
      }
      const name = getName(item);
      if (!name) return;
      const c = toCount(item.count || 1) || 1;
      if (c <= 1) {
        labels.push(`家私：${name}`);
      } else {
        for (let i = 1; i <= c; i++) {
          labels.push(`家私：${name}${i}`);
        }
      }
    });
  }

  // 去重
  labels = [...new Set(labels)];
  if (!labels.length) labels.push("房源照片");

  return labels;
}

export default function UnitLayoutForm({ index, data, onChange }) {
  const layout = data || {};

  // 房间数量本地 state
  const [roomCounts, setRoomCounts] = useState(() => ({
    bedrooms: data?.bedrooms || "",
    bathrooms: data?.bathrooms || "",
    kitchens: data?.kitchens || "",
    livingRooms: data?.livingRooms || "",
  }));

  const fileInputRef = useRef(null);

  const [areaForPsf, setAreaForPsf] = useState(layout.buildUp || {});
  const [priceForPsf, setPriceForPsf] = useState(
    layout.price !== undefined ? layout.price : ""
  );

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

  // ------- 照片上传逻辑：把图片存在 layout.photos 里 ----------
  const photosByLabel = layout.photos || {};

  const handlePhotoChange = (e, label) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newImages = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      isCover: false,
    }));

    const current = photosByLabel[label] || [];
    const updatedPhotos = {
      ...photosByLabel,
      [label]: [...current, ...newImages],
    };

    updateLayout({ photos: updatedPhotos });
  };

  const removePhoto = (label, index) => {
    const current = photosByLabel[label] || [];
    const updatedPhotos = {
      ...photosByLabel,
      [label]: current.filter((_, i) => i !== index),
    };
    updateLayout({ photos: updatedPhotos });
  };

  const setCover = (label, index) => {
    const current = photosByLabel[label] || [];
    const updatedPhotos = {
      ...photosByLabel,
      [label]: current.map((img, i) => ({
        ...img,
        isCover: i === index,
      })),
    };
    updateLayout({ photos: updatedPhotos });
  };

  const psfText = getPsfText(areaForPsf, priceForPsf);

  // 根据 layout + roomCounts 生成所有要显示的上传框标签
  const uploadLabels = getPhotoLabelsFromLayout(layout, roomCounts);

  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white">
      <h3 className="font-semibold mb-3">Layout {index + 1}</h3>

      {/* 上传 Layout 图纸 */}
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
      </div>

      {/* Type 名称 */}
      <input
        type="text"
        placeholder="输入 Type 名称"
        value={layout.type || ""}
        onChange={(e) => handleFieldChange("type", e.target.value)}
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
        value={roomCounts}
        onChange={(patch) => {
          setRoomCounts((prev) => ({ ...prev, ...patch }));
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

      {/* ⭐ 这里直接生成所有「对应的上传框」 */}
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
