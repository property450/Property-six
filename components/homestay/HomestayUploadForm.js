// components/homestay/HomestayUploadForm.js
"use client";

import { useMemo, useState } from "react";

export default function HomestayUploadForm() {
  // ✅ 只做你要的 4 个字段（不碰其它任何页面逻辑）
  const [propertyCategory, setPropertyCategory] = useState("");
  const [subType, setSubType] = useState("");
  const [storeys, setStoreys] = useState("");
  const [propertySubtypes, setPropertySubtypes] = useState([]); // 多选

  const needsStoreys = useMemo(() => {
    // landed 才显示 storeys
    return (
      propertyCategory === "Bungalow / Villa" ||
      propertyCategory === "Semi-Detached House" ||
      propertyCategory === "Terrace / Link House"
    );
  }, [propertyCategory]);

  const toggleSubtype = (item) => {
    setPropertySubtypes((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  return (
    <div className="space-y-3 border rounded-lg p-4">
      <h3 className="font-semibold mb-1">房产类型（Homestay）</h3>

      {/* 1) Property Category */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Property Category</label>
        <select
          className="w-full border rounded p-2"
          value={propertyCategory}
          onChange={(e) => {
            const v = e.target.value;
            setPropertyCategory(v);
            // 如果不需要 storeys，就清空
            if (
              v !== "Bungalow / Villa" &&
              v !== "Semi-Detached House" &&
              v !== "Terrace / Link House"
            ) {
              setStoreys("");
            }
          }}
        >
          <option value="">请选择</option>
          <option value="Bungalow / Villa">Bungalow / Villa</option>
          <option value="Apartment / Condo / Service Residence">
            Apartment / Condo / Service Residence
          </option>
          <option value="Semi-Detached House">Semi-Detached House</option>
          <option value="Terrace / Link House">Terrace / Link House</option>
          <option value="Business Property">Business Property</option>
          <option value="Industrial Property">Industrial Property</option>
          <option value="Land">Land</option>
        </select>
      </div>

      {/* 2) Sub Type */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Sub Type</label>
        <input
          className="w-full border rounded p-2"
          value={subType}
          onChange={(e) => setSubType(e.target.value)}
          placeholder="请选择具体类型"
        />
      </div>

      {/* 3) Storeys（需要时） */}
      {needsStoreys && (
        <div className="space-y-2">
          <label className="block text-sm font-medium">有多少层（Storeys）</label>
          <input
            className="w-full border rounded p-2"
            value={storeys}
            onChange={(e) => setStoreys(e.target.value)}
            placeholder="例如：2 或 2.5"
          />
        </div>
      )}

      {/* 4) Property Subtype（多选） */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Property Subtype（可多选）
        </label>

        <div className="grid grid-cols-2 gap-2 text-sm">
          {["Penthouse", "Duplex", "Triplex", "Dual Key"].map((item) => (
            <label key={item} className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={propertySubtypes.includes(item)}
                onChange={() => toggleSubtype(item)}
              />
              {item}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

