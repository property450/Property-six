// components/RoomCountSelector.js
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

// 每个字段的选项
const FIELD_DEFS = [
  {
    key: "bedrooms",
    label: "卧室",
    options: ["Studio", 0, 1, 2, 3, 4, 5, 6, "custom"],
  },
  {
    key: "bathrooms",
    label: "浴室",
    options: [0, 1, 2, 3, 4, 5, 6, "custom"],
  },
  {
    key: "kitchens",
    label: "厨房",
    options: [0, 1, 2, 3, 4, 5, 6, "custom"],
  },
  {
    key: "livingRooms",
    label: "客厅",
    options: [0, 1, 2, 3, 4, 5, 6, "custom"],
  },
];

export default function RoomCountSelector({ value = {}, onChange }) {
  const [openKey, setOpenKey] = useState(null);      // 当前展开的下拉 key
  const [customFlags, setCustomFlags] = useState({}); // 是否处于“自定义”模式
  const refs = useRef({});                            // 每个字段的容器 ref

  // 点击页面其它地方时关闭下拉
  useEffect(() => {
    const onDocClick = (e) => {
      const anyHit = Object.values(refs.current).some((el) => el && el.contains(e.target));
      if (!anyHit) setOpenKey(null);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const setFieldValue = (key, newVal) => {
    onChange?.({ ...value, [key]: newVal });
  };

  // 处理从下拉选择
  const handlePick = (key, opt) => {
    if (opt === "custom") {
      setCustomFlags((p) => ({ ...p, [key]: true }));
      setFieldValue(key, "");
      setOpenKey(null);
      return;
    }
    // 选择了具体值
    setCustomFlags((p) => ({ ...p, [key]: false }));
    if (key === "bedrooms" && opt === "Studio") {
      setFieldValue(key, "Studio");
    } else {
      setFieldValue(key, String(opt));
    }
    setOpenKey(null);
  };

  // 处理手动输入
  const handleInput = (key, rawInput) => {
    // 卧室允许 "Studio"
    if (key === "bedrooms" && /^studio$/i.test(rawInput.trim())) {
      setCustomFlags((p) => ({ ...p, [key]: false }));
      setFieldValue(key, "Studio");
      return;
    }

    // 只允许数字
    const raw = parseNumber(rawInput);
    if (!/^\d*$/.test(raw)) return;
    if (raw.length > 7) return; // 最多 7 位
    setFieldValue(key, raw);
  };

  const renderOptions = (def) => {
    return def.options.map((opt) => {
      const isCustom = opt === "custom";
      const label = isCustom ? "自定义" : String(opt);
      return (
        <li
          key={String(opt)}
          // 用 onMouseDown 避免因为 input 失焦导致点击丢失
          onMouseDown={(e) => {
            e.preventDefault();
            handlePick(def.key, opt);
          }}
          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
        >
          {label}
        </li>
      );
    });
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      {FIELD_DEFS.map((def) => {
        const cur = value[def.key];
        const isNumberLike = typeof cur === "number" || /^\d+$/.test(String(cur || ""));
        const display = isNumberLike ? formatNumber(cur) : cur || "";
        const isCustom = !!customFlags[def.key];

        // 占位符逻辑
        const placeholder = isCustom
          ? "请输入你要的数字"
          : def.key === "bedrooms"
          ? "输入或选择数量（可选 Studio）"
          : "输入或选择数量";

        return (
          <div
            key={def.key}
            ref={(el) => (refs.current[def.key] = el)}
            className="flex flex-col"
          >
            <label className="text-sm font-medium mb-1">{def.label}</label>

            <div className="relative">
              {/* 单一输入框：既能输入也能点击展开下拉 */}
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring focus:border-blue-500"
                placeholder={placeholder}
                value={display}
                onChange={(e) => handleInput(def.key, e.target.value)}
                onFocus={() => setOpenKey(def.key)}   // 聚焦就展开
                onClick={() => setOpenKey(def.key)}   // 已有值时点击也展开
              />

              {/* 白底下拉 */}
              {openKey === def.key && (
                <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-auto">
                  {renderOptions(def)}
                </ul>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
