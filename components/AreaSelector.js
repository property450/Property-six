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

export default function AreaSelector({ onChange = () => {}, initialValue = {} }) {
  const [selectedTypes, setSelectedTypes] = useState(initialValue.types || ["buildUp"]);

  const [units, setUnits] = useState({
    buildUp: initialValue.units?.buildUp || UNITS[0],
    land: initialValue.units?.land || UNITS[0],
  });

  const [areaValues, setAreaValues] = useState(initialValue.values || {
    buildUp: "",
    land: "",
  });

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
      values: areaValues,
    });
  }, [selectedTypes, units, areaValues]);

  const handleCheckboxChange = (value) => {
    setSelectedTypes((prev) =>
      prev.includes(value)
        ? prev.length > 1
          ? prev.filter((v) => v !== value)
          : prev
        : [...prev, value]
    );
  };

  const handleUnitChange = (type, unitVal) => {
    setUnits((prev) => ({ ...prev, [type]: unitVal }));
  };

  const handleValueChange = (type, value) => {
    if (/^\d*\.?\d*$/.test(value)) {
      setAreaValues((prev) => ({ ...prev, [type]: value }));
    }
  };

  const handleSelectCommon = (type, val) => {
    setAreaValues((prev) => ({ ...prev, [type]: String(val) }));
  };

  const convertToSqFt = (val, unit) => {
    const num = parseFloat(val);
    if (isNaN(num)) return "";

    switch (unit) {
      case "acres":
        return (num * 43560).toFixed(2);
      case "hectares":
        return (num * 107639).toFixed(2);
      case "square meter":
        return (num * 10.7639).toFixed(2);
      case "square feet":
      default:
        return num.toFixed(2);
    }
  };

  const renderAreaInput = (type) => {
    const label = AREA_TYPES.find((t) => t.value === type)?.label;
    const unit = units[type];
    const val = areaValues[type] || "";

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
        <div className="flex gap-2 mb-2">
          <select
            className="border px-3 py-2 w-1/2 rounded"
            onChange={(e) => handleSelectCommon(type, e.target.value)}
            value=""
          >
            <option value="">选择常用值</option>
            {COMMON_VALUES[type].slice(0, 50).map((v) => (
              <option key={v} value={v}>
                {v} {unit}
              </option>
            ))}
          </select>

          <div className="relative w-1/2">
            <input
              type="text"
              inputMode="decimal"
              value={val}
              onChange={(e) => handleValueChange(type, e.target.value)}
              placeholder="输入面积"
              className="border px-3 py-2 pr-20 w-full rounded"
            />
            <span className="absolute right-3 top-2.5 text-gray-500 pointer-events-none">
              {unit}
            </span>
          </div>
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
