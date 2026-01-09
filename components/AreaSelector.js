// components/AreaSelector.js
"use client";

import React, { useEffect, useRef, useState } from "react";

const AREA_TYPES = [
  { label: "Build up Area", value: "buildUp" },
  { label: "Land Area", value: "land" },
];

const UNITS = ["square feet", "square meter", "acres", "hectares"];
const COMMON_VALUES = Array.from({ length: 149 }, (_, i) => 200 + i * 200); // 200–30,000

function formatNumber(num) {
  const plain = String(num ?? "").replace(/,/g, "").trim();
  const n = parseFloat(plain);
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString(undefined, { maximumFractionDigits: 3 });
}

function isLandCategory(category) {
  const v = String(category || "").toLowerCase();
  return (
    v === "land" ||
    v.includes(" land") ||
    v.includes("residential land") ||
    v.includes("industrial land") ||
    v.includes("agricultural land")
  );
}

export default function AreaSelector({
  onChange = () => {},
  initialValue = {},
  propertyCategory,
}) {
  /* ---------------- onChange ref（防无限循环） ---------------- */
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  /* ---------------- 初始选中逻辑 ---------------- */
  const [selectedTypes, setSelectedTypes] = useState(() => {
    if (Array.isArray(initialValue?.types) && initialValue.types.length > 0) {
      return initialValue.types;
    }
    return isLandCategory(propertyCategory) ? ["land"] : ["buildUp"];
  });

  const [units, setUnits] = useState({
    buildUp: initialValue?.units?.buildUp || "square feet",
    land: initialValue?.units?.land || "square feet",
  });

  const [areaValues, setAreaValues] = useState(
    initialValue?.values || { buildUp: "", land: "" }
  );

  const [displayValues, setDisplayValues] = useState({
    buildUp: initialValue?.values?.buildUp
      ? formatNumber(initialValue.values.buildUp)
      : "",
    land: initialValue?.values?.land
      ? formatNumber(initialValue.values.land)
      : "",
  });

  const [dropdownOpen, setDropdownOpen] = useState({
    buildUp: false,
    land: false,
  });

  const wrapperRef = useRef({ buildUp: null, land: null });

  /* ---------------- category 切换时自动勾选 ---------------- */
  const prevCategoryRef = useRef();
  useEffect(() => {
    if (propertyCategory === undefined) return;
    if (prevCategoryRef.current === propertyCategory) return;

    prevCategoryRef.current = propertyCategory;
    const land = isLandCategory(propertyCategory);

    setSelectedTypes(land ? ["land"] : ["buildUp"]);
    setDropdownOpen({ buildUp: false, land: false });
  }, [propertyCategory]);

  /* ---------------- 回传给父组件 ---------------- */
  useEffect(() => {
    onChangeRef.current({
      types: selectedTypes,
      units,
      values: areaValues,
    });
  }, [selectedTypes, units, areaValues]);

  /* ---------------- 点击外部关闭下拉 ---------------- */
  useEffect(() => {
    const handler = (e) => {
      ["buildUp", "land"].forEach((t) => {
        if (wrapperRef.current[t] && !wrapperRef.current[t].contains(e.target)) {
          setDropdownOpen((p) => ({ ...p, [t]: false }));
        }
      });
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ---------------- handlers ---------------- */
  const toggleType = (type) => {
    setSelectedTypes((prev) => {
      const has = prev.includes(type);
      if (has && prev.length === 1) return prev;
      if (has) return prev.filter((t) => t !== type);
      return [...prev, type];
    });
  };

  const handleInput = (type, v) => {
    const raw = v.replace(/,/g, "");
    if (!/^\d*\.?\d*$/.test(raw)) return;

    setAreaValues((p) => ({ ...p, [type]: raw }));
    setDisplayValues((p) => ({ ...p, [type]: formatNumber(raw) }));
  };

  const renderArea = (type) => {
    const unit = units[type];
    return (
      <div
        key={type}
        ref={(el) => (wrapperRef.current[type] = el)}
        className="mb-6"
      >
        <label className="block font-semibold mb-2">
          {type === "buildUp" ? "Build up Area Unit" : "Land Area Unit"}
        </label>
        <select
          className="border p-2 w-full rounded mb-2"
          value={unit}
          onChange={(e) =>
            setUnits((p) => ({ ...p, [type]: e.target.value }))
          }
        >
          {UNITS.map((u) => (
            <option key={u}>{u}</option>
          ))}
        </select>

        <label className="block font-medium mb-1">Area Size</label>

        <div className="relative">
          <input
            className="border p-2 w-full rounded pr-32"
            value={displayValues[type]}
            placeholder="输入面积或选择常用值"
            onFocus={() => setDropdownOpen((p) => ({ ...p, [type]: true }))}
            onChange={(e) => handleInput(type, e.target.value)}
          />

          {/* 右侧单位显示 */}
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none">
            {unit}
          </span>

          {dropdownOpen[type] && (
            <div className="absolute z-20 bg-white border rounded w-full max-h-56 overflow-y-auto">
              {COMMON_VALUES.map((v) => (
                <div
                  key={v}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleInput(type, String(v));
                    setDropdownOpen((p) => ({ ...p, [type]: false }));
                  }}
                >
                  {v.toLocaleString()}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ---------------- render ---------------- */
  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm">
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
