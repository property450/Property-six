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

// ---------- Category / SubType 选项 ----------
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

// 布局里的 Property Subtype（跟 TypeSelector 一样）
// ✅ 按你的要求：只保留这四个，可多选
const SUBTYPE_OPTIONS = ["Penthouse", "Duplex", "Triplex", "Dual Key"];

// 哪些 Category 需要显示「有多少层」
const NEED_STOREYS_CATEGORY = new Set([
  "Bungalow / Villa",
  "Business Property",
  "Industrial Property",
  "Semi-Detached House",
  "Terrace / Link House",
]);

// ---------- 千分位 & 工具 ----------
const formatNumber = (num) => {
  if (num === "" || num === undefined || num === null) return "";
  const str = String(num).replace(/,/g, "");
  if (str === "") return "";
  return Number(str).toLocaleString();
};

const parseNumber = (str) => String(str || "").replace(/,/g, "");

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

// 根据 photoConfig 生成所有上传框的 label
function getPhotoLabelsFromConfig(config) {
  const safe = config || {};
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
    if (v) {
      if (typeof v === "number" || typeof v === "string") {
        const num = toCount(v);
        if (num > 0) labels.push("停车位");
      }
      if (typeof v === "object" && !Array.isArray(v)) {
        const min = toCount(v.min);
        const max = toCount(v.max);
        if (min > 0 || max > 0) labels.push("停车位");
      }
    }
  }

  // 储藏室
  {
    const num = toCount(safe.store);
    for (let i = 1; i <= num; i++) labels.push(`储藏室${i}`);
  }

  // ✅ 朝向：统一加前缀「朝向：」
  {
    const arr = toArray(safe.orientation);
    arr.forEach((item) => {
      const n = getName(item);
      if (!n) return;
      labels.push(`朝向：${n}`);
    });
  }

  // ✅ 设施：统一加前缀「设施：」
  {
    const arr = toArray(safe.facilities);
    arr.forEach((item) => {
      const n = getName(item);
      if (!n) return;
      labels.push(`设施：${n}`);
    });
  }

  // ✅ 额外空间：统一加前缀「额外空间：」
  {
    const arr = toArray(safe.extraSpaces);
    arr.forEach((extra) => {
      if (!extra) return;
      const name = getName(extra);
      if (!name) return;

      const count = toCount(extra.count || 1) || 1;
      if (count <= 1) {
        labels.push(`额外空间：${name}`);
      } else {
        for (let i = 1; i <= count; i++) {
          labels.push(`额外空间：${name}${i}`);
        }
      }
    });
  }

  // ✅ 家私：统一加前缀「家私：」
  {
    const arr = toArray(safe.furniture);
    arr.forEach((item) => {
      if (!item) return;
      const name = getName(item);
      if (!name) return;

      const count = toCount(item.count || 1) || 1;
      if (count <= 1) {
        labels.push(`家私：${name}`);
      } else {
        for (let i = 1; i <= count; i++) {
          labels.push(`家私：${name}${i}`);
        }
      }
    });
  }

  labels = [...new Set(labels)];
  if (!labels.length) labels.push("房源照片");

  return labels;
}

