// components/homestay/HomestayUploadForm.js
"use client";

import { useMemo, useState } from "react";

export default function HomestayUploadForm() {
  // ✅ 你要的 4 个字段
  const [propertyCategory, setPropertyCategory] = useState("");
  const [subType, setSubType] = useState("");
  const [storeys, setStoreys] = useState("");
  const [propertySubtypes, setPropertySubtypes] = useState([]); // 多选

  const needsStoreys = useMemo(() => {
    // landed 才需要 storeys（你可按你自己规则再加）
    return [
      "Bungalow / Villa",
      "Semi-Detached House",
      "Terrace / Link House",
    ].includes(propertyCategory);
  }, [propertyCategory]);

  const toggleSubtype = (item) => {
    setPropertySubtypes((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  return (
    <div className="space-y-4">
      {/* ✅ Homestay 模式只显示：Property Category / Sub Type / Storeys（需要时）/ Property Subtype */}
      <div className="space-y-3 border rounded-lg p-4">
        <h3 className="font-semibold mb-1">房产类型（Homestay）</h3>

        {/* Property Category */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Property Category</label>
          <select
            className="w-full border rounded p-2"
            value={propertyCategory}
            onChange={(e) => {
              setPropertyCategory(e.target.value);
              // 切换 category 时，storeys 不是必须的就清空（避免残留）
              if (
                ![
                  "Bungalow / Villa",
                  "Semi-Detached House",
                  "Terrace / Link House",
                ].includes(e.target.value)
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

        {/* Sub Type */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Sub Type</label>
          <input
            className="w-full border rounded p-2"
            value={subType}
            onChange={(e) => setSubType(e.target.value)}
            placeholder="请选择具体类型"
          />
        </div>

        {/* Storeys（需要时） */}
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

        {/* Property Subtype（多选） */}
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

      {/* ⚠️ 下面你原本 Homestay 的其他字段/表单（如果是另一个更大的 Homestay 表单文件）
          你可以继续保留在这里，不影响上面的类型选择。
      */}
    </div>
  );
}
