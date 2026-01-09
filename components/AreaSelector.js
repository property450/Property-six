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
  propertyCategory, // ✅ 新增：用来判断 Land
}) {
  // ✅ 原本逻辑：尊重 initialValue.types；否则默认 buildUp
  const [selectedTypes, setSelectedTypes] = useState(
    initialValue.types || ["buildUp"]
  );

  const [units, setUnits] = useState({
    buildUp: initialValue.units?.buildUp || UNITS[0],
    land: initialValue.units?.land || UNITS[0],
  });

  const [areaValues, setAreaValues] = useState(
    initialValue.values || { buildUp: "", land: "" }
  );

  const [displayValues, setDisplayValues] = useState({
    buildUp: initialValue.values?.buildUp
      ? formatNumber(initialValue.values.buildUp)
      : "",
    land: initialValue.values?.land ? formatNumber(initialValue.values.land) : "",
  });

  const [dropdownOpen, setDropdownOpen] = useState({
    buildUp: false,
    land: false,
  });

  const wrapperRef = useRef({ buildUp: null, land: null });

  // ✅ 点击外部关闭下拉（保留你原本）
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

  // ✅ 保留你原本：不允许 selectedTypes 变成空
  useEffect(() => {
    if (selectedTypes.length === 0) setSelectedTypes(["buildUp"]);
  }, [selectedTypes]);

  // ✅ 关键新增：category=Land 自动切换默认勾选
  useEffect(() => {
  const raw = String(propertyCategory || "").toLowerCase();

  /**
   * Land 判断规则（一次解决所有模式）：
   * - land
   * - residential land
   * - industrial land
   * - agricultural land
   * - vacant land
   * - land / xxx
   */
  const isLand =
    raw === "land" ||
    raw.endsWith(" land") ||
    raw.startsWith("land ") ||
    raw.includes(" land ") ||
    raw.includes("land/") ||
    raw.includes("land /");

  if (isLand) {
    setSelectedTypes(["land"]);
    setDropdownOpen((p) => ({ ...p, buildUp: false }));
  } else {
    setSelectedTypes(["buildUp"]);
    setDropdownOpen((p) => ({ ...p, land: false }));
  }
}, [propertyCategory]);

  // ✅ 回传（保留你原本）
  useEffect(() => {
    onChange({ types: selectedTypes, units, values: areaValues });
  }, [selectedTypes, units, areaValues, onChange]);

  function formatNumber(num) {
    const plain = String(num || "").replace(/,/g, "");
    const n = parseFloat(plain);
    if (!Number.isFinite(n)) return "";
    return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  const handleCheckboxChange = (value) => {
    setSelectedTypes((prev) => {
      if (prev.includes(value)) {
        if (prev.length > 1) {
          setAreaValues((prevVals) => ({ ...prevVals, [value]: "" }));
          setDisplayValues((prevVals) => ({ ...prevVals, [value]: "" }));
          setDropdownOpen((prevDrop) => ({ ...prevDrop, [value]: false }));
          return prev.filter((v) => v !== value);
        } else return prev;
      } else return [...prev, value];
    });
  };

  const handleUnitChange = (type, unitVal) => {
    setUnits((prev) => ({ ...prev, [type]: unitVal }));
  };

  const handleInputChange = (type, input) => {
    const plain = input.replace(/,/g, "");
    if (!/^\d*\.?\d*$/.test(plain)) return;

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

    return `≈ ${sqft.toLocaleString(undefined, {
      maximumFractionDigits: 0,
    })} sq ft`;
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
          {/* ✅ 新增：右侧显示单位，所以加 pr-32 */}
          <input
            className="border px-3 py-2 w-full rounded pr-32"
            value={displayVal}
            placeholder="输入面积或选择常用值"
            onFocus={() => setDropdownOpen((p) => ({ ...p, [type]: true }))}
            onChange={(e) => handleInputChange(type, e.target.value)}
          />

          {/* ✅ 新增：输入框右侧单位显示 */}
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

        {preview ? <p className="text-sm text-gray-500 mt-1">{preview}</p> : null}
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

      {selectedTypes.map((t) => renderAreaInput(t))}
    </div>
  );
}
