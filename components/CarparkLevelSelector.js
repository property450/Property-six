"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";

export default function CarparkLevelSelector({
  value,
  onChange,
  mode = "single", // "single" | "range"
}) {
  const [customValue, setCustomValue] = useState({
    min: "",
    max: "",
    single: "",
  });

  // ⭐ 内部 state，用来记住范围 / 单选
  const [internalRange, setInternalRange] = useState(
    value && typeof value === "object"
      ? { min: value.min || "", max: value.max || "" }
      : { min: "", max: "" }
  );
  const [internalSingle, setInternalSingle] = useState(
    typeof value === "string" ? value : ""
  );

  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  // 父组件 value 变化时，同步到内部
  useEffect(() => {
    if (mode === "range") {
      const v = value && typeof value === "object" ? value : {};
      setInternalRange({
        min: v.min || "",
        max: v.max || "",
      });
    } else {
      setInternalSingle(typeof value === "string" ? value : "");
    }
  }, [value, mode]);

  // 点击外部关闭下拉
  useEffect(() => {
    const handler = (e) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const groupedOptions = {
    "🔻 地下楼层（Basement）": [
      "Basement 10",
      "Basement 9",
      "Basement 8",
      "Basement 7",
      "Basement 6",
      "Basement 5",
      "Basement 4",
      "Basement 3A",
      "Basement 3",
      "Basement 2",
      "Basement 1",
    ],
    "🔻 地下地面过渡层": ["LG3", "LG2", "LG1"],
    "🔹 地面与夹层": ["G", "UG", "M1", "M2", "M3"],
    "🔹 Podium 层（可选）": ["P1", "P2", "P3", "P3A", "P4", "P5"],
    "🔼 正常楼层": [
      "Level 1","Level 2","Level 3","Level 3A","Level 4","Level 5",
      "Level 6","Level 7","Level 8","Level 9","Level 10","Level 11",
      "Level 12","Level 13","Level 13A","Level 14","Level 15","Level 16",
      "Level 17","Level 18","Level 19","Level 20","Level 21","Level 22",
      "Level 23","Level 23A","Level 24","Level 25","Level 26","Level 27",
      "Level 28","Level 29","Level 30",
    ],
    "🔝 顶层": ["R（Roof）", "Rooftop"],
  };

  const flatOptions = useMemo(() => {
    return Object.values(groupedOptions).flat();
  }, []);

  const filteredOptions = useMemo(() => {
    if (!internalSingle) return flatOptions;
    const q = internalSingle.toLowerCase();
    return flatOptions.filter((opt) => opt.toLowerCase().includes(q));
  }, [internalSingle, flatOptions]);

  // ======================
  // range 模式（完全不动）
  // ======================
  if (mode === "range") {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          车位位置范围
        </label>
        <div className="flex gap-2">
          {/* 原代码 그대로 */}
          {/* —— 这里保持你原来的 range 实现，不动 —— */}
        </div>
      </div>
    );
  }

  // ======================
  // ✅ single 模式（可输入 + 可选）
  // ======================
  return (
    <div className="space-y-2" ref={wrapperRef}>
      <label className="block text-sm font-medium text-gray-700">
        车位位置
      </label>

      <div className="relative">
        <input
          type="text"
          placeholder="请选择或输入车位位置"
          value={internalSingle}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            const v = e.target.value;
            setInternalSingle(v);
            onChange?.(v);
          }}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />

        {open && (
          <div className="absolute z-30 w-full bg-white border rounded shadow mt-1 max-h-64 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                没有匹配选项，可直接输入
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <div
                  key={opt}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setInternalSingle(opt);
                    onChange?.(opt);
                    setOpen(false);
                  }}
                >
                  {opt}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
