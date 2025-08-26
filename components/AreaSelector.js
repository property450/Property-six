"use client";
import React, { useState, useEffect, useRef } from "react";

const AREA_TYPES = [
  { label: "Build up Area", value: "buildUp" },
  { label: "Land Area", value: "land" },
];

const UNITS = ["square feet", "square meter", "acres", "hectares"];
const COMMON_VALUES = Array.from({ length: 149 }, (_, i) => 200 + i * 200); // 200–30,000

export default function AreaSelector({ onChange = () => {}, initialValue = {} }) {
  const [selectedTypes, setSelectedTypes] = useState(initialValue.types || ["buildUp"]);
  const [units, setUnits] = useState({
    buildUp: initialValue.units?.buildUp || UNITS[0],
    land: initialValue.units?.land || UNITS[0],
  });
  const [areaValues, setAreaValues] = useState(initialValue.values || { buildUp: "", land: "" });
  const [displayValues, setDisplayValues] = useState({ buildUp: "", land: "" });
  const [dropdownOpen, setDropdownOpen] = useState({ buildUp: false, land: false });

  const wrapperRef = useRef({ buildUp: null, land: null });

  // 点击外部关闭下拉
  useEffect(() => {
    const handleClickOutside = (event) => {
      AREA_TYPES.forEach((type) => {
        if (wrapperRef.current[type.value] && !wrapperRef.current[type.value].contains(event.target)) {
          setDropdownOpen((prev) => ({ ...prev, [type.value]: false }));
        }
      });
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedTypes.length === 0) setSelectedTypes(["buildUp"]);
  }, [selectedTypes]);

  useEffect(() => {
    onChange({ types: selectedTypes, units, values: areaValues });
  }, [selectedTypes, units, areaValues]);

  const handleCheckboxChange = (value) => {
    setSelectedTypes((prev) => {
      if (prev.includes(value)) {
        if (prev.length > 1) {
          setAreaValues((prevVals) => ({ ...prevVals, [value]: "" }));
          setDisplayValues((prevVals) => ({ ...prevVals, [value]: "" }));
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

    let formatted = Number(plain).toLocaleString(undefined, {
      minimumFractionDigits: parts[1]?.length || 0,
      maximumFractionDigits: 3,
    });

    if (plain.endsWith(".")) formatted += ".";
    if (parts.length === 2 && !parts[1].endsWith("0") && input.endsWith("0")) formatted += "0";

    setDisplayValues((prev) => ({ ...prev, [type]: formatted }));
  };

  const handleSelectCommon = (type, val) => {
    const str = String(val);
    const formatted = Number(str).toLocaleString();
    setAreaValues((prev) => ({ ...prev, [type]: str }));
    setDisplayValues((prev) => ({ ...prev, [type]: formatted }));
    setDropdownOpen((prev) => ({ ...prev, [type]: false }));
  };

  const convertToSqFt = (val, unit) => {
    const num = parseFloat(val);
    if (isNaN(num)) return "";
    let result;
    switch (unit) {
      case "acres":
        result = num * 43560;
        break;
      case "hectares":
        result = num * 107639;
        break;
      case "square meter":
        result = num * 10.7639;
        break;
      default:
        result = num;
    }
    return result.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const renderAreaInput = (type) => {
    const label = AREA_TYPES.find((t) => t.value === type)?.label;
    const unit = units[type];
    const val = areaValues[type] || "";
    const displayVal = displayValues[type] || "";

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
            type="text"
            value={displayVal}
            onChange={(e) => handleInputChange(type, e.target.value)}
            onFocus={() => setDropdownOpen((prev) => ({ ...prev, [type]: true }))}
            placeholder="输入面积或选择常用值"
            className="border px-3 py-2 pr-20 w-full rounded"
          />
          <span className="absolute right-3 top-2.5 text-gray-500 pointer-events-none">{unit}</span>

          {dropdownOpen[type] && (
            <ul className="absolute z-10 w-full bg-white border mt-1 max-h-60 overflow-y-auto rounded shadow">
              {COMMON_VALUES.map((v) => (
                <li
                  key={v}
                  onClick={() => handleSelectCommon(type, v)}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  {v.toLocaleString()} {unit}
                </li>
              ))}
            </ul>
          )}
        </div>

        {val && (
          <p className="text-sm text-gray-500 mt-1">
            ≈ {convertToSqFt(val, unit)} sq ft
          </p>
        )}
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
