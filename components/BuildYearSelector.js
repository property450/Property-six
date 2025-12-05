// components/BuildYearSelector.js
"use client";

import { useMemo } from "react";

export default function BuildYearSelector({
  value,
  onChange,
  quarter,
  onQuarterChange,
  showQuarter = false, // true = 预计完成年份（新项目，含季度）; false = 完成年份
  label,
}) {
  // 标签：如果外面没传 label，就根据 showQuarter 自动决定
  const finalLabel =
    label || (showQuarter ? "预计完成年份" : "完成年份");

  const currentYear = new Date().getFullYear();

  // ⬇️ 年份候选：预计完成年份 = 今年往后 50 年；完成年份 = 今年往前 50 年
  const yearOptions = useMemo(() => {
    const years = [];
    if (showQuarter) {
      // 预计完成年份：currentYear → currentYear + 50（例：2025 ~ 2075）
      const end = currentYear + 50;
      for (let y = currentYear; y <= end; y++) {
        years.push(String(y));
      }
    } else {
      // 完成年份：currentYear → currentYear - 50（例：2025 ~ 1975）
      const start = currentYear - 50;
      for (let y = currentYear; y >= start; y--) {
        years.push(String(y));
      }
    }
    return years;
  }, [currentYear, showQuarter]);

  const quarterOptions = ["Q1", "Q2", "Q3", "Q4"];

  // 用 datalist + input，可以下拉，也可以手动输入
  const listId = showQuarter
    ? "build-year-expected-list"
    : "build-year-completed-list";

  // 统一处理输入：只允许最多 4 位数字
  const handleYearChange = (e) => {
    const raw = e.target.value || "";
    const digitsOnly = raw.replace(/\D/g, "").slice(0, 4); // 过滤非数字、限制4位
    onChange && onChange(digitsOnly);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {finalLabel}
      </label>

      {/* 年份输入：可输入 + 可下拉 */}
      <input
        list={listId}
        className="w-full border rounded p-2"
        placeholder={showQuarter ? "请选择或输入预计完成年份" : "请选择或输入完成年份"}
        value={value || ""}
        onChange={handleYearChange}
      />

      <datalist id={listId}>
        {yearOptions.map((y) => (
          <option key={y} value={y} />
        ))}
      </datalist>

      {/* 只有 预计完成年份（新项目）才显示季度 */}
      {showQuarter && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            选择季度
          </label>
          <select
            className="w-full border rounded p-2"
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
