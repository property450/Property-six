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

export default function CarparkCountSelector({ value, onChange, mode = "single" }) {
  const [open, setOpen] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const ref = useRef(null);

  // ⭐ 内部 state，用来记住当前值
  const [internalSingle, setInternalSingle] = useState(value || "");
  const [internalRange, setInternalRange] = useState(
    value && typeof value === "object"
      ? { min: value.min || "", max: value.max || "" }
      : { min: "", max: "" }
  );

  // 父组件 value 变化时，同步到内部
  useEffect(() => {
    if (mode === "single") {
      setInternalSingle(value ?? "");
    } else {
      const v = value && typeof value === "object" ? value : {};
      setInternalRange({
        min: v.min || "",
        max: v.max || "",
      });
    }
  }, [value, mode]);

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
    if (mode === "range") {
      // range 模式下选择“同一个最少/最多”
      if (opt === "custom") {
        const next = { min: "", max: "" };
        setInternalRange(next);
        onChange?.(next);
      } else {
        const next = { min: String(opt), max: String(opt) };
        setInternalRange(next);
        onChange?.next;
      }
      setOpen(false);
      return;
    }

    // 单值模式
    if (opt === "custom") {
      setIsCustom(true);
      setInternalSingle("");
      onChange?.("");
    } else {
      setIsCustom(false);
      const val = String(opt);
      setInternalSingle(val);
      onChange?.(val);
    }
    setOpen(false);
  };

  const handleInput = (val) => {
    const raw = parseNumber(val);
    if (/^\d*$/.test(raw)) {
      setInternalSingle(raw);
      onChange?.(raw);
    }
  };

  const handleRangeInput = (field, val) => {
    const raw = parseNumber(val);
    if (/^\d*$/.test(raw)) {
      const next = { ...internalRange, [field]: raw };
      setInternalRange(next);
      onChange?.(next);
    }
  };

  if (mode === "range") {
    // ---------- 范围模式 ----------
    return (
      <div className="flex flex-col" ref={ref}>
        <label className="text-sm font-medium mb-1">停车位范围</label>
        <div className="flex gap-2">
          {/* 最少 */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="最少"
              value={formatNumber(internalRange.min)}
              onChange={(e) => handleRangeInput("min", e.target.value)}
              onFocus={() => setOpen("min")}
              className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring focus:border-blue-500"
            />
            {open === "min" && (
              <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-auto">
                {OPTIONS.map((opt) => (
                  <li
                    key={`min-${opt}`}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setOpen(false);
                      if (opt === "custom") {
                        handleRangeInput("min", "");
                      } else {
                        handleRangeInput("min", String(opt));
                      }
                    }}
                  >
                    {opt === "custom" ? "自定义" : opt}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 最大 */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="最多"
              value={formatNumber(internalRange.max)}
              onChange={(e) => handleRangeInput("max", e.target.value)}
              onFocus={() => setOpen("max")}
              className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring focus:border-blue-500"
            />
            {open === "max" && (
              <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-auto">
                {OPTIONS.map((opt) => (
                  <li
                    key={`max-${opt}`}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setOpen(false);
                      if (opt === "custom") {
                        handleRangeInput("max", "");
                      } else {
                        handleRangeInput("max", String(opt));
                      }
                    }}
                  >
                    {opt === "custom" ? "自定义" : opt}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---------- 单值模式 ----------
  const display = isCustom ? internalSingle : formatNumber(internalSingle);

  return (
    <div className="flex flex-col" ref={ref}>
      <label className="text-sm font-medium mb-1">
        {mode === "range" ? "停车位范围" : "停车位"}
      </label>
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