// ================================
// 组件主体
// ================================
export default function UnitLayoutForm({ index, data, onChange }) {
  const layout = data || {};
  const fileInputRef = useRef(null);

  const projectType = layout.projectType; // UploadProperty 里已经传进来了
  const rentMode = layout.rentMode; // "Sale" / "Rent" 之类

  const isNewProject = projectType === "New Project / Under Construction";
  const isCompletedProject = projectType === "Completed Unit / Developer Unit";

  // 只有 Sale 的项目，需要显示年份；Rent / Homestay / Hotel 都不要
  const showBuildYear =
    rentMode === "Sale" && (isNewProject || isCompletedProject);

  // ⭐ 批量 Rent 的 Layout
  const isBulkRent = layout.rentMode === "Rent";

  // Category / SubType / SubtypeExtra / 层数
  const [category, setCategory] = useState(layout.propertyCategory || "");
  const [subType, setSubType] = useState(layout.subType || "");
  // ✅ propertySubtype 改成数组形式存状态，写回去时用逗号拼接
  const [propertySubtype, setPropertySubtype] = useState(() => {
    const raw = layout.propertySubtype;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    return String(raw)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  });
  const [showSubtype, setShowSubtype] = useState(false);
  const [storeys, setStoreys] = useState(layout.storeys || "");

  // 房型单位数量
  const [unitCountLocal, setUnitCountLocal] = useState(
    layout.unitCount ? String(layout.unitCount) : ""
  );
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);
  const unitCountRef = useRef(null);

  // PSF 相关
  const [areaForPsf, setAreaForPsf] = useState(layout.buildUp || {});
  const [priceForPsf, setPriceForPsf] = useState(
    layout.price !== undefined ? layout.price : ""
  );

  // 照片上传配置
  const [photoConfig, setPhotoConfig] = useState({
    bedrooms: layout.bedrooms || "",
    bathrooms: layout.bathrooms || "",
    kitchens: layout.kitchens || "",
    livingRooms: layout.livingRooms || "",
    carpark: layout.carpark || "",
    store: layout.store || "",
    extraSpaces: layout.extraSpaces || [],
    furniture: layout.furniture || [],
    facilities: layout.facilities || [],
    orientation: layout.facing || [],
  });

  // layout.photos 里按 label 存图片
  const photosByLabel = layout.photos || {};

  // 同步外部传入的变化
  useEffect(() => {
    setCategory(layout.propertyCategory || "");
    setSubType(layout.subType || "");
    const rawSubtype = layout.propertySubtype;
    if (!rawSubtype) {
      setPropertySubtype([]);
    } else if (Array.isArray(rawSubtype)) {
      setPropertySubtype(rawSubtype);
    } else {
      setPropertySubtype(
        String(rawSubtype)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      );
    }
    setStoreys(layout.storeys || "");
    setUnitCountLocal(layout.unitCount ? String(layout.unitCount) : "");
  }, [
    layout.propertyCategory,
    layout.subType,
    layout.propertySubtype,
    layout.storeys,
    layout.unitCount,
  ]);

  // Apartment / Business 时显示 propertySubtype
  useEffect(() => {
    const shouldShow =
      category === "Apartment / Condo / Service Residence" ||
      category === "Business Property";
    setShowSubtype(shouldShow);
  }, [category]);

  // 点击外面关闭 “这个房型有多少个单位？” 下拉
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (unitCountRef.current && !unitCountRef.current.contains(e.target)) {
        setUnitDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 更新 layout
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

  // 照片上传
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

  // ✅ Rent 👉 Business Property 👉 不是，要分开出租（批量租）
  const isRentBusinessSplit = rentMode === "Rent" && category === "Business Property";
  const hideCategoryAndSubtypeInLayout = isRentBusinessSplit;

  // ✅ 图片上传 label：在 Rent 👉 Business Property 👉 分开出租 时，
  // 每个类别只要一个上传框，不根据数量拆很多
  const uploadLabels = (() => {
    if (isRentBusinessSplit) {
      const simplifiedConfig = {
        ...photoConfig,
        bedrooms: photoConfig.bedrooms ? 1 : "",
        bathrooms: photoConfig.bathrooms ? 1 : "",
        kitchens: photoConfig.kitchens ? 1 : "",
        livingRooms: photoConfig.livingRooms ? 1 : "",
        carpark: photoConfig.carpark ? 1 : "",
        store: photoConfig.store ? 1 : "",
        extraSpaces: (photoConfig.extraSpaces || []).map((extra) => ({
          ...extra,
          count: 1,
        })),
        furniture: (photoConfig.furniture || []).map((item) => ({
          ...item,
          count: 1,
        })),
      };
      return getPhotoLabelsFromConfig(simplifiedConfig);
    }
    return getPhotoLabelsFromConfig(photoConfig);
  })();

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

      {/* Property Category：Rent + Business 分开出租时不在 Layout 里显示 */}
      {!hideCategoryAndSubtypeInLayout && (
        <div className="mb-3">
          <label className="block font-medium mb-1">Property Category</label>
          <select
            value={category}
            onChange={(e) => {
              const cat = e.target.value;
              setCategory(cat);
              setSubType("");
              setPropertySubtype([]);
              setStoreys("");
              updateLayout({
                propertyCategory: cat,
                subType: "",
                propertySubtype: "",
                storeys: "",
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
      )}

      {/* Sub Type + 层数 + Property Subtype */}
      {category && CATEGORY_OPTIONS[category] && (
        <>
          {/* Sub Type：Rent + Business 分开出租时不在 Layout 里显示 */}
          {!hideCategoryAndSubtypeInLayout && (
            <div className="mb-3">
              <label className="block font-medium mb-1">Sub Type</label>
              <select
                value={subType}
                onChange={(e) => {
                  const val = e.target.value;
                  setSubType(val);
                  handleFieldChange("subType", val);
                }}
                className="border p-2 rounded w-full"
              >
                <option value="">请选择具体类型</option>
                {CATEGORY_OPTIONS[category].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 层数：Rent 👉 Business Property 👉 分开出租 时，label 改成「这个单位在第几层？」 */}
          {NEED_STOREYS_CATEGORY.has(category) && (
            <div className="mb-3">
              <FloorCountSelector
                value={storeys}
                onChange={(val) => {
                  setStoreys(val);
                  handleFieldChange("storeys", val);
                }}
                label={
                  isRentBusinessSplit ? "这个单位在第几层？" : undefined
                }
              />
            </div>
          )}

          {/* Property Subtype：改成可多选 tag */}
          {showSubtype && (
            <div className="mb-3">
              <label className="block font-medium mb-1">
                Property Subtype（可多选）
              </label>
              <div className="flex flex-wrap gap-2">
                {SUBTYPE_OPTIONS.map((opt) => {
                  const selected = propertySubtype.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setPropertySubtype((prev) => {
                          const exists = prev.includes(opt);
                          const next = exists
                            ? prev.filter((item) => item !== opt)
                            : [...prev, opt];
                          handleFieldChange("propertySubtype", next.join(","));
                          return next;
                        });
                      }}
                      className={`px-3 py-1 rounded border text-sm ${
                        selected
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-700 border-gray-300"
                      }`}
                    >
                      {opt}
                      {selected && <span className="ml-1">✅</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* 这个房型有多少个单位？ */}
      <div className="mb-3" ref={unitCountRef}>
        <label className="block font-medium mb-1">
          这个房型有多少个单位？
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="例如：120"
            value={formatNumber(unitCountLocal)}
            onChange={(e) => {
              const raw = parseNumber(e.target.value);
              if (!/^\d*$/.test(raw)) return;
              setUnitCountLocal(raw);
              handleFieldChange("unitCount", raw);
            }}
            onFocus={() => setUnitDropdownOpen(true)}
            onClick={() => setUnitDropdownOpen(true)}
            className="border p-2 rounded w-full"
          />

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
        // ⭐ 批量 Rent 的 Layout 使用 Rent 的价格模式（500~1,000,000，单一价格）
        listingMode={isBulkRent ? "Rent" : undefined}
        // ⭐ 不把 projectType 传给 PriceInput，让它不要走 New Project 的「价格范围」逻辑
        type={isBulkRent ? undefined : layout.projectType}
      />

      {/* 每平方英尺 */}
      {psfText && <p className="text-sm text-gray-600 mt-1">{psfText}</p>}

      {/* 房间数量 */}
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
      {showBuildYear && (
        <BuildYearSelector
          value={layout.buildYear}
          onChange={(val) => updateLayout({ buildYear: val })}
          quarter={layout.quarter}
          onQuarterChange={(val) => updateLayout({ quarter: val })}
          showQuarter={isNewProject} // 新项目才显示季度
          label={isNewProject ? "预计交付时间" : "完成年份"}
        />
      )}

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

      {/* 上传此 Layout 的照片 */}
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
