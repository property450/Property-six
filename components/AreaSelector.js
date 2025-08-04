"use client";
import React, { useState, useEffect } from "react";

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

  const [areaValues, setAreaValues] = useState(initialValue.values || {
    buildUp: "",
    land: "",
  });

  const [displayValues, setDisplayValues] = useState({
    buildUp: "",
    land: "",
  });

  const [rawInputValues, setRawInputValues] = useState({
    buildUp: "",
    land: "",
  });

  useEffect(() => {
    if (selectedTypes.length === 0) {
      setSelectedTypes(["buildUp"]);
    }
  }, [selectedTypes]);

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
const handleValueChange = (type, input) => {
  // 清除逗号
  const plain = input.replace(/,/g, "");

  // 校验合法输入：数字、小数点，只允许一个小数点
  if (!/^\d*\.?\d*$/.test(plain)) return;

  // 限制最多 3 位小数
  const parts = plain.split(".");
  if (parts[1]?.length > 3) return;

  // 更新数值（提交用）
  setAreaValues((prev) => ({ ...prev, [type]: plain }));

  // 判断是否为小数点结尾，例如 "1234." 或 "0."
  const isDotEnd = plain.endsWith(".") && parts.length === 2;
  const isDecimalTyping = parts.length === 2 && !parts[1].endsWith("0") && input.endsWith("0");

  // 格式化显示的值（带千分位），但保留小数点和正在输入的小数部分
  let formatted = Number(plain).toLocaleString(undefined, {
    minimumFractionDigits: parts[1]?.length || 0,
    maximumFractionDigits: 3,
  });

  if (isDotEnd) {
    formatted += ".";
  } else if (isDecimalTyping) {
    formatted += "0";
  }

  // 显示格式化值（含千分位）
  setRawInputValues((prev) => ({ ...prev, [type]: formatted }));
};

  const handleSelectCommon = (type, val) => {
    const str = String(val);
    const formatted = Number(str).toLocaleString(undefined, {
      maximumFractionDigits: 3,
    });

    setAreaValues((prev) => ({ ...prev, [type]: str }));
    setDisplayValues((prev) => ({ ...prev, [type]: formatted }));
    setRawInputValues((prev) => ({ ...prev, [type]: str }));
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
    const displayVal = rawInputValues[type] || "";

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
            onChange={(e) => {
              if (e.target.value !== "") {
                handleSelectCommon(type, e.target.value);
              }
            }}
          >
            <option value="">选择常用值</option>
            {COMMON_VALUES.map((v) => (
              <option key={v} value={v}>
                {v.toLocaleString()} {unit}
              </option>
            ))}
          </select>

          <div className="relative w-1/2">
            <input
              type="text"
              inputMode="decimal"
              value={displayVal}
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
