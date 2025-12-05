// components/BuildYearSelector.js
"use client";

import { useMemo } from "react";

export default function BuildYearSelector({
  value,
  onChange,
  quarter,
  onQuarterChange,
  showQuarter = false, // true = 预计完成年份（新项目，含季度）；false = 完成年份
  label,
}) {
  const finalLabel =
    label || (showQuarter ? "预计完成年份" : "完成年份");

  const currentYear = new Date().getFullYear();

  // 生成年份选项
  const yearOptions = useMemo(() => {
    const years = [];
    if (showQuarter) {
      // 预计完成年份：今年 → 今年 + 50
      const end = currentYear + 50;
      for (let y = currentYear; y <= end; y++) {
        years.push(String(y));
      }
    } else {
      // 完成年份：今年 → 今年 - 50
      const start = currentYear - 50;
      for (let y = currentYear; y >= start; y--) {
        years.push(String(y));
      }
    }
    return years;
  }, [currentYear, showQuarter]);

  const quarterOptions = ["Q1", "Q2", "Q3", "Q4"];

  // 当前 value 是否在下拉选项里
  const stringValue = value ? String(value) : "";
  const selectValue = yearOptions.includes(stringValue) ? stringValue : "";

  // 统一处理输入：只允许最多 4 位数字
  const handleManualInput = (e) => {
    const raw = e.target.value || "";
    const digitsOnly = raw.replace(/\D/g, "").slice(0, 4);
    onChange && onChange(digitsOnly);
  };

  const handleSelectChange = (e) => {
    const v = e.target.value;
    onChange && onChange(v);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {finalLabel}
      </label>

      {/* 第一行：白色下拉选择（和你其它 select 一样） */}
      <select
        className="w-full border rounded p-2 bg-white"
        value={selectValue}
        onChange={handleSelectChange}
      >
        <option value="">
          {showQuarter ? "请选择预计完成年份" : "请选择完成年份"}
        </option>
        {yearOptions.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>

      {/* 第二行：手动输入年份（可选，用于输入不在列表里的年份） */}
      <input
        type="text"
        className="w-full border rounded p-2 bg-white"
        placeholder={
          showQuarter ? "或手动输入预计完成年份（4位数字）" : "或手动输入完成年份（4位数字）"
        }
        value={stringValue}
        onChange={handleManualInput}
      />

      {/* 只有 预计完成年份（新项目）才显示季度 */}
      {showQuarter && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            选择季度
          </label>
          <select
            className="w-full border rounded p-2 bg-white"
            value={quarter || ""}
            onChange={(e) =>
              onQuarterChange && onQuarterChange(e.target.value)
            }
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
