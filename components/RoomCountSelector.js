// components/RoomCountSelector.js
"use client";

import { useState } from "react";

// 千分位格式化
const formatNumber = (num) => {
  if (!num && num !== 0) return "";
  const str = num.toString().replace(/,/g, "");
  if (str === "") return "";
  return Number(str).toLocaleString();
};

// 去除千分位，得到纯数字
const parseNumber = (str) => {
  return str.replace(/,/g, "");
};

export default function RoomCountSelector({ value = {}, onChange }) {
  const fields = [
    {
      key: "bedrooms",
      label: "卧室",
      options: ["Studio", 0, 1, 2, 3, 4, 5, 6, "custom"],
    },
    {
      key: "bathrooms",
      label: "浴室",
      options: [0, 1, 2, 3, 4, 5, 6, "custom"],
    },
    {
      key: "kitchens",
      label: "厨房",
      options: [1, 2, 3, 4, 5, 6, "custom"],
    },
    {
      key: "livingRooms",
      label: "客厅",
      options: [0, 1, 2, 3, 4, 5, 6, "custom"],
    },
  ];

  const [customFlags, setCustomFlags] = useState({});

  const handleSelectChange = (key, selected) => {
    if (selected === "custom") {
      setCustomFlags((prev) => ({ ...prev, [key]: true }));
      onChange({ ...value, [key]: "" });
    } else {
      setCustomFlags((prev) => ({ ...prev, [key]: false }));
      onChange({ ...value, [key]: selected });
    }
  };

  const handleInputChange = (key, val) => {
    const raw = parseNumber(val);
    if (!/^\d*$/.test(raw)) return; // 只允许数字
    if (raw.length > 7) return; // 最多 7 位
    onChange({ ...value, [key]: raw });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {fields.map((field) => {
        const currentValue = value[field.key];
        const isCustom = customFlags[field.key];
        const displayValue =
          typeof currentValue === "number" || /^\d+$/.test(currentValue)
            ? formatNumber(currentValue)
            : currentValue || "";

        return (
          <div key={field.key} className="flex flex-col">
            <label className="text-sm font-medium mb-1">{field.label}</label>
            <div className="relative">
              <select
                className="border rounded p-2 w-full mb-2"
                value={
                  isCustom
                    ? "custom"
                    : currentValue === "" || currentValue === undefined
                    ? ""
                    : currentValue
                }
                onChange={(e) => handleSelectChange(field.key, e.target.value)}
              >
                <option value="">选择数量</option>
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt === "custom" ? "自定义" : opt}
                  </option>
                ))}
              </select>

              {/* 输入框（数字可编辑） */}
              <input
                type="text"
                className="border rounded p-2 w-full"
                placeholder={
                  isCustom ? "请输入你要的数字" : "可直接修改已选择的数字"
                }
                value={displayValue}
                onChange={(e) => handleInputChange(field.key, e.target.value)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
