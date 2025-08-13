// components/RoomCountSelector.js
import { useState } from "react";

export default function RoomCountSelector({ value = {}, onChange }) {
  const fields = [
    { key: "bedrooms", label: "卧室" },
    { key: "bathrooms", label: "浴室" },
    { key: "parking", label: "停车位" },
    { key: "kitchens", label: "厨房" },
    { key: "livingRooms", label: "客厅" },
  ];

  // 预设可选数字
  const options = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const handleChange = (key, val) => {
    onChange({
      ...value,
      [key]: val === "" ? "" : Number(val),
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {fields.map((field) => (
        <div key={field.key} className="flex flex-col">
          <label className="text-sm font-medium mb-1">{field.label}</label>
          <select
            className="border rounded p-2 mb-1"
            value={value[field.key] ?? ""}
            onChange={(e) => handleChange(field.key, e.target.value)}
          >
            <option value="">请选择</option>
            {options.map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder={`自定义${field.label}数量`}
            className="border rounded p-2"
            value={value[field.key] ?? ""}
            onChange={(e) => handleChange(field.key, e.target.value)}
            min="0"
          />
        </div>
      ))}
    </div>
  );
}
