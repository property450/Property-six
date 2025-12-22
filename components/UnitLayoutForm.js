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

/** 鎶� AreaSelector 杩斿洖鐨勫璞★紝杞崲鎴愩€屾€诲钩鏂硅嫳灏恒€� */
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
    return num; // 榛樿 sqft
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

/** 浠� price 瀛楁瑙ｆ瀽鍑� min / max */
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

/** 鐢熸垚銆屾瘡骞虫柟鑻卞昂 RM xxx.xx ~ RM yyy.yy銆� */
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
    return `姣忓钩鏂硅嫳灏�: RM ${lowPsf.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })}`;
  }

  return `姣忓钩鏂硅嫳灏�: RM ${lowPsf.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })} ~ RM ${highPsf.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}`;
}

// ---------- Category / SubType 閫夐」 ----------
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

// 甯冨眬閲岀殑 Property Subtype锛堝閫夛級
const SUBTYPE_OPTIONS = ["Penthouse", "Duplex", "Triplex", "Dual Key"];

// 鍝簺 Category 闇€瑕佹樉绀恒€屾湁澶氬皯灞傘€�
const NEED_STOREYS_CATEGORY = new Set([
  "Bungalow / Villa",
  "Business Property",
  "Industrial Property",
  "Semi-Detached House",
  "Terrace / Link House",
]);

// 鍝簺瀛楁灞炰簬鈥滄瘝鐗堝彲澶嶅埗瀛楁鈥�
const COMMON_FIELDS = new Set([
  "extraSpaces",
  "furniture",
  "facilities",
  "transit",
]);


// ---------- 宸ュ叿 ----------
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

// 鎶� propertySubtype 杞垚銆屾暟缁勩€嶏紝鍏煎浠ュ墠鏄瓧绗︿覆鐨勬儏鍐�
const parseSubtypeToArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return [String(val)];
};

// 鏍规嵁 photoConfig 鐢熸垚鎵€鏈変笂浼犳鐨� label
function getPhotoLabelsFromConfig(config) {
  const safe = config || {};
  let labels = [];

  // 鍗у
  if (safe.bedrooms) {
    const raw = String(safe.bedrooms).trim().toLowerCase();
    if (raw === "studio") {
      labels.push("Studio");
    } else {
      const num = toCount(safe.bedrooms);
      for (let i = 1; i <= num; i++) labels.push(`鍗у${i}`);
    }
  }

  // 娴村
  {
    const num = toCount(safe.bathrooms);
    for (let i = 1; i <= num; i++) labels.push(`娴村${i}`);
  }

  // 鍘ㄦ埧
  {
    const num = toCount(safe.kitchens);
    for (let i = 1; i <= num; i++) labels.push(`鍘ㄦ埧${i}`);
  }

  // 瀹㈠巺
  {
    const num = toCount(safe.livingRooms);
    for (let i = 1; i <= num; i++) labels.push(`瀹㈠巺${i}`);
  }

  // 鍋滆溅浣�
  {
    const v = safe.carpark;
    if (v) {
      if (typeof v === "number" || typeof v === "string") {
        const num = toCount(v);
        if (num > 0) labels.push("鍋滆溅浣�");
      }
      if (typeof v === "object" && !Array.isArray(v)) {
        const min = toCount(v.min);
        const max = toCount(v.max);
        if (min > 0 || max > 0) labels.push("鍋滆溅浣�");
      }
    }
  }

  // 鍌ㄨ棌瀹�
  {
    const num = toCount(safe.store);
    for (let i = 1; i <= num; i++) labels.push(`鍌ㄨ棌瀹�${i}`);
  }

  // 鏈濆悜
  {
    const arr = toArray(safe.orientation);
    arr.forEach((item) => {
      const n = getName(item);
      if (n) labels.push(n);
    });
  }

  // 璁炬柦
  {
    const arr = toArray(safe.facilities);
    arr.forEach((item) => {
      const n = getName(item);
      if (n) labels.push(n);
    });
  }

  // 棰濆绌洪棿
  {
    const arr = toArray(safe.extraSpaces);
    arr.forEach((extra) => {
      if (!extra) return;
      const name = getName(extra);
      if (!name) return;

      const count = toCount(extra.count || 1) || 1;
      if (count <= 1) {
        labels.push(name);
      } else {
        for (let i = 1; i <= count; i++) labels.push(`${name}${i}`);
      }
    });
  }

  // 瀹剁
  {
    const arr = toArray(safe.furniture);
    arr.forEach((item) => {
      if (!item) return;
      const name = getName(item);
      if (!name) return;

      const count = toCount(item.count || 1) || 1;
      if (count <= 1) {
        labels.push(name);
      } else {
        for (let i = 1; i <= count; i++) labels.push(`${name}${i}`);
      }
    });
  }

  labels = [...new Set(labels)];
  if (!labels.length) labels.push("鎴挎簮鐓х墖");

  return labels;
}

