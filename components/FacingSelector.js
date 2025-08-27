// components/FacingSelector.js
import React, { useState, useEffect } from "react";

export default function FacingSelector({ value, onChange }) {
  // 如果 value 不是数组，就强制转换为空数组
  const arrValue = Array.isArray(value) ? value : [];

  const options = ["东", "南", "西", "北", "东南", "东北", "西南", "西北", "其他"];
  const [customValue, setCustomValue] = useState(
    arrValue.find((v) => !options.includes(v)) || ""
  );

  useEffect(() => {
    const other = arrValue.find((v) => !options.includes(v));
    setCustomValue(other || "");
  }, [arrValue]);

  const handleToggle = (option) => {
    if (option === "其他") {
      if (arrValue.includes("其他")) {
        onChange(arrValue.filter((v) => v !== "其他"));
        setCustomValue("");
      } else {
        onChange([...arrValue, "其他"]);
      }
    } else {
      if (arrValue.includes(option)) {
        onChange(arrValue.filter((v) => v !== option));
      } else {
        onChange([...arrValue, option]);
      }
    }
  };

  const handleCustomChange = (val) => {
    setCustomValue(val);
    const newValue = arrValue.filter((v) => v !== customValue && v !== "其他");
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
              arrValue.includes(o) ? "bg-blue-500 text-white" : "bg-white text-gray-700"
            }`}
          >
            {o}
          </button>
          {o === "其他" && arrValue.includes("其他") && (
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
