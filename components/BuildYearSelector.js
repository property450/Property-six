// components/BuildYearSelector.js
"use client";

import { useMemo } from "react";

export default function BuildYearSelector({
  value,
  onChange,
  quarter,
  onQuarterChange,
  showQuarter = false, // true = 有季度（新项目），false = 只选年份（完成年份）
  label,
}) {
  // 默认标签：新项目时叫 预计交付时间；其它情况叫 完成年份
  const finalLabel =
    label || (showQuarter ? "预计交付时间" : "完成年份");

  // 生成年份列表：从今年往前后 50 年左右，你可以按需要调整
  const yearOptions = useMemo(() => {
    const years = [];
    const now = new Date().getFullYear();
    const start = now - 30;
    const end = now + 20;
    for (let y = end; y >= start; y--) {
      years.push(String(y));
    }
    return years;
  }, []);

  const quarterOptions = ["Q1", "Q2", "Q3", "Q4"];

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {finalLabel}
      </label>

      {/* 年份选择 */}
      <select
        className="w-full border rounded p-2"
        value={value || ""}
        onChange={(e) => onChange && onChange(e.target.value)}
      >
        <option value="">
          {showQuarter ? "请选择预计交付年份" : "请选择完成年份"}
        </option>
        {yearOptions.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>

      {/* 只有 showQuarter = true 才显示季度 */}
      {showQuarter && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            选择季度
          </label>
          <select
            className="w-full border rounded p-2"
            value={quarter || ""}
            onChange={(e) => onQuarterChange && onQuarterChange(e.target.value)}
          >
            <option value="">请选择季度</option>
            {quarterOptions.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
