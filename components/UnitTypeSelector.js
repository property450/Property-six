// components/UnitTypeSelector.js
"use client";

import { useState, useEffect } from "react";

export default function UnitTypeSelector({ propertyStatus, onChange }) {
  const [count, setCount] = useState(0);

  const createEmptyLayout = () => ({
    type: "",
    price: "",
    buildUp: {},

    bedrooms: 0,
    bathrooms: 0,
    kitchens: 0,
    livingRooms: 0,

    carpark: 0,

    carparkPosition: { min: 0, max: 0 },

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
    if (!count || count <= 0) {
      onChange && onChange([]);
      return;
    }
    const layouts = Array.from({ length: count }, () => createEmptyLayout());
    onChange && onChange(layouts);
  }, [count, onChange]);

  return (
    <div className="space-y-2 mt-4">
      <label className="block text-sm font-medium text-gray-700">
        这个项目有多少个房型 / Layout？
      </label>

      <select
        value={count || ""}
        onChange={(e) => setCount(Number(e.target.value))}
        className="border rounded px-3 py-2 w-full"
      >
        <option value="">请选择房型数量</option>
        {[...Array(10)].map((_, i) => (
          <option key={i} value={i + 1}>
            {i + 1} 个房型
          </option>
        ))}
      </select>
    </div>
  );
}