// ================================
// 缁勪欢涓讳綋
// ================================
export default function UnitLayoutForm({
  index,
  data,
  onChange,
  projectCategory,
  projectSubType,
  lockCategory = false,
}) {
  const layout = data || {};
  const fileInputRef = useRef(null);

  const projectType = layout.projectType; // UploadProperty 閲屽凡缁忎紶杩涙潵浜�
  const rentMode = layout.rentMode; // "Sale" / "Rent" 涔嬬被

  const isNewProject = projectType === "New Project / Under Construction";
  const isCompletedProject =
    projectType === "Completed Unit / Developer Unit";

  // 鍙湁 Sale 鐨勯」鐩紝闇€瑕佹樉绀哄勾浠斤紱Rent / Homestay / Hotel 閮戒笉瑕�
  const showBuildYear =
    rentMode === "Sale" && (isNewProject || isCompletedProject);

  // 猸� 鎵归噺 Rent 鐨� Layout
  const isBulkRent = layout.rentMode === "Rent";

  // Category / SubType / SubtypeExtra / 灞傛暟
  const [category, setCategory] = useState(
    lockCategory
      ? projectCategory || layout.propertyCategory || ""
      : layout.propertyCategory || ""
  );
  const [subType, setSubType] = useState(
    lockCategory ? projectSubType || layout.subType || "" : layout.subType || ""
  );

  // propertySubtype 澶氶€夋暟缁�
  const [propertySubtype, setPropertySubtype] = useState(
    parseSubtypeToArray(layout.propertySubtype)
  );

  const [showSubtype, setShowSubtype] = useState(false);
  const [storeys, setStoreys] = useState(layout.storeys || "");

  // Property Subtype 涓嬫媺寮€鍏�
  const [subtypeOpen, setSubtypeOpen] = useState(false);
  const subtypeRef = useRef(null);

  // 鎴垮瀷鍗曚綅鏁伴噺
  const [unitCountLocal, setUnitCountLocal] = useState(
    layout.unitCount ? String(layout.unitCount) : ""
  );
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);
  const unitCountRef = useRef(null);

  // PSF 鐩稿叧
  const [areaForPsf, setAreaForPsf] = useState(layout.buildUp || {});
  const [priceForPsf, setPriceForPsf] = useState(
    layout.price !== undefined ? layout.price : ""
  );

  // 鐓х墖涓婁紶閰嶇疆
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

  // layout.photos 閲屾寜 label 瀛樺浘鐗�
  const photosByLabel = layout.photos || {};

  // 鍚屾澶栭儴浼犲叆鐨勫彉鍖栵紙鍖呮嫭 projectCategory / projectSubType锛�
  useEffect(() => {
    const cat = lockCategory
      ? projectCategory || layout.propertyCategory || ""
      : layout.propertyCategory || "";
    const sub = lockCategory
      ? projectSubType || layout.subType || ""
      : layout.subType || "";

    setCategory(cat);
    setSubType(sub);
    setPropertySubtype(parseSubtypeToArray(layout.propertySubtype));
    setStoreys(layout.storeys || "");
    setUnitCountLocal(layout.unitCount ? String(layout.unitCount) : "");

    // 鉁� 鍏抽敭锛氬悓姝ュ閮� layout 鏀瑰姩锛堣銆屽鍒躲€嶅悗鐨勫€艰兘鍦� UI 閲岀珛鍒绘樉绀猴級
    setAreaForPsf(layout.buildUp || {});
    setPriceForPsf(layout.price !== undefined ? layout.price : "");
    setPhotoConfig({
      bedrooms: layout.bedrooms || "",
      bathrooms: layout.bathrooms || "",
      kitchens: layout.kitchens || "",
      livingRooms: layout.livingRooms || "",
      carpark: layout.carpark || "",
      store: layout.store || "",
      extraSpaces: layout.extraSpaces || [],
      furniture: layout.furniture || [],
      facilities: layout.facilities || [],
      orientation: layout.facing || "",
    });
  }, [
    lockCategory,
    projectCategory,
    projectSubType,
    layout.propertyCategory,
    layout.subType,
    layout.propertySubtype,
    layout.storeys,
    layout.unitCount,

    // 鉁� 鍚屾 UI 鎵€闇€瀛楁
    layout.buildUp,
    layout.price,
    layout.bedrooms,
    layout.bathrooms,
    layout.kitchens,
    layout.livingRooms,
    layout.carpark,
    layout.store,
    layout.extraSpaces,
    layout.furniture,
    layout.facilities,
    layout.facing,
  ]);

  // Apartment / Business 鏃舵樉绀� propertySubtype
  // Apartment / Business / Industrial 鏃舵樉绀� propertySubtype
