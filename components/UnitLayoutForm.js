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
import ImageUpload from "./ImageUpload";
import TransitSelector from "./TransitSelector";

// ================== Transit normalize ==================
function toBool(v) {
  if (v === true || v === false) return v;
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "yes" || s === "y" || s === "true" || s === "1") return true;
  if (s === "no" || s === "n" || s === "false" || s === "0") return false;
  return null;
}

// 给 TransitSelector 的 value：尽量使用对象 { walkable: boolean }
function normalizeTransitToSelector(val) {
  if (!val) return null;

  if (typeof val === "object") {
    if (typeof val.walkable === "boolean") return { walkable: val.walkable };
    if (typeof val.value !== "undefined") {
      const b = toBool(val.value);
      return b === null ? null : { walkable: b };
    }
  }

  const b = toBool(val);
  return b === null ? null : { walkable: b };
}

function normalizeTransitFromSelector(val) {
  if (!val) return null;

  if (typeof val === "object") {
    if (typeof val.walkable === "boolean") return { walkable: val.walkable };
    if (typeof val.value !== "undefined") {
      const b = toBool(val.value);
      return b === null ? null : { walkable: b };
    }
    if (typeof val.target?.value !== "undefined") {
      const b = toBool(val.target.value);
      return b === null ? null : { walkable: b };
    }
  }

  const b = toBool(val);
  return b === null ? null : { walkable: b };
}

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
    if (u.includes("acre")) return num * 43560;
    if (u.includes("hectare")) return num * 107639;
    return num; // 默认 sqft
  };

  const types = Array.isArray(area.types) ? area.types : [];
  const units = area.units || {};
  const values = area.values || {};

  let total = 0;
  types.forEach((t) => {
    total += convertToSqFt(values[t], units[t]);
  });

  return total;
}

