"use client";
import { useState } from "react";
import UnitLayoutForm from "./UnitLayoutForm";

export default function UnitTypeSelector({ propertyStatus, onChange }) {
  const [count, setCount] = useState("");
  const [types, setTypes] = useState([]);

  const shouldShow =
    propertyStatus?.includes("New Project") ||
    propertyStatus?.includes("Under Construction") ||
    propertyStatus?.includes("Completed Unit") ||
    propertyStatus?.includes("Developer Unit");

  if (!shouldShow) return null;

  const handleSelect = (e) => {
    const num = parseInt(e.target.value, 10);
    setCount(num);
    const layouts = Array.from({ length: num }, () => ({}));
    setTypes(layouts);
    onChange(layouts); // 💡 通知父组件
  };

  return (
    <div className="mb-6">
      <label className="block font-medium mb-2">这个项目有多少个房型？</label>
      <select
        className="border p-2 rounded"
        onChange={handleSelect}
        value={count || ""}
      >
        <option value="">请选择</option>
        {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
    </div>
  );
}
