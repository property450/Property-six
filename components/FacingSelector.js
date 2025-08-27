// components/FacingSelector.js
import React from "react";

export default function FacingSelector({ value = [], onChange, customValue, onCustomChange }) {
  const options = ["东", "南", "西", "北", "东南", "东北", "西南", "西北", "其他"];

  const handleChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map((o) => o.value);
    onChange(selectedOptions);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">朝向</label>
      <select
        multiple
        value={value}
        onChange={handleChange}
        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>

      {value.includes("其他") && (
        <input
          type="text"
          className="mt-2 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          placeholder="请输入其他朝向"
          value={customValue}
          onChange={(e) => onCustomChange(e.target.value)}
        />
      )}
    </div>
  );
}
