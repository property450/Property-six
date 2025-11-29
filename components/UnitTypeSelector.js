// components/UnitTypeSelector.js
"use client";

import { useState, useEffect } from "react";

export default function UnitTypeSelector({ propertyStatus, layouts = [], onChange }) {
  // 只有项目类房源时显示
  const shouldShow =
    propertyStatus?.includes("New Project") ||
    propertyStatus?.includes("Under Construction") ||
    propertyStatus?.includes("Completed Unit") ||
    propertyStatus?.includes("Developer Unit");

  const [count, setCount] = useState(0);

  // layout 的初始结构
  const createEmptyLayout = () => ({
    type: "",
    propertyCategory: "",
    subType: "",
    unitCount: "",

    price: "",
    buildUp: {},

    bedrooms: "",
    bathrooms: "",
    kitchens: "",
    livingRooms: "",

    carpark: "",
    carparkPosition: { min: "", max: "" },

    extraSpaces: [],
    facilities: [],
    furniture: [],

    facing: "",

    photos: [],
    layoutPhotos: [],

    buildYear: "",
    quarter: "",

    transit: null,
  });

  useEffect(() => {
    // 不是项目类时：清空
    if (!shouldShow) {
      if (count !== 0) setCount(0);
      onChange?.([]);
      return;
    }

    // 项目类但没选数量：清空
    if (!count || count <= 0) {
      onChange?.([]);
      return;
    }

    // ⭐ 在原有 layouts 基础上“增减”，不要每次全部重建
    let next = Array.isArray(layouts) ? [...layouts] : [];

    // 长度不够就补空 layout
    if (next.length < count) {
      while (next.length < count) {
        next.push(createEmptyLayout());
      }
    }

    // 太多就裁掉多余的
    if (next.length > count) {
      next = next.slice(0, count);
    }

    onChange?.(next);
    // 注意：这里不要把 layouts 放进依赖，否则每次父组件更新又重置
  }, [count, shouldShow]); // ✅ 只依赖 count 和 shouldShow

  if (!shouldShow) return null;

  return (
    <div className="mb-6">
      <label className="block font-medium mb-2">
        这个项目有多少个房型 / Layout？
      </label>
      <select
        className="border p-2 rounded w-full"
        value={count || ""}
        onChange={(e) => setCount(Number(e.target.value) || 0)}
      >
        <option value="">请选择房型数量</option>
        {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>
            {n} 个房型
          </option>
        ))}
      </select>
    </div>
  );
}
