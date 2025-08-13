// components/RoomCountSelector.js
import { useState } from "react";

export default function RoomCountSelector({ values = {}, onChange }) {
  // 配置字段
  const fields = [
    { key: "bedrooms", label: "卧室" },
    { key: "bathrooms", label: "浴室" },
    { key: "parking", label: "停车位" },
    { key: "kitchen", label: "厨房" },
    { key: "livingroom", label: "客厅" },
  ];

  // 预设选项
  const options = [0, 1, 2, 3, 4, 5, "自定义"];

  const handleSelectChange = (fieldKey, selectedValue) => {
    if (selectedValue === "自定义") {
      onChange({
        ...values,
        [fieldKey]: "", // 清空值等待输入
      });
    } else {
      onChange({
        ...values,
        [fieldKey]: selectedValue,
      });
    }
  };

  const handleInputChange = (fieldKey, inputValue) => {
    onChange({
      ...values,
      [fieldKey]: inputValue,
    });
  };

  return (
    <div className="space-y-4">
      {fields.map((field) => {
        const value = values[field.key] ?? "";
        const isCustom = value === "" || !options.includes(value);

        return (
          <div key={field.key} className="flex items-center space-x-3">
            {/* 字段名 */}
            <label className="w-20">{field.label}</label>

            {/* 下拉选择 */}
            <select
              className="border p-2 rounded w-32"
              value={isCustom ? "自定义" : value}
              onChange={(e) =>
                handleSelectChange(field.key, isNaN(e.target.value) ? e.target.value : Number(e.target.value))
              }
            >
              {options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === "自定义" ? "自定义" : `${opt} 个`}
                </option>
              ))}
            </select>

            {/* 自定义输入框 */}
            {isCustom && (
              <input
                type="number"
                className="border p-2 rounded w-32"
                placeholder="请输入你要的数量"
                value={value}
                onChange={(e) => handleInputChange(field.key, Number(e.target.value))}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