useEffect(() => {
  const shouldShow =
    category === "Apartment / Condo / Service Residence" ||
    category === "Business Property" ||
    category === "Industrial Property";
  setShowSubtype(shouldShow);
}, [category]);

  // 鐐瑰嚮澶栭潰鍏抽棴涓や釜涓嬫媺锛氬崟浣嶆暟閲� & Property Subtype
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (unitCountRef.current && !unitCountRef.current.contains(e.target)) {
        setUnitDropdownOpen(false);
      }
      if (subtypeRef.current && !subtypeRef.current.contains(e.target)) {
        setSubtypeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 鏇存柊 layout
  const updateLayout = (patch, meta = {}) => {
  const updated = { ...layout, ...patch };
  onChange && onChange(updated, meta);
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

  // 鐓х墖涓婁紶
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

  // 鐢熸垚鎵€鏈変笂浼犳 label
  const uploadLabels = getPhotoLabelsFromConfig(photoConfig);

  // 鍒囨崲 Property Subtype 澶氶€�
  const toggleSubtype = (item) => {
    let next = [];
    if (propertySubtype.includes(item)) {
      next = propertySubtype.filter((v) => v !== item);
    } else {
      next = [...propertySubtype, item];
    }
    setPropertySubtype(next);
    handleFieldChange("propertySubtype", next);
  };

  // 鏄剧ず鍦ㄣ€岃緭鍏ユ銆嶉噷鐨勬枃瀛�
  const subtypeDisplayText =
    propertySubtype.length === 0
      ? "璇烽€夋嫨 subtype锛堝彲澶氶€夛級"
      : propertySubtype.map((v) => `${v} 鉁卄).join("锛�");

  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white">
      <h3 className="font-semibold mb-3">Layout {index + 1}</h3>

      {/* 涓婁紶 Layout 鍥剧焊 */}
      <div className="mb-3">
        <button
          type="button"
          className="mb-3 px-3 py-2 bg-gray-100 border rounded hover:bg-gray-200 w-full"
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
        >
          鐐瑰嚮涓婁紶 Layout 鍥剧焊
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

      {/* Type 鍚嶇О */}
      <input
        type="text"
        placeholder="杈撳叆 Type 鍚嶇О"
        value={layout.type || ""}
        onChange={(e) => handleFieldChange("type", e.target.value)}
        className="border p-2 rounded w-full mb-3"
      />

      {/* Property Category锛堝崟涓� layout锛夆€斺€旀壒閲忛」鐩椂闅愯棌 */}
      {!lockCategory && (
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
                propertySubtype: [],
                storeys: "",
              });
            }}
            className="border p-2 rounded w-full"
          >
            <option value="">璇烽€夋嫨绫诲埆</option>
            {Object.keys(CATEGORY_OPTIONS).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Sub Type + 灞傛暟 + Property Subtype */}
      {category && CATEGORY_OPTIONS[category] && (
        <>
          {/* Sub Type鈥斺€旀壒閲忛」鐩椂涓嶅湪杩欓噷閫� */}
          {!lockCategory && (
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
                <option value="">璇烽€夋嫨鍏蜂綋绫诲瀷</option>
                {CATEGORY_OPTIONS[category].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          )}

          {NEED_STOREYS_CATEGORY.has(category) && (
            <div className="mb-3">
              <FloorCountSelector
                value={storeys}
                onChange={(val) => {
                  setStoreys(val);
                  handleFieldChange("storeys", val);
                }}
              />
            </div>
          )}

          {showSubtype && (
            <div className="mb-3 relative" ref={subtypeRef}>
              <label className="block font-medium mb-1">
                Property Subtype
              </label>

              {/* 鏄剧ず鍖哄煙锛堢偣鍑绘墦寮€涓嬫媺锛� */}
              <div
                className="border p-2 rounded w-full bg-white cursor-pointer"
                onClick={() => setSubtypeOpen((prev) => !prev)}
              >
                {propertySubtype.length === 0 ? (
                  <span className="text-gray-400">
                    璇烽€夋嫨 subtype锛堝彲澶氶€夛級
                  </span>
                ) : (
                  <span className="font-medium">{subtypeDisplayText}</span>
                )}
              </div>

              {/* 涓嬫媺澶氶€夎彍鍗� */}
              {subtypeOpen && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-auto">
                  {SUBTYPE_OPTIONS.map((opt) => {
                    const selected = propertySubtype.includes(opt);
                    return (
                      <div
                        key={opt}
                        className={`px-3 py-2 flex justify-between items-center cursor-pointer hover:bg-gray-100 ${
                          selected ? "bg-gray-50 font-semibold" : ""
                        }`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          toggleSubtype(opt);
                        }}
                      >
                        <span>{opt}</span>
                        {selected && (
                          <span className="text-green-600">鉁�</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* 杩欎釜鎴垮瀷鏈夊灏戜釜鍗曚綅锛� */}
      <div className="mb-3" ref={unitCountRef}>
        <label className="block font-medium mb-1">杩欎釜鎴垮瀷鏈夊灏戜釜鍗曚綅锛�</label>
        <div className="relative">
          <input
            type="text"
            placeholder="渚嬪锛�120"
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
                浠� 1 ~ 1,000 涓€夋嫨锛屾垨鐩存帴杈撳叆
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

      {/* 闈㈢Н */}
      <AreaSelector
        initialValue={areaForPsf || {}}
        onChange={(val) => {
          setAreaForPsf(val);
          handleFieldChange("buildUp", val);
        }}
      />

{/* 浠锋牸 */}
      <PriceInput
        value={priceForPsf}
        onChange={(val) => {
          setPriceForPsf(val);
          handleFieldChange("price", val);
        }}
        listingMode={isBulkRent ? "Rent" : undefined}
        type={isBulkRent ? undefined : layout.projectType}
      />

      {/* 姣忓钩鏂硅嫳灏� */}
      {psfText && <p className="text-sm text-gray-600 mt-1">{psfText}</p>}

      {/* 鎴块棿鏁伴噺 */}
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

      {/* 鍋滆溅浣嶆暟閲� */}
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

{/* 棰濆绌洪棿 */}
      <ExtraSpacesSelector
  value={photoConfig.extraSpaces}
  onChange={(val) => {
    setPhotoConfig((prev) => ({ ...prev, extraSpaces: val }));
    updateLayout(
      { extraSpaces: val },
      { commonField: "extraSpaces" }
    );
  }}
/>


      {/* 鏈濆悜 */}
      <FacingSelector
        value={photoConfig.orientation}
        onChange={(val) => {
          setPhotoConfig((prev) => ({ ...prev, orientation: val }));
          handleFieldChange("facing", val);
        }}
      />

      {/* 杞︿綅妤煎眰 */}
      <CarparkLevelSelector
      value={layout.carparkPosition}
        onChange={(val) => handleFieldChange("carparkPosition", val)}
        mode="range"
      />

      {/* 瀹跺叿 / 璁炬柦 */}
      <FurnitureSelector
  value={photoConfig.furniture}
  onChange={(val) => {
    setPhotoConfig((prev) => ({ ...prev, furniture: val }));
    updateLayout(
      { furniture: val },
      { commonField: "furniture" }
    );
  }}
/>

      <FacilitiesSelector
  value={photoConfig.facilities}
  onChange={(val) => {
    setPhotoConfig((prev) => ({ ...prev, facilities: val }));
    updateLayout(
      { facilities: val },
      { commonField: "facilities" }
    );
  }}
/>

          {/* 浜ら€氫俊鎭紙姣忎釜 layout 鑷繁鐨勶級 */}
      <div className="mb-4">
        <label className="font-medium">浜ら€氫俊鎭�</label>
        <TransitSelector
  value={layout.transit || null}
  onChange={(val) => {
    updateLayout(
      { transit: val },
      { commonField: "transit" }
    );
  }}
/>

      {/* 寤烘垚骞翠唤 + 瀛ｅ害 */}
      {showBuildYear && (
        <BuildYearSelector
          value={layout.buildYear}
          onChange={(val) => updateLayout({ buildYear: val })}
          quarter={layout.quarter}
          onQuarterChange={(val) => updateLayout({ quarter: val })}
          showQuarter={isNewProject} // 鏂伴」鐩墠鏄剧ず瀛ｅ害
          label={isNewProject ? "棰勮浜や粯鏃堕棿" : "瀹屾垚骞翠唤"}
        />
      )}

{/* 姣忎釜 Layout 鑷繁鐨勬埧婧愭弿杩� */}
      <div className="mt-3 mb-3">
        <label className="block font-medium mb-1">鎴挎簮鎻忚堪</label>
        <textarea
          value={layout.description || ""}
          onChange={(e) => handleFieldChange("description", e.target.value)}
          placeholder="璇疯緭鍏ヨ繖涓埧鍨嬬殑璇︾粏鎻忚堪..."
          rows={3}
          className="w-full border rounded-lg p-2 resize-y"
        />
      </div>

      {/* 涓婁紶姝� Layout 鐨勭収鐗� */}
      <div className="mb-3">
        <label className="block mb-1 font-medium">涓婁紶姝� Layout 鐨勭収鐗�</label>
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
                      {img.isCover ? "灏侀潰" : "璁句负灏侀潰"}
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
