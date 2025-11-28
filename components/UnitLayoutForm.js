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

/* ---------- 工具：把 AreaSelector 返回的对象，转换成总 sqft ---------- */
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
    return num; // 默认当 sqft
  };

  // 标准结构：{ values, units }
  if (area.values && area.units) {
    const buildUpSqft = convertToSqFt(area.values.buildUp, area.units.buildUp);
    const landSqft = convertToSqFt(area.values.land, area.units.land);
    return (buildUpSqft || 0) + (landSqft || 0);
  }

  // 简单结构：{ buildUp, land }，已是 sqft
  if (typeof area === "object") {
    const buildUp = Number(area.buildUp || 0);
    const land = Number(area.land || 0);
    return buildUp + land;
  }

  // 数字 / 字符串
  const num = parseFloat(String(area).replace(/,/g, ""));
  return isNaN(num) ? 0 : num;
}

/* ---------- 工具：从 price 字段解析 min / max ---------- */
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

/* ---------- 工具：生成 psf 文本 ---------- */
function getPsfText(areaObj, priceValue) {
  const totalAreaSqft = getAreaSqftFromAreaSelector(areaObj);
  const { minPrice, maxPrice } = getPriceRange(priceValue);

  if (!totalAreaSqft || totalAreaSqft <= 0) return "";
  if (!minPrice && !maxPrice) return "";

  const lowPrice = minPrice > 0 ? minPrice : maxPrice;
  const highPrice = maxPrice > 0 ? maxPrice : minPrice;

  if (!lowPrice) return "";

  const lowPsf = lowPrice / totalAreaSqft;
  const highPsf = highPrice ? highPrice / totalAreaSqft : lowPsf;

  if (!isFinite(lowPsf) || Number.isNaN(lowPsf) || Number.isNaN(highPsf)) {
    return "";
  }

  if (!highPrice || Math.abs(highPsf - lowPsf) < 0.005) {
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

export default function UnitLayoutForm({ index, data, onChange }) {
  // ❗ 不再在这里存 layout 的 state，直接用父组件传进来的 data
  const layout = data || {};
  const fileInputRef = useRef(null);

  // 统一更新：只负责把修改后的 layout 回传给父组件
  const updateLayout = (patch) => {
    const updated = { ...layout, ...patch };
    onChange && onChange(updated);
  };

  // 上传 layout 图片
  const handleLayoutUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newPhotos = [...(layout.layoutPhotos || []), ...files];
    updateLayout({ layoutPhotos: newPhotos });
  };

  // 图片打标签 config（由当前 layout 直接算出来，不用再存 state）
  const config = {
    bedrooms: Number(layout.bedrooms) || 0,
    bathrooms: Number(layout.bathrooms) || 0,
    kitchens: Number(layout.kitchens) || 0,
    livingRooms: Number(layout.livingRooms) || 0,
    carpark: Number(layout.carpark) || 0,
    extraSpaces: layout.extraSpaces || [],
    facilities: layout.facilities || [],
    furniture: layout.furniture || [],
    orientation: layout.facing || null,
    transit: layout.transit || null,
  };

  // psf 文本用当前 layout 的面积 & 价格
  const psfText = getPsfText(layout.buildUp, layout.price);

  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white">
      <h3 className="font-semibold mb-3">Layout {index + 1}</h3>

      {/* 上传 Layout 按钮 + 预览 */}
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
          onChange={handleLayoutUpload}
        />

        <ImageUpload
          config={{}} // Layout 简单模式
          images={layout.layoutPhotos || []}
          setImages={(updated) => updateLayout({ layoutPhotos: updated })}
        />
      </div>

      {/* Type 名称 */}
      <input
        type="text"
        placeholder="输入 Type 名称"
        value={layout.type || ""}
        onChange={(e) => updateLayout({ type: e.target.value })}
        className="border p-2 rounded w-full mb-3"
      />

      {/* Layout 照片 */}
      <div className="mb-3">
        <label className="block mb-1 font-medium">上传照片</label>
        <ImageUpload
          config={config}
          images={layout.photos || []}
          setImages={(updated) => updateLayout({ photos: updated })}
        />
      </div>

      {/* 面积：AreaSelector -> layout.buildUp */}
      <AreaSelector
        initialValue={layout.buildUp || {}}
        onChange={(val) => updateLayout({ buildUp: val })}
      />

      {/* 价格：PriceInput -> layout.price */}
      <PriceInput
        value={layout.price}
        onChange={(val) => updateLayout({ price: val })}
        type={layout.projectType}
      />

      {/* 唯一一条 psf 文本 */}
      {psfText && (
        <p className="text-sm text-gray-600 mt-1">{psfText}</p>
      )}

      {/* 房间数量 */}
      <RoomCountSelector
        value={{
          bedrooms: layout.bedrooms,
          bathrooms: layout.bathrooms,
          kitchens: layout.kitchens,
          livingRooms: layout.livingRooms,
        }}
        onChange={(updated) => updateLayout(updated)}
      />

      {/* 停车位 */}
      <CarparkCountSelector
        value={layout.carpark}
        onChange={(val) => updateLayout({ carpark: val })}
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
        onChange={(val) => updateLayout({ extraSpaces: val })}
      />

      {/* 朝向 */}
      <FacingSelector
        value={layout.facing || []}
        onChange={(val) => updateLayout({ facing: val })}
      />

      {/* 车位楼层 */}
      <CarparkLevelSelector
        value={layout.carparkPosition}
        onChange={(val) => updateLayout({ carparkPosition: val })}
        mode="range"
      />

      {/* 家具 / 设施 */}
      <FurnitureSelector
        value={layout.furniture}
        onChange={(val) => updateLayout({ furniture: val })}
      />

      <FacilitiesSelector
        value={layout.facilities}
        onChange={(val) => updateLayout({ facilities: val })}
      />

      {/* 交通信息 */}
      <div className="mb-4">
        <label className="font-medium">交通信息</label>
        <TransitSelector
          value={layout.transit || null}
          onChange={(val) => updateLayout({ transit: val })}
        />
      </div>

      {/* 建成年份 + 季度 */}
      <BuildYearSelector
        value={layout.buildYear}
        onChange={(val) => updateLayout({ buildYear: val })}
        quarter={layout.quarter}
        onQuarterChange={(val) => updateLayout({ quarter: val })}
        showQuarter={true}
      />
    </div>
  );
}