/** 统一解析价格范围：支持单值 / 区间对象 / 字符串 */
function getPriceRange(priceValue) {
  let minPrice = 0;
  let maxPrice = 0;

  if (!priceValue) return { minPrice, maxPrice };

  if (typeof priceValue === "string") {
    const s = priceValue.trim();
    if (s.includes("~")) {
      const [minStr, maxStr] = s.split("~").map((x) => x.trim().replace(/,/g, ""));
      minPrice = Number(minStr) || 0;
      maxPrice = Number(maxStr) || 0;
    } else {
      const num = Number(s.replace(/,/g, "")) || 0;
      minPrice = num;
      maxPrice = num;
    }
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

  if (!lowPrice) return "";

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

// ================== 小工具 ==================
const formatNumber = (num) => {
  if (num === "" || num === undefined || num === null) return "";
  const str = String(num).replace(/,/g, "");
  if (str === "") return "";
  return Number(str).toLocaleString();
};
const parseNumber = (str) => String(str || "").replace(/,/g, "");

// 把各种类型（字符串 / 数字）统一转成正整数
function toCount(value) {
  if (value === undefined || value === null || value === "") return 0;
  const num = Number(String(value).replace(/,/g, "").trim());
  if (!Number.isFinite(num) || num <= 0) return 0;
  return Math.floor(num);
}

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

const parseSubtypeToArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return [String(val)];
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

  // 车位
  {
    const num = toCount(safe.carpark);
    for (let i = 1; i <= num; i++) labels.push(`车位${i}`);
  }

  // 额外空间
  {
    const arr = toArray(safe.extraSpaces);
    arr.forEach((extra) => {
      if (!extra) return;
      const name = getName(extra);
      if (!name) return;

      const count = toCount(extra.count || 1) || 1;
      if (count <= 1) labels.push(name);
      else for (let i = 1; i <= count; i++) labels.push(`${name}${i}`);
    });
  }

  // 家私
  {
    const arr = toArray(safe.furniture);
    arr.forEach((item) => {
      if (!item) return;
      const name = getName(item);
      if (!name) return;

      const count = toCount(item.count || 1) || 1;
      if (count <= 1) labels.push(name);
      else for (let i = 1; i <= count; i++) labels.push(`${name}${i}`);
    });
  }

  labels = [...new Set(labels)];
  if (!labels.length) labels.push("房源照片");
  return labels;
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

const SUBTYPE_OPTIONS = ["Penthouse", "Duplex", "Triplex", "Dual Key"];

const NEED_STOREYS_CATEGORY = new Set([
  "Bungalow / Villa",
  "Business Property",
  "Industrial Property",
  "Semi-Detached House",
  "Terrace / Link House",
]);

export default function UnitLayoutForm({
  index,
  data,
  onChange,

  // 项目（bulk rent）用到的锁定字段
  lockCategory = false,
  projectCategory = "",
  projectSubType = "",

  // New Project 同步/脱钩开关
  enableCommonCopy = false,
}) {
  const layout = data || {};
  const updateLayout = (patch, meta) => {
    const next = { ...layout, ...patch };
    onChange?.(next, meta);
  };

  // dropdown 控制
  const [showCategory, setShowCategory] = useState(false);
  const [showSubtype, setShowSubtype] = useState(false);

  const categoryRef = useRef(null);
  const subtypeRef = useRef(null);

  // 外部点击收起下拉
  useEffect(() => {
    const handler = (e) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target)) {
        setShowCategory(false);
      }
      if (subtypeRef.current && !subtypeRef.current.contains(e.target)) {
        setShowSubtype(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);

  // psf 文本
  const psfText = getPsfText(layout.area, {
    min: layout.priceLow,
    max: layout.priceHigh,
  });

  // 图片 label
  const photoLabels = getPhotoLabelsFromConfig({
    bedrooms: layout.bedrooms,
    bathrooms: layout.bathrooms,
    kitchens: layout.kitchens,
    livingRooms: layout.livingRooms,
    carpark: layout.carpark,
    extraSpaces: layout.extraSpaces,
    furniture: layout.furniture,
  });

  // transit value normalize
  const transitValue = normalizeTransitToSelector(layout.transit);

  return (
    <div className="w-full rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-white font-semibold">
          房型 / Layout {index + 1}
        </div>

        {enableCommonCopy && index > 0 && (
          <label className="text-white/80 text-sm flex items-center gap-2">
            <input
              type="checkbox"
              checked={layout._inheritCommon !== false}
              onChange={(e) => {
                updateLayout(
                  { _inheritCommon: e.target.checked },
                  { inheritToggle: true }
                );
              }}
            />
            同步 Layout1（额外空间/家私/设施/公共交通）
          </label>
        )}
      </div>

      {/* Category */}
      <div className="space-y-2" ref={categoryRef}>
        <div className="text-white/80 text-sm">Property Category</div>

        <button
          type="button"
          disabled={lockCategory}
          onClick={() => setShowCategory((v) => !v)}
          className="w-full text-left rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white"
        >
          {layout.propertyCategory || "请选择"}
        </button>

        {showCategory && !lockCategory && (
          <div className="mt-2 rounded-lg border border-white/10 bg-black/60 p-2 max-h-64 overflow-auto">
            {Object.keys(CATEGORY_OPTIONS).map((catKey) => (
              <div key={catKey} className="mb-2">
                <div className="text-white/60 text-xs px-2 py-1">{catKey}</div>
                {CATEGORY_OPTIONS[catKey].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      updateLayout({ propertyCategory: item, subType: "" });
                      setShowCategory(false);
                    }}
                    className="w-full text-left px-2 py-2 rounded hover:bg-white/10 text-white"
                  >
                    {item}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subtype */}
      <div className="space-y-2" ref={subtypeRef}>
        <div className="text-white/80 text-sm">Property Subtype（可多选）</div>

        <button
          type="button"
          disabled={lockCategory}
          onClick={() => setShowSubtype((v) => !v)}
          className="w-full text-left rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white"
        >
          {parseSubtypeToArray(layout.subType).length
            ? parseSubtypeToArray(layout.subType).join(", ")
            : "请选择"}
        </button>

        {showSubtype && !lockCategory && (
          <div className="mt-2 rounded-lg border border-white/10 bg-black/60 p-2">
            {SUBTYPE_OPTIONS.map((opt) => {
              const arr = parseSubtypeToArray(layout.subType);
              const checked = arr.includes(opt);

              return (
                <label
                  key={opt}
                  className="flex items-center gap-2 px-2 py-2 rounded hover:bg-white/10 text-white cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const nextArr = e.target.checked
                        ? [...arr, opt]
                        : arr.filter((x) => x !== opt);
                      updateLayout({ subType: nextArr });
                    }}
                  />
                  <span>{opt}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* 是否需要层数 */}
      {NEED_STOREYS_CATEGORY.has(layout.propertyCategory) && (
        <div className="space-y-1">
          <div className="text-white/80 text-sm">层数</div>
          <input
            className="w-full border rounded-lg p-2"
            value={layout.storeys || ""}
            onChange={(e) => updateLayout({ storeys: e.target.value })}
            placeholder="例如：2"
          />
        </div>
      )}

      {/* 面积 */}
      <AreaSelector
        initialValue={layout.area}
        onChange={(v) => updateLayout({ area: v })}
      />

      {/* 价格区间 */}
      <div className="space-y-1">
        <div className="text-white/80 text-sm">价格范围 (RM)</div>
        <div className="grid grid-cols-2 gap-2">
          <PriceInput
            value={layout.priceLow}
            placeholder="最低价"
            onChange={(v) => updateLayout({ priceLow: v })}
          />
          <PriceInput
            value={layout.priceHigh}
            placeholder="最高价"
            onChange={(v) => updateLayout({ priceHigh: v })}
          />
        </div>

        {psfText ? <div className="text-white/70 text-sm mt-2">{psfText}</div> : null}
      </div>

      {/* 房间/浴室/车位等 */}
      <RoomCountSelector
        value={{
          bedrooms: layout.bedrooms,
          bathrooms: layout.bathrooms,
          kitchens: layout.kitchens,
          livingRooms: layout.livingRooms,
        }}
        onChange={(patch) => updateLayout({ ...patch })}
      />

      <CarparkCountSelector
        value={layout.carpark}
        onChange={(v) => updateLayout({ carpark: v })}
        mode="range"
      />

      <CarparkLevelSelector
        value={layout.carparkPosition}
        onChange={(v) => updateLayout({ carparkPosition: v })}
        mode="range"
      />

      <ExtraSpacesSelector
        value={layout.extraSpaces}
        onChange={(v) =>
          updateLayout({ extraSpaces: v }, { commonField: "extraSpaces" })
        }
      />

      <FurnitureSelector
        value={layout.furniture}
        onChange={(v) =>
          updateLayout({ furniture: v }, { commonField: "furniture" })
        }
      />

      <FacilitiesSelector
        value={layout.facilities}
        onChange={(v) =>
          updateLayout({ facilities: v }, { commonField: "facilities" })
        }
      />

      <FacingSelector
        value={layout.facing}
        onChange={(v) => updateLayout({ facing: v })}
      />

      <BuildYearSelector
        value={layout.buildYear}
        onChange={(v) => updateLayout({ buildYear: v })}
      />

      <TransitSelector
        value={transitValue}
        onChange={(val) =>
          updateLayout(
            { transit: normalizeTransitFromSelector(val) },
            { commonField: "transit" }
          )
        }
      />

      <ImageUpload
        config={{
          ...photoConfigForLayout(layout),
          labels: photoLabels,
        }}
        images={layout.photos}
        setImages={(updated) => updateLayout({ photos: updated })}
      />
    </div>
  );
}

// 你原本可能有的 photoConfig helper（保持原样）
function photoConfigForLayout(layout) {
  return {
    bedrooms: layout.bedrooms || "",
    bathrooms: layout.bathrooms || "",
    kitchens: layout.kitchens || "",
    livingRooms: layout.livingRooms || "",
    carpark: layout.carpark || "",
    extraSpaces: layout.extraSpaces || [],
    facilities: layout.facilities || [],
    furniture: layout.furniture || [],
    orientation: layout.facing || "",
    transit: layout.transit || null,
  };
}
