// components/FacingSelector.js
import React, { useState, useEffect } from "react";

export default function FacingSelector({ value = [], onChange, customValue, onCustomChange }) {
  const options = ["东", "南", "西", "北", "东南", "东北", "西南", "西北", "其他"];

  // 同步 customValue，如果 value 中有不是选项的，就是自定义值
  useEffect(() => {
    const other = value.find((v) => !options.includes(v));
    if (other) {
      onCustomChange(other);
    }
  }, [value]);

  const handleToggle = (option) => {
    if (option === "其他") {
      if (value.includes("其他")) {
        onChange(value.filter((v) => v !== "其他"));
        onCustomChange("");
      } else {
        onChange([...value, "其他"]);
      }
    } else {
      if (value.includes(option)) {
        onChange(value.filter((v) => v !== option));
      } else {
        onChange([...value, option]);
      }
    }
  };

  const handleCustomChange = (val) => {
    onCustomChange(val);
    const newValue = value.filter((v) => v !== customValue && v !== "其他");
    onChange([...newValue, "其他", val]);
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {options.map((o) => (
        <div key={o} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleToggle(o)}
            className={`px-3 py-1 border rounded ${
              value.includes(o) ? "bg-blue-500 text-white" : "bg-white text-gray-700"
            }`}
          >
            {o}
          </button>
          {o === "其他" && value.includes("其他") && (
            <input
              type="text"
              className="border p-1 rounded"
              placeholder="请输入其他朝向"
              value={customValue}
              onChange={(e) => handleCustomChange(e.target.value)}
            />
          )}
        </div>
      ))}
    </div>
  );
}
