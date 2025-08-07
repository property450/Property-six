// components/FacingSelector.js
import React from 'react';

export default function FacingSelector({ value, onChange, customValue, onCustomChange }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">朝向</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
      >
        <option value="">请选择朝向</option>
        <option value="东">东</option>
        <option value="南">南</option>
        <option value="西">西</option>
        <option value="北">北</option>
        <option value="东南">东南</option>
        <option value="东北">东北</option>
        <option value="西南">西南</option>
        <option value="西北">西北</option>
        <option value="其他">其他</option>
      </select>

      {value === '其他' && (
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
