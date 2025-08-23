// components/FloorPlanSelector.js
"use client";

import { useEffect, useRef, useState } from "react";
import ImageUpload from "./ImageUpload";

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

export default function FloorPlanSelector({ value = [], onChange }) {
  const [floorCount, setFloorCount] = useState(value.length || 1);
  const [open, setOpen] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const ref = useRef(null);

  // 点击页面其他地方时关闭下拉
  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // 楼层数变化时，调整数组长度
  useEffect(() => {
    let newPlans = [...value];
    if (floorCount > newPlans.length) {
      // 多出来的用 "" 占位，而不是 null
      for (let i = newPlans.length; i < floorCount; i++) {
        newPlans.push("");
      }
    } else if (floorCount < newPlans.length) {
      newPlans.length = floorCount;
    }
    if (typeof onChange === "function") {
      onChange(newPlans);
    }
  }, [floorCount]);

  // 选择下拉选项
  const handlePick = (opt) => {
    if (opt === "custom") {
      setIsCustom(true);
      setFloorCount("");
      setOpen(false);
      return;
    }
    setIsCustom(false);
    setFloorCount(opt);
    setOpen(false);
  };

  // 手动输入
  const handleInput = (val) => {
    const raw = parseNumber(val);
    if (!/^\d*$/.test(raw)) return;
    if (raw.length > 3) return; // 最多 999 层
    setFloorCount(raw ? Number(raw) : "");
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

  const display =
    typeof floorCount === "number" ? formatNumber(floorCount) : floorCount;

  return (
    <div className="space-y-3">
      <label className="font-medium">楼层数量</label>

      <div className="relative" ref={ref}>
        <input
          type="text"
          className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring focus:border-blue-500"
          placeholder={isCustom ? "请输入楼层数" : "选择或输入楼层数"}
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

      {/* 动态生成上传框 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: floorCount || 0 }).map((_, i) => (
          <div key={i} className="p-2 border rounded-lg">
            <p className="mb-2 font-semibold">第 {i + 1} 层 平面图</p>
            <ImageUpload
              value={value[i] || ""}  // ✅ 确保传进去不是 null
              onUpload={(url) => {
                const newPlans = [...value];
                newPlans[i] = url;
                if (typeof onChange === "function") {
                  onChange(newPlans);
                }
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
