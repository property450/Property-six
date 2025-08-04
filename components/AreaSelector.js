// components/AreaSelector.js
"use client";
import React, { useState, useEffect } from "react";

const AREA_TYPES = [
  { label: "Build up Area", value: "buildUp" },
  { label: "Land Area", value: "land" },
];

const UNITS = ["square feet", "square meter", "acres", "hectares"];

const COMMON_VALUES = {
  buildUp: Array.from({ length: 149 }, (_, i) => 200 + i * 200), // 200–30,000
  land: Array.from({ length: 30000 }, (_, i) => i + 1), // 1–30,000
};

export default function AreaSelector({
  onChange = () => {},
  initialValue = {},
}) {
  const [selectedTypes, setSelectedTypes] = useState(
    initialValue.types || ["buildUp"]
  );

  const [units, setUnits] = useState({
    buildUp: initialValue.units?.buildUp || UNITS[0],
    land: initialValue.units?.land || UNITS[0],
  });

  const [customValues, setCustomValues] = useState(initialValue.custom || {});
  const [selectedValues, setSelectedValues] = useState(
    initialValue.selected || {}
  );

  // 保证至少选一个
  useEffect(() => {
    if (selectedTypes.length === 0) {
      setSelectedTypes(["buildUp"]);
    }
  }, [selectedTypes]);

  // 通知父组件变化
  useEffect(() => {
    onChange({
      types: selectedTypes,
      units,
      selected: selectedValues,
      custom: customValues,
    });
  }, [selectedTypes, units, selectedValues, customValues]);

  const handleCheckboxChange = (value) => {
    setSelectedTypes((prev) =>
      prev.includes(value)
        ? prev.length > 1
          ? prev.filter((v) => v !== value)
          : prev
        : [...prev, value]
    );
  };

  const handleSelectChange = (type, value) => {
    if (value === "custom") {
      setSelectedValues((prev) => ({ ...prev, [type]: "custom" }));
    } else {
      setSelectedValues((prev) => ({ ...prev, [type]: value }));
      setCustomValues((prev) => ({ ...prev, [type]: "" }));
    }
  };

  const handleCustomChange = (type, value) => {
    if (/^\d*\.?\d*$/.test(value)) {
      setCustomValues((prev) => ({ ...prev, [type]: value }));
    }
  };

  const handleUnitChange = (type, unitVal) => {
    setUnits((prev) => ({ ...prev, [type]: unitVal }));
  };

  const renderAreaInput = (type) => {
    const label = AREA_TYPES.find((t) => t.value === type).label;
    const selected = selectedValues[type];
    const isCustom = selected === "custom";
    const commonOptions = COMMON_VALUES[type];
    const unit = units[type];

    const custom = customValues[type];
    const customNumber = parseFloat(custom);

    const conversion =
      unit === "acres"
        ? customNumber * 43560
        : unit === "hectares"
        ? customNumber * 107639
        : null;

    return (
      <div key={type} className="mb-6">
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
        <select
          className="border px-3 py-2 w-full rounded"
          value={selected || ""}
          onChange={(e) => handleSelectChange(type, e.target.value)}
        >
          <option value="">Select {label}</option>
          <option value="custom">Custom</option>
          {commonOptions.map((val) => (
            <option key={val} value={val}>
              {val} {unit}
            </option>
          ))}
        </select>

        {isCustom && (
          <div className="relative mt-2">
            <input
              type="text"
              inputMode="decimal"
              value={custom || ""}
              onChange={(e) => handleCustomChange(type, e.target.value)}
              placeholder="Enter value"
              className="border px-3 py-2 pr-20 w-full rounded"
            />
            <span className="absolute right-3 top-2.5 text-gray-500 pointer-events-none">
              {unit}
            </span>
          </div>
        )}

        {isCustom && conversion && (
          <p className="text-sm text-gray-500 mt-1">
            ≈ {conversion.toLocaleString()} sq ft
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


  // 通知父组件变化
  
  const renderAreaInput = (type) => {
    const label = AREA_TYPES.find((t) => t.value === type).label;
    const selected = selectedValues[type];
    const isCustom = selected === "custom";
    const commonOptions = COMMON_VALUES[type];

    return (
      <div key={type} className="mb-4">
        <label className="block font-medium mb-1">{label}:</label>
        <select
          className="border px-3 py-2 w-full rounded"
          value={selected || ""}
          onChange={(e) => handleSelectChange(type, e.target.value)}
        >
          <option value="">Select {label}</option>
          <option value="custom">Custom</option>
          {commonOptions.map((val) => (
            <option key={val} value={val}>
              {val} {unit}
            </option>
          ))}
        </select>
        {isCustom && (
          <div className="relative mt-2">
            <input
              type="text"
              inputMode="decimal"
              value={customValues[type] || ""}
              onChange={(e) => handleCustomChange(type, e.target.value)}
              placeholder="Enter value"
              className="border px-3 py-2 pr-20 w-full rounded"
            />
            <span className="absolute right-3 top-2.5 text-gray-500 pointer-events-none">
              {unit}
            </span>
          </div>
        )}
      </div>
    );
  };

  
