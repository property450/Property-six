"use client";
import { useState } from "react";
import UnitLayoutForm from "./UnitLayoutForm";

export default function UnitTypeSelector({ propertyStatus }) {
  const [count, setCount] = useState("");
  const [customMode, setCustomMode] = useState(false);
  const [types, setTypes] = useState([]);

  const shouldShow =
    propertyStatus?.includes("New Project") ||
    propertyStatus?.includes("Under Construction") ||
    propertyStatus?.includes("Completed Unit") ||
    propertyStatus?.includes("Developer Unit");

  if (!shouldShow) return null;

  const handleSelect = (e) => {
    const val = e.target.value;
    if (val === "custom") {
      setCustomMode(true);
      setCount("");
      setTypes([]);
    } else {
      setCustomMode(false);
      const num = parseInt(val, 10);
      setCount(num);
      setTypes(Array.from({ length: num }, () => ({})));
    }
  };

  const handleCustomInput = (val) => {
    if (/^\d{0,5}$/.test(val)) {
      const num = val === "" ? "" : parseInt(val, 10);
      setCount(num);
      if (num) {
        setTypes(Array.from({ length: num }, () => ({})));
      } else {
        setTypes([]);
      }
    }
  };

  const updateLayout = (index, newData) => {
    const newTypes = [...types];
    newTypes[index] = { ...newTypes[index], ...newData };
    setTypes(newTypes);
  };

  return (
    <div className="mb-6">
      <label className="block font-medium mb-2">这个项目有多少个房型？</label>
      <div className="flex gap-2 items-center">
        <select
          className="border p-2 rounded"
          onChange={handleSelect}
          value={customMode ? "custom" : count || ""}
        >
          <option value="">请选择</option>
          {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
          <option value="custom">自定义</option>
        </select>

        {customMode && (
          <input
            type="text"
            placeholder="输入数量 (最多5位数)"
            value={count}
            onChange={(e) => handleCustomInput(e.target.value)}
            className="border p-2 rounded w-40"
          />
        )}
      </div>

      {types.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {types.map((t, idx) => (
            <UnitLayoutForm
              key={idx}
              index={idx}
              data={t}
              onChange={(newData) => updateLayout(idx, newData)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
