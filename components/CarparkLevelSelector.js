// components/CarparkLevelSelector.js
import React from 'react';

export default function CarparkLevelSelector({
  value,
  onChange,
  customValue,
  setCustomValue,
}) {
  const options = [
    // 地下楼层 Basement 10 ~ Basement 1
    ...Array.from({ length: 10 }, (_, i) => `Basement ${10 - i}`),

    // 地下地面过渡层 LG3 ~ LG1
    'LG3', 'LG2', 'LG1',

    // 地面与夹层
    'G', 'UG', 'M1', 'M2', 'M3',

    // Podium 层
    'P1', 'P2', 'P3', 'P3A', 'P4', 'P5',

    // Level 1 ~ Level 30，带 3A、13A、可能的 4
    ...Array.from({ length: 30 }, (_, i) => {
      const level = i + 1;
      const base = `Level ${level}`;
      if (level === 4) return ['Level 3A', base];
      if (level === 14) return ['Level 13A', base];
      return base;
    }).flat(),

    // 顶层
    'R', 'Rooftop',

    // 自定义
    '其他（自定义）',
  ];

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">车位楼层</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded px-3 py-2"
      >
        <option value="">请选择车位楼层</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      {value === '其他（自定义）' && (
        <input
          type="text"
          placeholder="请输入自定义车位位置"
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 mt-2"
        />
      )}
    </div>
  );
}
