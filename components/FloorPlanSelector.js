// components/FloorPlanSelector.js
"use client";

import { useEffect, useRef, useState } from "react";

// 千分位格式化
const formatNumber = (num) => {
  if (num === "" || num === undefined || num === null) return "";
  const str = String(num).replace(/,/g, "");
  if (str === "") return "";
  return Number(str).toLocaleString();
};

// 去除千分位
const parseNumber = (str) => String(str || "").replace(/,/g, "");

// 下拉选项（1~10层 + 自定义）
const FLOOR_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, "custom"];

export default function FloorPlanSelector({ value = 0, onChange }) {
  const [count, setCount] = useState(value || 0);
  const [open, setOpen] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const ref = useRef(null);

  // 同步外部 value 变化
  useEffect(() => {
    setCount(value || 0);
  }, [value]);

  // 将本地 count 回传给父组件
  useEffect(() => {
    typeof onChange === "function" && onChange(count || 0);
  }, [count]);

  // 点击页面其他地方时关闭下拉
  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const handlePick = (opt) => {
    if (opt === "custom") {
      setIsCustom(true);
      setCount("");
      setOpen(false);
      return;
    }
    setIsCustom(false);
    setCount(opt);
    setOpen(false);
  };

  const handleInput = (val) => {
    const raw = parseNumber(val);
    if (!/^\d*$/.test(raw)) return;
    if (raw.length > 3) return; // 最多 999
    setCount(raw ? Number(raw) : "");
  };

  const renderOptions = () =>
    FLOOR_OPTIONS.map((opt) => {
      const label = opt === "custom" ? "自定义" : `${opt} 层`;
      return (
        <li
          key={String(opt)}
          onMouseDown={(e) => {
            e.preventDefault();
            handlePick(opt);
          }}
          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
        >
          {label}
        </li>
      );
    });

  const display = typeof count === "number" ? formatNumber(count) : count;

  return (
    <div className="space-y-3">
      <label className="font-medium">平面图数量</label>
      <div className="relative" ref={ref}>
        <input
          type="text"
          className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring focus:border-blue-500"
          placeholder={isCustom ? "请输入数量" : "选择或输入数量"}
          value={display}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
        />
        {open && (
          <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-auto">
            {renderOptions()}
          </ul>
        )}
      </div>
    </div>
  );
}
