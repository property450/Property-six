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

import BlueprintUploadSection from "@/components/unitlayout/BlueprintUploadSection";
import UnitCountInput from "@/components/unitlayout/UnitCountInput";
import PhotoUploadSection from "@/components/unitlayout/PhotoUploadSection";

import { CATEGORY_OPTIONS, SUBTYPE_OPTIONS, NEED_STOREYS_CATEGORY } from "@/constants/unitLayoutOptions";
import { getPsfText } from "@/utils/psfUtils";
import { normalizeTransitToSelector, normalizeTransitFromSelector } from "@/utils/transitUtils";
import { getPhotoLabelsFromConfig } from "@/utils/photoLabelUtils";

// ✅ 统一 select 样式（保持你现在原本模样，不改）
function getSelectClass(value, disabled = false) {
  const base =
    "w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200";

  // disabled 维持你原本灰掉的感觉（不改逻辑）
  if (disabled) return `${base} bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed`;

  // ✅ 关键：空值也不要用 text-gray-400（不然下拉选项会一起变浅）
  // 让它跟 subsale 的 select 一样深色
  return `${base} bg-white border-gray-300 text-gray-900`;
}


// subtype 统一成数组（保留兼容）
const parseSubtypeToArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return [String(val)];
};

export default function UnitLayoutForm({
  index,
  data,
  onChange,
  projectCategory,
  projectSubType,
  lockCategory = false,
  enableCommonCopy = false,

  // ✅ 新增：从 ProjectUploadForm 传入（只用于判断停车位范围，不动其它逻辑）
  saleType,
  computedStatus,
}) {
  const layout = data || {};
  const fileInputRef = useRef(null);

  // ✅ New Project：Layout2+ 是否跟随 Layout1（默认跟随）
  const isInheritingCommon = index > 0 ? layout._inheritCommon !== false : false;

  // ✅ 关键：不要依赖 layout.projectType（很多时候为空）
  const effectiveProjectType = layout.projectType || computedStatus || "";
const effectiveRentMode = layout.rentMode || saleType || "";

// ✅ 只做大小写兼容，不改其它逻辑
const modeLower = String(effectiveRentMode).toLowerCase();

const isNewProject = effectiveProjectType === "New Project / Under Construction";
const isCompletedProject = effectiveProjectType === "Completed Unit / Developer Unit";

// 只有 Sale 的项目，需要显示年份；Rent / Homestay / Hotel 都不要
const showBuildYear = modeLower === "sale" && (isNewProject || isCompletedProject);

// ⭐ 批量 Rent 的 Layout
const isBulkRent = modeLower === "rent";

  // Category / SubType / 层数
  const [category, setCategory] = useState(
    lockCategory ? projectCategory || layout.propertyCategory || "" : layout.propertyCategory || ""
  );
  const [subType, setSubType] = useState(
    lockCategory ? projectSubType || layout.subType || "" : layout.subType || ""
  );

  // propertySubtype 多选数组
  const [propertySubtype, setPropertySubtype] = useState(parseSubtypeToArray(layout.propertySubtype));
  const [showSubtype, setShowSubtype] = useState(false);
  const [storeys, setStoreys] = useState(layout.storeys || "");

  // Property Subtype 下拉开关
  const [subtypeOpen, setSubtypeOpen] = useState(false);
  const subtypeRef = useRef(null);

  // 房型单位数量
  const [unitCountLocal, setUnitCountLocal] = useState(layout.unitCount ? String(layout.unitCount) : "");
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);
  const unitCountRef = useRef(null);

  // PSF 相关
  const [areaForPsf, setAreaForPsf] = useState(layout.buildUp || {});
  const [priceForPsf, setPriceForPsf] = useState(layout.price !== undefined ? layout.price : "");

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

  const photosByLabel = layout.photos || {};

  // 同步外部传入的变化（包括 projectCategory / projectSubType）
  useEffect(() => {
    const cat = lockCategory ? projectCategory || layout.propertyCategory || "" : layout.propertyCategory || "";
    const sub = lockCategory ? projectSubType || layout.subType || "" : layout.subType || "";

    setCategory(cat);
    setSubType(sub);
    setPropertySubtype(parseSubtypeToArray(layout.propertySubtype));
    setStoreys(layout.storeys || "");
    setUnitCountLocal(layout.unitCount ? String(layout.unitCount) : "");
  }, [
    lockCategory,
    projectCategory,
    projectSubType,
    layout.propertyCategory,
    layout.subType,
    layout.propertySubtype,
    layout.storeys,
    layout.unitCount,
  ]);

  // Apartment / Business / Industrial 时显示 propertySubtype
  useEffect(() => {
    const shouldShow =
      category === "Apartment / Condo / Service Residence" ||
      category === "Business Property" ||
      category === "Industrial Property";
    setShowSubtype(shouldShow);
  }, [category]);

  // 点击外面关闭两个下拉：单位数量 & Property Subtype
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (unitCountRef.current && !unitCountRef.current.contains(e.target)) setUnitDropdownOpen(false);
      if (subtypeRef.current && !subtypeRef.current.contains(e.target)) setSubtypeOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateLayout = (patch, meta) => {
    const updated = { ...layout, ...patch };
    onChange && onChange(updated, meta);
  };

  const handleFieldChange = (field, value, meta) => {
    updateLayout({ [field]: value }, meta);
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
    const updatedPhotos = { ...photosByLabel, [label]: [...current, ...newImages] };
    updateLayout({ photos: updatedPhotos });
  };

  const removePhoto = (label, index) => {
    const current = photosByLabel[label] || [];
    const updatedPhotos = { ...photosByLabel, [label]: current.filter((_, i) => i !== index) };
    updateLayout({ photos: updatedPhotos });
  };

  const setCover = (label, index) => {
    const current = photosByLabel[label] || [];
    const updatedPhotos = {
      ...photosByLabel,
      [label]: current.map((img, i) => ({ ...img, isCover: i === index })),
    };
    updateLayout({ photos: updatedPhotos });
  };

  const psfText = getPsfText(areaForPsf, priceForPsf);
  const uploadLabelsBase = getPhotoLabelsFromConfig(photoConfig);

