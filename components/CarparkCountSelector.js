// components/CarparkCountSelector.js
"use client";

import { useState, useRef, useEffect } from "react";

// 千分位格式化
const formatNumber = (num) => {
  if (num === "" || num === undefined || num === null) return "";
  const str = String(num).replace(/,/g, "");
  if (str === "") return "";
  return Number(str).toLocaleString();
};

// 去掉千分位
const parseNumber = (str) => String(str || "").replace(/,/g, "");

const OPTIONS = [0, 1, 2, 3, 4, 5, "custom"];

export default function CarparkCountSelector({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handlePick = (opt) => {
    if (opt === "custom") {
      setIsCustom(true);
      onChange("");
    } else {
      setIsCustom(false);
      onChange(String(opt));
    }
    setOpen(false);
  };

  const handleInput = (val) => {
    const raw = parseNumber(val);
    if (/^\d*$/.test(raw)) {
      onChange(raw);
    }
  };

  const display = isCustom ? value : formatNumber(value);

  return (
    <div className="flex flex-col" ref={ref}>
      <label className="text-sm font-medium mb-1">停车位</label>
      <div className="relative">
        <input
          type="text"
          placeholder="输入或选择停车位数量"
          value={display}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => setOpen(true)}
          className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring focus:border-blue-500"
        />
        {open && (
          <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-auto">
            {OPTIONS.map((opt) => (
              <li
                key={opt}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handlePick(opt);
                }}
              >
                {opt === "custom" ? "自定义" : opt}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
