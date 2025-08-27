// components/FacingSelector.js
import React, { useState } from "react";

export default function FacingSelector({ value = [], onChange }) {
  const options = ["东", "南", "西", "北", "东南", "东北", "西南", "西北", "其他"];
  const [customValue, setCustomValue] = useState(
    value.find((v) => !options.includes(v)) || ""
  );

  const handleToggle = (option) => {
    if (option === "其他") {
      if (value.includes("其他")) {
        onChange(value.filter((v) => v !== "其他"));
        setCustomValue("");
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
    setCustomValue(val);
    const newValue = value.filter((v) => v !== customValue); // 移除旧的自定义
    onChange([...newValue, val]);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <div key={o} className="flex items-center">
          <button
            type="button"
            onClick={() => handleToggle(o)}
            className={`px-3 py-1 border rounded mr-2 ${
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
