"use client";
import React, { useState, useEffect, useRef } from "react";

const AREA_TYPES = [
  { label: "Build up Area", value: "buildUp" },
  { label: "Land Area", value: "land" },
];

const UNITS = ["square feet", "square meter", "acres", "hectares"];
const COMMON_VALUES = Array.from({ length: 149 }, (_, i) => 200 + i * 200);

export default function AreaSelector({
  onChange = () => {},
  initialValue = {},
  propertyCategory, // 👈 新增（可选）
}) {
  /* ---------------- 核心状态 ---------------- */

  const [selectedTypes, setSelectedTypes] = useState(() => {
    // ✅ 默认永远只勾 Build up
    return ["buildUp"];
  });

  const [units, setUnits] = useState({
    buildUp: initialValue.units?.buildUp || UNITS[0],
    land: initialValue.units?.land || UNITS[0],
  });

  const [areaValues, setAreaValues] = useState(
    initialValue.values || { buildUp: "", land: "" }
  );

  const [displayValues, setDisplayValues] = useState({ buildUp: "", land: "" });
  const [dropdownOpen, setDropdownOpen] = useState({ buildUp: false, land: false });

  const wrapperRef = useRef({ buildUp: null, land: null });

  /* ---------------- 外部点击关闭下拉 ---------------- */

  useEffect(() => {
    const handler = (e) => {
      AREA_TYPES.forEach((t) => {
        if (wrapperRef.current[t.value] && !wrapperRef.current[t.value].contains(e.target)) {
          setDropdownOpen((p) => ({ ...p, [t.value]: false }));
        }
      });
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ---------------- Property Category = Land 自动切换 ---------------- */

  useEffect(() => {
    if (propertyCategory === "Land") {
      setSelectedTypes(["land"]);
    }
  }, [propertyCategory]);

  /* ---------------- 回传给父组件 ---------------- */

  useEffect(() => {
    onChange({
      types: selectedTypes,
      units,
      values: areaValues,
    });
  }, [selectedTypes, units, areaValues]);

  /* ---------------- 勾选逻辑（严格） ---------------- */

  const toggleType = (type) => {
    setSelectedTypes((prev) => {
      if (prev.includes(type)) {
        // ❌ 不允许清空到 0
        if (prev.length === 1) return prev;

        // 取消时清空值
        setAreaValues((v) => ({ ...v, [type]: "" }));
        setDisplayValues((v) => ({ ...v, [type]: "" }));
        return prev.filter((t) => t !== type);
      }

      // ✅ 允许用户手动勾第二个
      return [...prev, type];
    });
  };

  /* ---------------- 输入处理 ---------------- */

  const handleInputChange = (type, input) => {
    const raw = input.replace(/,/g, "");
    if (!/^\d*\.?\d*$/.test(raw)) return;

    setAreaValues((p) => ({ ...p, [type]: raw }));

    const formatted = raw
      ? Number(raw).toLocaleString(undefined, { maximumFractionDigits: 3 })
      : "";

    setDisplayValues((p) => ({ ...p, [type]: formatted }));
  };

  /* ---------------- 单个面积块 ---------------- */

  const renderArea = (type) => {
    const label = AREA_TYPES.find((t) => t.value === type)?.label;
    const unit = units[type];

    return (
      <div key={type} ref={(el) => (wrapperRef.current[type] = el)} className="mb-6">
        <label className="block font-semibold mb-2">{label} Unit</label>

        <select
          className="border px-3 py-2 w-full rounded mb-2"
          value={unit}
          onChange={(e) => setUnits((u) => ({ ...u, [type]: e.target.value }))}
        >
          {UNITS.map((u) => (
            <option key={u}>{u}</option>
          ))}
        </select>

        <label className="block font-medium mb-1">{label} Size</label>
        <input
          className="border px-3 py-2 w-full rounded"
          value={displayValues[type] || ""}
          onChange={(e) => handleInputChange(type, e.target.value)}
          placeholder="输入面积或选择常用值"
        />
      </div>
    );
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="p-4 border rounded-xl shadow-md">
      <label className="block font-semibold mb-2">
        Build up Area / Land Area
      </label>

      <div className="flex gap-4 mb-4">
        {AREA_TYPES.map((t) => (
          <label key={t.value} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedTypes.includes(t.value)}
              onChange={() => toggleType(t.value)}
            />
            {t.label}
          </label>
        ))}
      </div>

      {selectedTypes.map(renderArea)}
    </div>
  );
}
