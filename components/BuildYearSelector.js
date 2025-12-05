// components/BuildYearSelector.js
"use client";

import { useMemo, useState, useEffect, useRef } from "react";

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

  // ⬇️ 生成年份选项
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

  // 年份输入框状态
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");

  // 季度用本地 state，保证选择后立刻能看到
  const [localQuarter, setLocalQuarter] = useState(quarter || "");

  const wrapperRef = useRef(null);

  // 外部传进来的 value / quarter 变化时，同步到本地
  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  useEffect(() => {
    setLocalQuarter(quarter || "");
  }, [quarter]);

  // 只允许最多 4 位数字
  const handleInputChange = (e) => {
    const raw = e.target.value || "";
    const digitsOnly = raw.replace(/\D/g, "").slice(0, 4);
    setInputValue(digitsOnly);
    onChange && onChange(digitsOnly);
    setOpen(true);
  };

  // ⬇️ 不再按输入过滤列表，永远显示完整年份范围
  const filteredOptions = yearOptions;

  // 点击外面关闭下拉
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="space-y-2" ref={wrapperRef}>
      <label className="block text-sm font-medium text-gray-700">
        {finalLabel}
      </label>

      {/* 一个白色输入框：既可以输入，也可以点开/收起下拉 */}
      <div className="relative">
        <input
          type="text"
          className="w-full border rounded p-2 bg-white"
          placeholder={
            showQuarter
              ? "请选择或输入预计完成年份（4位数字）"
              : "请选择或输入完成年份（4位数字）"
          }
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen((prev) => !prev)} // ✅ 再次点击切换展开/收起
        />

        {/* 自定义白色下拉列表：总是显示完整年份  */}
        {open && (
          <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-auto">
            <li className="px-3 py-2 text-gray-500 cursor-default border-b select-none">
              从列表中选择，或在上面输入年份
            </li>
            {filteredOptions.map((y) => (
              <li
                key={y}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                onMouseDown={(e) => {
                  e.preventDefault(); // 避免 input 失焦
                  setInputValue(y);   // 显示选中的年份
                  onChange && onChange(y);
                  setOpen(false);     // 选中后先收起，下次再点又展开完整列表
                }}
              >
                {y}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 只有“预计完成年份”才显示季度 */}
      {showQuarter && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            选择季度
          </label>
          <select
            className="w-full border rounded p-2 bg-white"
            value={localQuarter}
            onChange={(e) => {
              const q = e.target.value;
              setLocalQuarter(q);               // ✅ 本地立刻更新
              onQuarterChange && onQuarterChange(q); // 同步给父组件
            }}
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
