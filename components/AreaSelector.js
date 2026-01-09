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
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function isLandCategory(propertyCategory) {
  const raw = String(propertyCategory || "").toLowerCase().trim();
  if (!raw) return false;

  // ✅ 兼容：Land / Residential Land / Industrial Land / Land / Commercial 等
  return (
    raw === "land" ||
    raw.endsWith(" land") ||
    raw.includes(" land ") ||
    raw.startsWith("land ") ||
    raw.includes("land/") ||
    raw.includes("land /") ||
    raw.includes("residential land") ||
    raw.includes("industrial land") ||
    raw.includes("agricultural land") ||
    raw.includes("vacant land")
  );
}

export default function AreaSelector({
  onChange = () => {},
  initialValue = {},
  propertyCategory,
}) {
  /**
   * ✅ 关键修复点 1：
   * onChange 很多地方会用 inline function 传进来（每次 render 都是新函数）
   * 如果把 onChange 放进 useEffect 依赖，会导致无限循环。
   * 所以我们用 ref 保存最新的 onChange，effect 里不依赖它。
   */
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  /**
   * ✅ 初始化（只执行一次）：优先尊重 initialValue.types，否则按 category 默认
   */
  const [selectedTypes, setSelectedTypes] = useState(() => {
    if (Array.isArray(initialValue?.types) && initialValue.types.length > 0) {
      return initialValue.types;
    }
    return isLandCategory(propertyCategory) ? ["land"] : ["buildUp"];
  });

  const [units, setUnits] = useState(() => ({
    buildUp: initialValue?.units?.buildUp || UNITS[0],
    land: initialValue?.units?.land || UNITS[0],
  }));

  const [areaValues, setAreaValues] = useState(() => {
    return initialValue?.values || { buildUp: "", land: "" };
  });

  const [displayValues, setDisplayValues] = useState(() => ({
    buildUp: initialValue?.values?.buildUp ? formatNumber(initialValue.values.buildUp) : "",
    land: initialValue?.values?.land ? formatNumber(initialValue.values.land) : "",
  }));

  const [dropdownOpen, setDropdownOpen] = useState({ buildUp: false, land: false });

  const wrapperRef = useRef({ buildUp: null, land: null });

  /**
   * ✅ 关键修复点 2：
   * 只有当 propertyCategory “真的变化” 时，才自动切换默认勾选
   * （避免你切换 / rerender 过程中被反复 setState）
   */
  const prevCategoryRef = useRef(null);
  useEffect(() => {
    // 如果父组件没传 propertyCategory，就不要强行改（避免乱跳）
    if (propertyCategory === undefined) return;

    // 只在 category 变化时触发
    if (prevCategoryRef.current === propertyCategory) return;
    prevCategoryRef.current = propertyCategory;

    const land = isLandCategory(propertyCategory);

    setSelectedTypes(land ? ["land"] : ["buildUp"]);

    // 关掉另外一边的 dropdown，避免 UI 乱
    setDropdownOpen((p) => ({
      ...p,
      buildUp: land ? false : p.buildUp,
      land: land ? p.land : false,
    }));
  }, [propertyCategory]);

  /**
   * ✅ 关键修复点 3：
   * 回传给父组件时，不把 onChange 放进依赖，避免循环
   */
  useEffect(() => {
    onChangeRef.current?.({
      types: selectedTypes,
      units,
      values: areaValues,
    });
  }, [selectedTypes, units, areaValues]);

  // ✅ 点击外部关闭下拉
  useEffect(() => {
    const handleClickOutside = (e) => {
      AREA_TYPES.forEach((t) => {
        const node = wrapperRef.current[t.value];
        if (node && !node.contains(e.target)) {
          setDropdownOpen((prev) => ({ ...prev, [t.value]: false }));
        }
      });
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCheckboxChange = (type) => {
    setSelectedTypes((prev) => {
      const has = prev.includes(type);

      // 取消勾选：不允许变成 0 个（至少留一个）
      if (has) {
        if (prev.length === 1) return prev;

        setDropdownOpen((p) => ({ ...p, [type]: false }));
        return prev.filter((t) => t !== type);
      }

      // 勾选：允许用户手动加第二个
      return [...prev, type];
    });
  };

  const handleUnitChange = (type, unitVal) => {
    setUnits((prev) => ({ ...prev, [type]: unitVal }));
  };

  const handleInputChange = (type, input) => {
    const plain = String(input ?? "").replace(/,/g, "");

    // 只允许数字 + 小数点
    if (!/^\d*\.?\d*$/.test(plain)) return;

    // 小数最多 3 位（保持你原本习惯）
    const parts = plain.split(".");
    if (parts[1]?.length > 3) return;

    setAreaValues((prev) => ({ ...prev, [type]: plain }));
    setDisplayValues((prev) => ({ ...prev, [type]: formatNumber(plain) }));
  };

  const handleSelectCommonValue = (type, val) => {
    const raw = String(val);
    setAreaValues((prev) => ({ ...prev, [type]: raw }));
    setDisplayValues((prev) => ({ ...prev, [type]: formatNumber(raw) }));
    setDropdownOpen((prev) => ({ ...prev, [type]: false }));
  };

  const getConvertedPreview = (type) => {
    const val = parseFloat(String(areaValues[type] || "").replace(/,/g, ""));
    if (!Number.isFinite(val) || val <= 0) return "";

    const unit = String(units[type] || "").toLowerCase();
    let sqft = val;

    if (unit.includes("square meter")) sqft = val * 10.7639;
    else if (unit.includes("acres")) sqft = val * 43560;
    else if (unit.includes("hectares")) sqft = val * 107639;

    return `≈ ${sqft.toLocaleString(undefined, { maximumFractionDigits: 0 })} sq ft`;
  };

  const renderAreaInput = (type) => {
    const label = AREA_TYPES.find((t) => t.value === type)?.label;
    const unit = units[type];
    const displayVal = displayValues[type] || "";
    const preview = getConvertedPreview(type);

    return (
      <div
        key={type}
        className="mb-6"
        ref={(el) => (wrapperRef.current[type] = el)}
      >
        <label className="block font-semibold mb-2">{label} Unit</label>
        <select
          className="border px-3 py-2 w-full mb-2 rounded bg-white"
          value={unit}
          onChange={(e) => handleUnitChange(type, e.target.value)}
        >
          {UNITS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>

        <label className="block font-medium mb-1">{label} Size</label>

        <div className="relative">
          {/* ✅ 右侧显示单位 */}
          <input
            className="border px-3 py-2 w-full rounded pr-32"
            value={displayVal}
            placeholder="输入面积或选择常用值"
            onFocus={() => setDropdownOpen((p) => ({ ...p, [type]: true }))}
            onChange={(e) => handleInputChange(type, e.target.value)}
          />

          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
            {unit}
          </span>

          {dropdownOpen[type] && (
            <div className="absolute z-20 w-full bg-white border rounded mt-1 max-h-56 overflow-y-auto">
              {COMMON_VALUES.map((v) => (
                <div
                  key={v}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  onMouseDown={(e) => {
                    e.preventDefault(); // 防止 blur 先把 dropdown 关掉
                    handleSelectCommonValue(type, v);
                  }}
                >
                  {v.toLocaleString()}
                </div>
              ))}
            </div>
          )}
        </div>

        {preview ? <p className="text-sm text-gray-500 mt-1">{preview}</p> : null}
      </div>
    );
  };

  return (
    <div className="p-4 border rounded-xl shadow-md bg-white">
      <label className="block font-semibold mb-2">Build up Area / Land Area</label>

      <div className="flex gap-4 mb-4">
        {AREA_TYPES.map((t) => (
          <label key={t.value} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedTypes.includes(t.value)}
              onChange={() => handleCheckboxChange(t.value)}
            />
            {t.label}
          </label>
        ))}
      </div>

      {selectedTypes.map((t) => renderAreaInput(t))}
    </div>
  );
}
