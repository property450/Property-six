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

// ✅ 工具函数：把 AreaSelector 返回的对象转换成“总平方英尺数字”
function getAreaSqftFromAreaSelector(area) {
  if (!area) return 0;

  // AreaSelector 一般返回：{ values: {buildUp, land}, units: {buildUp, land}, types: [...] }
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
    // 默认当作 square feet
    return num;
  };

  // 如果是 { values, units } 结构
  if (area.values && area.units) {
    const buildUpSqft = convertToSqFt(
      area.values.buildUp,
      area.units.buildUp
    );
    const landSqft = convertToSqFt(area.values.land, area.units.land);
    return (buildUpSqft || 0) + (landSqft || 0);
  }

  // 如果是简单对象 { buildUp, land }（已经是 sqft）
  if (typeof area === "object") {
    const buildUp = Number(area.buildUp || 0);
    const land = Number(area.land || 0);
    return buildUp + land;
  }

  // 如果直接是数字 / 字符串
  const num = parseFloat(String(area).replace(/,/g, ""));
  return isNaN(num) ? 0 : num;
}

export default function UnitLayoutForm({ index, data, onChange }) {
  const [type, setType] = useState(data.type || "");
  const fileInputRef = useRef(null);
  const [transitInfo, setTransitInfo] = useState(data.transit || null);

  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  // 上传 layout 图片逻辑
  const handleLayoutUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newPhotos = [...(data.layoutPhotos || []), ...files];
    handleChange("layoutPhotos", newPhotos);
  };

  // 每次 data 更新时生成 config（图片打标签用）
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

  // ✅ 从当前 layout 的 AreaSelector 数据算出“总平方英尺”
  const layoutAreaSqft = getAreaSqftFromAreaSelector(data.buildUp);

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

      {/* 面积选择（这个 AreaSelector 返回的对象会存在 data.buildUp 里） */}
      <AreaSelector
        value={data.buildUp}
        onChange={(val) => handleChange("buildUp", val)}
      />

      {/* 价格输入 + ✅ 这里才是计算“每平方英尺 RM xxx.xx ~ RM yyy.yy”的地方 */}
      <PriceInput
        value={data.price}
        onChange={(val) => handleChange("price", val)}
        type={data.projectType}     // "New Project / Under Construction" or "Completed Unit / Developer Unit"
        area={layoutAreaSqft}       // ✅ 直接传“总平方英尺数字”
      />

      {/* 房间数量（卧室/浴室/厨房/客厅） */}
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
