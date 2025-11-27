"use client";
import { useState, useEffect, useRef } from "react";

// 复用现有组件
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
    // 默认当 sqft
    return num;
  };

  // 标准结构：{ types, units, values }
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
function getPsfInfo(areaObj, priceValue) {
  const totalAreaSqft = getAreaSqftFromAreaSelector(areaObj);
  const { minPrice, maxPrice } = getPriceRange(priceValue);

  if (!totalAreaSqft || totalAreaSqft <= 0) return null;
  if (!minPrice && !maxPrice) return null;

  const lowPrice = minPrice > 0 ? minPrice : maxPrice;
  const highPrice = maxPrice > 0 ? maxPrice : minPrice;

  const lowPsf = lowPrice / totalAreaSqft;
  const highPsf = highPrice > 0 ? highPrice / totalAreaSqft : lowPsf;

  if (!isFinite(lowPsf)) return null;

  const text =
    Math.abs(highPsf - lowPsf) < 0.005
      ? `每平方英尺: RM ${lowPsf.toLocaleString(undefined, {
          maximumFractionDigits: 2,
        })}`
      : `每平方英尺: RM ${lowPsf.toLocaleString(undefined, {
          maximumFractionDigits: 2,
        })} ~ RM ${highPsf.toLocaleString(undefined, {
          maximumFractionDigits: 2,
        })}`;

  return {
    text,
    totalAreaSqft,
    rawPrice: priceValue,
  };
}

export default function UnitLayoutForm({ index, data, onChange }) {
  const [type, setType] = useState(data.type || "");
  const fileInputRef = useRef(null);
  const [transitInfo, setTransitInfo] = useState(data.transit || null);

  // ✅ 关键：本地保存面积 & 价格，用来算 psf
  const [areaForPsf, setAreaForPsf] = useState(data.buildUp || {});
  const [priceForPsf, setPriceForPsf] = useState(data.price || "");

  // 如果父组件后来把 data 带着默认值更新进来（例如编辑已有房源），同步一次
  useEffect(() => {
    if (data.buildUp) setAreaForPsf(data.buildUp);
  }, [data.buildUp]);
  useEffect(() => {
    if (data.price !== undefined) setPriceForPsf(data.price);
  }, [data.price]);

  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  // 上传 layout 图片
  const handleLayoutUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newPhotos = [...(data.layoutPhotos || []), ...files];
    handleChange("layoutPhotos", newPhotos);
  };

  // 图片打标签 config
  const [config, setConfig] = useState({});
  useEffect(() => {
    setConfig({
      bedrooms: Number(data.bedrooms) || 0,
      bathrooms: Number(data.bathrooms) || 0,
      kitchens: Number(data.kitchens) || 0,
      livingRooms: Number(data.livingRooms) || 0,
      carpark: Number(data.carpark) || 0,
      extraSpaces: data.extraSpaces || [],
      facilities: data.facilities || [],
      furniture: data.furniture || [],
      orientation: data.facing || null,
      transit: data.transit || null,
    });
  }, [data]);

  // ✅ 用本地 state 来算 psf
  const psfInfo = getPsfInfo(areaForPsf, priceForPsf);

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
          images={data.layoutPhotos || []}
          setImages={(updated) => handleChange("layoutPhotos", updated)}
        />
      </div>

      {/* Type 名称 */}
      <input
        type="text"
        placeholder="输入 Type 名称"
        value={type}
        onChange={(e) => {
          setType(e.target.value);
          handleChange("type", e.target.value);
        }}
        className="border p-2 rounded w-full mb-3"
      />

      {/* Layout 照片 */}
      <div className="mb-3">
        <label className="block mb-1 font-medium">上传照片</label>
        <ImageUpload
          config={config}
          images={data.photos || []}
          setImages={(updated) => handleChange("photos", updated)}
        />
      </div>

      {/* 面积：AreaSelector 把 {types, units, values} 回传到本地 + 父组件 */}
      <AreaSelector
        initialValue={areaForPsf || {}}
        onChange={(val) => {
          setAreaForPsf(val);          // ✅ 本地保存
          handleChange("buildUp", val); // 同步到 layout data
        }}
      />

      {/* 价格：PriceInput 把字符串回传到本地 + 父组件 */}
      <PriceInput
        value={priceForPsf}
        onChange={(val) => {
          setPriceForPsf(val);         // ✅ 本地保存
          handleChange("price", val);  // 同步到 layout data
        }}
        type={data.projectType}
        area={areaForPsf}              // 给它也传一份（如果你以后想在 PriceInput 里面也用）
      />

      {/* ✅ 这里显示 每平方英尺 RM xxx.xx ~ RM yyy.yy */}
      {psfInfo && (
        <>
          <p className="text-sm text-gray-600 mt-1">{psfInfo.text}</p>
          {/* 调试信息，看完可以删掉 */}
          <p className="text-xs text-gray-400">
            调试: 面积 {psfInfo.totalAreaSqft.toFixed(2)} sqft，价格原始值{" "}
            {String(psfInfo.rawPrice || "")}
          </p>
        </>
      )}

      {/* 房间数量 */}
      <RoomCountSelector
        value={{
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          kitchens: data.kitchens,
          livingRooms: data.livingRooms,
        }}
        onChange={(updated) => onChange({ ...data, ...updated })}
      />

      {/* 停车位 */}
      <CarparkCountSelector
        value={data.carpark}
        onChange={(val) => handleChange("carpark", val)}
        mode={
          data.projectType === "New Project / Under Construction" ||
          data.projectType === "Completed Unit / Developer Unit"
            ? "range"
            : "single"
        }
      />

      {/* 额外空间 */}
      <ExtraSpacesSelector
        value={data.extraSpaces || []}
        onChange={(val) => handleChange("extraSpaces", val)}
      />

      {/* 朝向 */}
      <FacingSelector
        value={data.facing || []}
        onChange={(val) => handleChange("facing", val)}
      />

      {/* 车位楼层 */}
      <CarparkLevelSelector
        value={data.carparkPosition}
        onChange={(val) => handleChange("carparkPosition", val)}
        mode="range"
      />

      {/* 家具 / 设施 */}
      <FurnitureSelector
        value={data.furniture}
        onChange={(val) => handleChange("furniture", val)}
      />

      <FacilitiesSelector
        value={data.facilities}
        onChange={(val) => handleChange("facilities", val)}
      />

      {/* 交通信息 */}
      <div className="mb-4">
        <label className="font-medium">交通信息</label>
        <TransitSelector
          onChange={(val) => {
            setTransitInfo(val);
            handleChange("transit", val);
          }}
        />
      </div>

      {/* 建成年份 + 季度 */}
      <BuildYearSelector
        value={data.buildYear}
        onChange={(val) => handleChange("buildYear", val)}
        quarter={data.quarter}
        onQuarterChange={(val) => handleChange("quarter", val)}
        showQuarter={true}
      />
    </div>
  );
}
