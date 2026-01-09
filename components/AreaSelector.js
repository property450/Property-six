"use client";
import React, { useState, useEffect, useRef } from "react";

const AREA_TYPES = [
  { label: "Build up Area", value: "buildUp" },
  { label: "Land Area", value: "land" },
];

const UNITS = ["square feet", "square meter", "acres", "hectares"];
const COMMON_VALUES = Array.from({ length: 149 }, (_, i) => 200 + i * 200); // 200–30,000

export default function AreaSelector({
  onChange = () => {},
  initialValue = {},
  propertyCategory, // ✅ 新增：用来判断是否为 Land
}) {
  // ✅ 默认：非 Land 只勾 buildUp；Land 类别只勾 land
  const isLandCategoryInit = String(propertyCategory || "").trim() === "Land";
  const [selectedTypes, setSelectedTypes] = useState(() => {
    // ✅ 如果是编辑旧数据（initialValue.types 有值），就尊重旧数据
    if (Array.isArray(initialValue.types) && initialValue.types.length > 0) return initialValue.types;
    return isLandCategoryInit ? ["land"] : ["buildUp"];
  });

  const [units, setUnits] = useState({
    buildUp: initialValue.units?.buildUp || UNITS[0],
    land: initialValue.units?.land || UNITS[0],
  });

  const [areaValues, setAreaValues] = useState(
    initialValue.values || { buildUp: "", land: "" }
  );

  const [displayValues, setDisplayValues] = useState({
    buildUp: initialValue.values?.buildUp ? formatNumber(initialValue.values.buildUp) : "",
    land: initialValue.values?.land ? formatNumber(initialValue.values.land) : "",
  });

  const [dropdownOpen, setDropdownOpen] = useState({ buildUp: false, land: false });

  // ✅ 当 Property Category 切到 Land / 退出 Land：自动切换默认勾选（不改你原本的 UI/下拉逻辑）
  useEffect(() => {
    const isLand = String(propertyCategory || "").trim() === "Land";

    if (isLand) {
      // Land：默认只勾 land，并清空 buildUp（避免旧值继续参与 PSF 等计算）
      setSelectedTypes(["land"]);
      setAreaValues((p) => ({ ...p, buildUp: "" }));
      setDisplayValues((p) => ({ ...p, buildUp: "" }));
      setDropdownOpen((p) => ({ ...p, buildUp: false }));
    } else {
      // 非 Land：默认只勾 buildUp，并清空 land
      setSelectedTypes(["buildUp"]);
      setAreaValues((p) => ({ ...p, land: "" }));
      setDisplayValues((p) => ({ ...p, land: "" }));
      setDropdownOpen((p) => ({ ...p, land: false }));
    }
  }, [propertyCategory]);

  const wrapperRef = useRef({ buildUp: null, land: null });

  useEffect(() => {
    // 点击外部关闭下拉
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

  useEffect(() => {
    // 回传给父组件
    onChange({
      types: selectedTypes,
      units,
      values: areaValues,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTypes, units, areaValues]);

  function formatNumber(num) {
    const n = parseFloat(String(num || "").replace(/,/g, ""));
    if (!Number.isFinite(n)) return "";
    return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  const handleCheckboxChange = (type) => {
    setSelectedTypes((prev) => {
      // 取消勾选
      if (prev.includes(type)) {
        // 不允许清空到 0（至少留一个）
        if (prev.length === 1) return prev;

        // 清空被取消的值 + 关闭下拉
        setAreaValues((p) => ({ ...p, [type]: "" }));
        setDisplayValues((p) => ({ ...p, [type]: "" }));
        setDropdownOpen((p) => ({ ...p, [type]: false }));

        return prev.filter((t) => t !== type);
      }

      // 勾选
      return [...prev, type];
    });
  };

  const handleUnitChange = (type, unit) => {
    setUnits((prev) => ({ ...prev, [type]: unit }));
  };

  const handleInputChange = (type, input) => {
    // 允许输入逗号显示，但内部存纯数字
    const raw = String(input || "").replace(/,/g, "");
    if (!/^\d*\.?\d*$/.test(raw)) return;

    setAreaValues((prev) => ({ ...prev, [type]: raw }));
    setDisplayValues((prev) => ({ ...prev, [type]: formatNumber(raw) }));
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
      <div key={type} className="mb-6" ref={(el) => (wrapperRef.current[type] = el)}>
        <label className="block font-semibold mb-2">{label} Unit</label>
        <select
          className="border px-3 py-2 w-full mb-2 rounded"
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
          <input
            className="border px-3 py-2 w-full rounded"
            value={displayVal}
            placeholder="输入面积或选择常用值"
            onFocus={() => setDropdownOpen((p) => ({ ...p, [type]: true }))}
            onChange={(e) => handleInputChange(type, e.target.value)}
          />

          {dropdownOpen[type] && (
            <div className="absolute z-20 w-full bg-white border rounded mt-1 max-h-56 overflow-y-auto">
              {COMMON_VALUES.map((v) => (
                <div
                  key={v}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  onMouseDown={(e) => {
                    // 防止 input 失焦导致 dropdown 先关掉
                    e.preventDefault();
                    handleSelectCommonValue(type, v);
                  }}
                >
                  {v.toLocaleString()}
                </div>
              ))}
            </div>
          )}
        </div>

        {preview ? <div className="text-sm text-gray-500 mt-1">{preview}</div> : null}
      </div>
    );
  };

  return (
    <div className="p-4 border rounded-xl shadow-md">
      <label className="block font-semibold mb-2">Build up Area / Land Area</label>

      <div className="flex gap-4 mb-4">
        {AREA_TYPES.map((type) => (
          <label key={type.value} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedTypes.includes(type.value)}
              onChange={() => handleCheckboxChange(type.value)}
            />
            {type.label}
          </label>
        ))}
      </div>

      {selectedTypes.map((type) => renderAreaInput(type))}
    </div>
  );
}
