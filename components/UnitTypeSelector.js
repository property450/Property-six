// components/UnitTypeSelector.js
"use client";

import { useState, useEffect } from "react";

export default function UnitTypeSelector({ propertyStatus, onChange }) {
  // 显示与否（和你旧版本一样，只在项目类房源时显示）
  const shouldShow =
    propertyStatus?.includes("New Project") ||
    propertyStatus?.includes("Under Construction") ||
    propertyStatus?.includes("Completed Unit") ||
    propertyStatus?.includes("Developer Unit");

  const [count, setCount] = useState(0);

  // ✅ 正确的 layout 初始结构（这里改成 ""，不再用 0）
  const createEmptyLayout = () => ({
    type: "",
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

  // 只依赖 count，避免死循环
  useEffect(() => {
    if (!count || count <= 0) {
      onChange && onChange([]);
      return;
    }
    const layouts = Array.from({ length: count }, () => createEmptyLayout());
    onChange && onChange(layouts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  if (!shouldShow) return null;

  return (
    <div className="mb-6">
      <label className="block font-medium mb-2">
        这个项目有多少个房型 / Layout？
      </label>
      <select
        className="border p-2 rounded w-full"
        onChange={(e) => setCount(Number(e.target.value))}
        value={count || ""}
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
