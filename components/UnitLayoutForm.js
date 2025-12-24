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

import {
  normalizeTransitToSelector,
  normalizeTransitFromSelector,
} from "@/utils/unitLayoutForm/transit";
import { getAreaSqftFromAreaSelector } from "@/utils/unitLayoutForm/area";
import {
  CATEGORY_OPTIONS,
  SUBTYPE_OPTIONS,
  NEED_STOREYS_CATEGORY,
} from "@/utils/unitLayoutForm/constants";
import {
  formatNumber,
  parseNumber,
  toCount,
  toArray,
  getName,
  parseSubtypeToArray,
  getPhotoLabelsFromConfig,
} from "@/utils/unitLayoutForm/photoLabels";

export default function UnitLayoutForm({
  index,
  data,
  onChange,
  projectCategory,
  projectSubType,
  lockCategory = false, // bulk rent 项目锁定类别
  enableCommonCopy = false, // 是否启用 Layout1 同步/脱钩功能
}) {
  // ✅ 完全受控：不在这里存 state，直接用父组件传进来的 data
  const layout = data || {};
  const fileInputRef = useRef(null);

  // 统一更新：只负责把修改后的 layout 回传给父组件
  const updateLayout = (patch, meta) => {
    const updated = { ...layout, ...patch };
    onChange?.(updated, meta);
  };

  // ---------- 本表单内部使用 ----------
  const propertyCategory =
    lockCategory && projectCategory ? projectCategory : layout.propertyCategory || "";
  const subType = lockCategory && projectSubType ? projectSubType : layout.subType || "";

  const isNeedStoreys = NEED_STOREYS_CATEGORY.has(propertyCategory);

  // Property Subtype（多选）
  const subtypeArr = parseSubtypeToArray(layout.propertySubtype);

  // PSF 计算（用 buildUp + land 的总 sqft）
  const totalSqft = getAreaSqftFromAreaSelector(layout.area);
  const priceLow = Number(parseNumber(layout.priceLow || layout.price || 0)) || 0;
  const priceHigh = Number(parseNumber(layout.priceHigh || layout.price || 0)) || 0;

  const lowPsf = totalSqft > 0 && priceLow > 0 ? priceLow / totalSqft : 0;
  const highPsf = totalSqft > 0 && priceHigh > 0 ? priceHigh / totalSqft : 0;

  const psfText =
    lowPsf && highPsf
      ? `每平方英尺: RM ${lowPsf.toLocaleString(undefined, {
          maximumFractionDigits: 2,
        })} ~ RM ${highPsf.toLocaleString(undefined, {
          maximumFractionDigits: 2,
        })}`
      : "";

  // ✅ 动态 photo config：由「卧室/浴室/厨房/客厅/车位 + 额外空间 + 家私」生成
  const photoConfig = {
    bedrooms: layout.bedrooms,
    bathrooms: layout.bathrooms,
    kitchens: layout.kitchens,
    livingRooms: layout.livingRooms,
    carpark: layout.carpark,
    extraSpaces: layout.extraSpaces,
    furniture: layout.furniture,
  };

  const photoLabels = getPhotoLabelsFromConfig(photoConfig);

  // ✅ TransitSelector：统一格式，避免“选了又跳回请选择”
  const transitValue = normalizeTransitToSelector(layout.transit);

  // ========== render ==========
  return (
    <div className="border rounded-lg p-4 space-y-4 bg-white">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">房型 {index + 1}</h3>

        {/* Layout1 同步/脱钩开关（只在 enableCommonCopy 时显示，且 index>0 才有意义） */}
        {enableCommonCopy && index > 0 && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={layout._inheritCommon !== false}
              onChange={(e) => {
                const checked = e.target.checked;
                updateLayout(
                  { _inheritCommon: checked ? true : false },
                  { inheritToggle: true }
                );
              }}
            />
            同步 Layout1（额外空间 / 家私 / 设施 / 公共交通）
          </label>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="font-medium">Property Category</label>
        <select
          value={propertyCategory}
          disabled={lockCategory}
          onChange={(e) => {
            const cat = e.target.value;
            updateLayout({ propertyCategory: cat, subType: "" });
          }}
          className="mt-1 block w-full border rounded-lg p-2"
        >
          <option value="">请选择类别</option>
          {Object.keys(CATEGORY_OPTIONS).map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* SubType */}
      {propertyCategory && CATEGORY_OPTIONS[propertyCategory] && (
        <div>
          <label className="font-medium">Sub Type</label>
          <select
            value={subType}
            disabled={lockCategory}
            onChange={(e) => updateLayout({ subType: e.target.value })}
            className="mt-1 block w-full border rounded-lg p-2"
          >
            <option value="">请选择具体类型</option>
            {CATEGORY_OPTIONS[propertyCategory].map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Property Subtype（可多选） */}
      <div>
        <label className="font-medium">Property Subtype（可多选）</label>
        <div className="flex flex-wrap gap-2 mt-2">
          {SUBTYPE_OPTIONS.map((opt) => {
            const checked = subtypeArr.includes(opt);
            return (
              <label
                key={opt}
                className={`px-3 py-1 rounded-full border cursor-pointer text-sm ${
                  checked ? "bg-blue-50 border-blue-400" : "bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={checked}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...subtypeArr, opt]
                      : subtypeArr.filter((x) => x !== opt);
                    updateLayout({ propertySubtype: next });
                  }}
                />
                {opt}
              </label>
            );
          })}
        </div>
      </div>

      {/* 有多少层（只在某些类别显示） */}
      {isNeedStoreys && (
        <div>
          <FloorCountSelector
            value={layout.storeys}
            onChange={(val) => updateLayout({ storeys: val })}
          />
        </div>
      )}

      {/* Area */}
      <AreaSelector
        initialValue={layout.area}
        onChange={(val) => updateLayout({ area: val })}
      />

      {/* Price */}
      <PriceInput
        value={layout.price}
        onChange={(val) => updateLayout({ price: val })}
        listingMode={layout.listingMode || "Sale"}
        area={{
          buildUp: 0,
          land: 0,
        }}
      />

      {/* PSF 文本 */}
      {psfText && (
        <div className="text-sm text-gray-700 bg-gray-50 border rounded-lg p-2">
          {psfText}
        </div>
      )}

      {/* Room Counts */}
      <RoomCountSelector
        value={{
          bedrooms: layout.bedrooms,
          bathrooms: layout.bathrooms,
          kitchens: layout.kitchens,
          livingRooms: layout.livingRooms,
        }}
        onChange={(patch) => updateLayout({ ...patch })}
      />

      {/* Carpark */}
      <CarparkCountSelector
        value={layout.carpark}
        onChange={(val) => updateLayout({ carpark: val })}
        mode="range"
      />

      <CarparkLevelSelector
        value={layout.carparkPosition}
        onChange={(val) => updateLayout({ carparkPosition: val })}
        mode="range"
      />

      {/* Facing */}
      <FacingSelector
        value={layout.facing}
        onChange={(val) => updateLayout({ facing: val })}
      />

      {/* Extra Spaces */}
      <ExtraSpacesSelector
        value={layout.extraSpaces}
        onChange={(val) =>
          updateLayout({ extraSpaces: val }, { commonField: "extraSpaces" })
        }
      />

      {/* Furniture */}
      <FurnitureSelector
        value={layout.furniture}
        onChange={(val) =>
          updateLayout({ furniture: val }, { commonField: "furniture" })
        }
      />

      {/* Facilities */}
      <FacilitiesSelector
        value={layout.facilities}
        onChange={(val) =>
          updateLayout({ facilities: val }, { commonField: "facilities" })
        }
      />

      {/* Transit */}
      <TransitSelector
        value={transitValue}
        onChange={(info) =>
          updateLayout(
            { transit: normalizeTransitFromSelector(info) },
            { commonField: "transit" }
          )
        }
      />

      {/* Build year */}
      <BuildYearSelector
        value={layout.buildYear}
        onChange={(val) => updateLayout({ buildYear: val })}
        showQuarter={false}
        label="完成年份"
      />

      {/* Images（按 labels 动态生成） */}
      <div className="space-y-2">
        <label className="font-medium">房型照片</label>
        <div className="grid grid-cols-2 gap-2">
          {photoLabels.map((label) => (
            <button
              key={label}
              type="button"
              className="border rounded-lg p-2 text-left hover:bg-gray-50"
              onClick={() => fileInputRef.current?.click()}
            >
              {label}
            </button>
          ))}
        </div>
        <input ref={fileInputRef} type="file" className="hidden" multiple />
      </div>
    </div>
  );
}
