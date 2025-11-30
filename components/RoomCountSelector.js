// components/RoomCountSelector.js
"use client";

import { useEffect, useRef, useState } from "react";

const formatNumber = (num) => {
  if (num === "" || num === undefined || num === null) return "";
  const str = String(num).replace(/,/g, "");
  if (str === "") return "";
  return Number(str).toLocaleString();
};

const parseNumber = (str) => String(str || "").replace(/,/g, "");

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
  const [openKey, setOpenKey] = useState(null);
  const [customFlags, setCustomFlags] = useState({});

  // ⭐ 新增：本组件自己的内部 state，用来“记住”选过的数字
  const [internalValue, setInternalValue] = useState(value || {});

  const refs = useRef({});

  // 当父组件的 value 变化时，同步一遍到内部 state（防止编辑时外面加载数据）
  useEffect(() => {
    setInternalValue(value || {});
  }, [
    value.bedrooms,
    value.bathrooms,
    value.kitchens,
    value.livingRooms,
  ]);

  useEffect(() => {
    const onDocClick = (e) => {
      const anyHit = Object.values(refs.current).some(
        (el) => el && el.contains(e.target)
      );
      if (!anyHit) setOpenKey(null);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // ✅ 这里改：先更新内部 state，再把 patch 交给父组件
  const setFieldValue = (key, newVal) => {
    setInternalValue((prev) => ({
      ...prev,
      [key]: newVal,
    }));
    onChange?.({ [key]: newVal });
  };

  const handlePick = (key, opt) => {
    if (opt === "custom") {
      setCustomFlags((p) => ({ ...p, [key]: true }));
      setFieldValue(key, "");
      setOpenKey(null);
      return;
    }

    setCustomFlags((p) => ({ ...p, [key]: false }));
    if (key === "bedrooms" && opt === "Studio") {
      setFieldValue(key, "Studio");
    } else {
      setFieldValue(key, String(opt));
    }
    setOpenKey(null);
  };

  const handleInput = (key, rawInput) => {
    if (key === "bedrooms" && /^studio$/i.test(rawInput.trim())) {
      setCustomFlags((p) => ({ ...p, [key]: false }));
      setFieldValue(key, "Studio");
      return;
    }

    const raw = parseNumber(rawInput);
    if (!/^\d*$/.test(raw)) return;
    if (raw.length > 7) return;
    setFieldValue(key, raw);
  };

  const renderOptions = (def) => {
    return def.options.map((opt) => {
      const isCustom = opt === "custom";
      const label = isCustom ? "自定义" : String(opt);
      return (
        <li
          key={String(opt)}
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
        // ⭐ 这里改成用 internalValue，而不是直接用 props.value
        const cur = internalValue[def.key];

        const isNumberLike =
          typeof cur === "number" ||
          (typeof cur === "string" && /^\d+$/.test(cur));

        const display = isNumberLike ? formatNumber(cur) : cur || "";
        const isCustom = !!customFlags[def.key];

        let placeholder = "输入或选择数量";
        if (def.key === "bedrooms") {
          placeholder = "选择卧室数量（可输入或 Studio）";
        } else if (def.key === "bathrooms") {
          placeholder = "选择浴室数量";
        } else if (def.key === "kitchens") {
          placeholder = "选择厨房数量";
        } else if (def.key === "livingRooms") {
          placeholder = "选择客厅数量";
        }

        if (isCustom) {
          placeholder = "请输入你要的数字";
        }

        return (
          <div
            key={def.key}
            ref={(el) => (refs.current[def.key] = el)}
            className="flex flex-col"
          >
            <label className="text-sm font-medium mb-1">{def.label}</label>

            <div className="relative">
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring focus:border-blue-500"
                placeholder={placeholder}
                value={display}
                onChange={(e) => handleInput(def.key, e.target.value)}
                onFocus={() => setOpenKey(def.key)}
                onClick={() => setOpenKey(def.key)}
              />

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