// ✅ 固定增加「房源外观/环境」：只在 New Project & Completed Unit
const uploadLabels = (() => {
  const needExterior =
    computedStatus === "New Project / Under Construction" ||
    computedStatus === "Completed Unit / Developer Unit";

  const extras = needExterior ? ["房源外观/环境"] : [];
  const all = [...(uploadLabelsBase || []), ...extras];

  // 去重 + 保持顺序
  const seen = new Set();
  const out = [];
  for (const l of all) {
    if (!l) continue;
    if (seen.has(l)) continue;
    seen.add(l);
    out.push(l);
  }
  return out;
})();

  const toggleSubtype = (item) => {
    const next = propertySubtype.includes(item)
      ? propertySubtype.filter((v) => v !== item)
      : [...propertySubtype, item];
    setPropertySubtype(next);
    handleFieldChange("propertySubtype", next);
  };

  const subtypeDisplayText =
    propertySubtype.length === 0 ? "请选择 subtype（可多选）" : propertySubtype.map((v) => `${v} ✅`).join("，");

  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white">
      {enableCommonCopy && index > 0 && (
        <div className="mb-3 flex items-center gap-2">
          <input
            type="checkbox"
            checked={isInheritingCommon}
            onChange={(e) => {
              updateLayout({ _inheritCommon: e.target.checked }, { inheritToggle: true });
            }}
          />
          <span className="text-sm text-gray-700">同步 Layout 1（家私/设施/额外空间/公共交通）</span>
        </div>
      )}

      <h3 className="font-semibold mb-3">Layout {index + 1}</h3>

      <BlueprintUploadSection fileInputRef={fileInputRef} onUpload={handleLayoutUpload} />

      {/* Type 名称 */}
      <input
        type="text"
        placeholder="输入 Type 名称"
        value={layout.type || ""}
        onChange={(e) => handleFieldChange("type", e.target.value)}
        className="border p-2 rounded w-full mb-3"
      />

      {/* Property Category（单个 layout） */}
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
              updateLayout({ propertyCategory: cat, subType: "", propertySubtype: [], storeys: "" });
            }}
            className={getSelectClass(category, false)}
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
                className={getSelectClass(subType, false)}
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
              <label className="block font-medium mb-1">Property Subtype</label>

              <div
                className="rounded-lg border border-gray-300 px-3 py-2 bg-white cursor-pointer"
                onClick={() => setSubtypeOpen((prev) => !prev)}
              >
                {propertySubtype.length === 0 ? (
                  <span className="text-gray-400">请选择 subtype（可多选）</span>
                ) : (
                  <span className="font-medium text-gray-900">{subtypeDisplayText}</span>
                )}
              </div>

              {subtypeOpen && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
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
                        <span className="text-gray-900">{opt}</span>
                        {selected && <span className="text-green-600">✅</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      <UnitCountInput
        unitCountRef={unitCountRef}
        unitCountLocal={unitCountLocal}
        setUnitCountLocal={setUnitCountLocal}
        unitDropdownOpen={unitDropdownOpen}
        setUnitDropdownOpen={setUnitDropdownOpen}
        onCommit={(raw) => handleFieldChange("unitCount", raw)}
      />

      <AreaSelector
  propertyCategory={category}  // ✅ 关键：让 AreaSelector 知道你选了 Land
  initialValue={areaForPsf || {}}
  onChange={(val) => {
    setAreaForPsf(val);
    handleFieldChange("buildUp", val);
  }}
/>

      <PriceInput
        value={priceForPsf}
        onChange={(val) => {
          setPriceForPsf(val);
          handleFieldChange("price", val);
        }}
        listingMode={isBulkRent ? "Rent" : undefined}
        type={isBulkRent ? undefined : effectiveProjectType}
      />

      {psfText && <p className="text-sm text-gray-600 mt-1">{psfText}</p>}

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

      {/* ✅✅✅ 关键：New Project / Completed Unit 一定切 range（用 effectiveProjectType 判断） */}
      <CarparkCountSelector
        value={photoConfig.carpark}
        onChange={(val) => {
          setPhotoConfig((prev) => ({ ...prev, carpark: val }));
          handleFieldChange("carpark", val);
        }}
        mode={isNewProject || isCompletedProject ? "range" : "single"}
      />

      <ExtraSpacesSelector
        value={Array.isArray(layout.extraSpaces) ? layout.extraSpaces : []}
        onChange={(val) => {
          setPhotoConfig((prev) => ({ ...prev, extraSpaces: val }));
          const cloned = Array.isArray(val) ? val.map((x) => ({ ...x })) : [];
          handleFieldChange("extraSpaces", cloned, { commonField: "extraSpaces" });
        }}
      />

      <FacingSelector
        value={photoConfig.orientation}
        onChange={(val) => {
          setPhotoConfig((prev) => ({ ...prev, orientation: val }));
          handleFieldChange("facing", val);
        }}
      />

      <CarparkLevelSelector
        value={layout.carparkPosition}
        onChange={(val) => handleFieldChange("carparkPosition", val)}
        mode="range"
      />

      <FurnitureSelector
        value={Array.isArray(layout.furniture) ? layout.furniture : []}
        onChange={(val) => {
          setPhotoConfig((prev) => ({ ...prev, furniture: val }));
          const cloned = Array.isArray(val) ? val.map((x) => ({ ...x })) : [];
          handleFieldChange("furniture", cloned, { commonField: "furniture" });
        }}
      />

      <FacilitiesSelector
        value={Array.isArray(layout.facilities) ? layout.facilities : []}
        onChange={(val) => {
          setPhotoConfig((prev) => ({ ...prev, facilities: val }));
          const cloned = Array.isArray(val) ? val.map((x) => ({ ...x })) : [];
          handleFieldChange("facilities", cloned, { commonField: "facilities" });
        }}
      />

      <div className="mb-4">
        <label className="font-medium">交通信息</label>
        <TransitSelector
          value={normalizeTransitToSelector(layout.transit)}
          onChange={(val) => {
            const normalized = normalizeTransitFromSelector(val);
            handleFieldChange("transit", normalized, { commonField: "transit" });
          }}
        />
      </div>

      {showBuildYear && (
        <BuildYearSelector
          value={layout.buildYear}
          onChange={(val) => updateLayout({ buildYear: val })}
          quarter={layout.quarter}
          onQuarterChange={(val) => updateLayout({ quarter: val })}
          showQuarter={isNewProject}
          label={isNewProject ? "预计交付时间" : "完成年份"}
        />
      )}

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

      <PhotoUploadSection
        uploadLabels={uploadLabels}
        photosByLabel={photosByLabel}
        onPhotoChange={handlePhotoChange}
        onRemovePhoto={removePhoto}
        onSetCover={setCover}
      />
    </div>
  );
}
