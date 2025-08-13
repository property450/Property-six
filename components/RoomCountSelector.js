"use client";

import { useState, useRef, useEffect } from "react";

const formatNumber = (num) => {
  if (!num && num !== 0) return "";
  const str = num.toString().replace(/,/g, "");
  if (str === "") return "";
  return Number(str).toLocaleString();
};

const parseNumber = (str) => str.replace(/,/g, "");

export default function RoomCountSelector({ value = {}, onChange }) {
  const fields = [
    { key: "bedrooms", label: "卧室", options: ["Studio", 0, 1, 2, 3, 4, 5, 6] },
    { key: "bathrooms", label: "浴室", options: [0, 1, 2, 3, 4, 5, 6] },
    { key: "kitchens", label: "厨房", options: [1, 2, 3, 4, 5, 6] },
    { key: "livingRooms", label: "客厅", options: [0, 1, 2, 3, 4, 5, 6] },
  ];

  const [openKey, setOpenKey] = useState(null);
  const wrapperRef = useRef(null);

  // 点击外部时关闭下拉
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpenKey(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (key, val) => {
    const raw = parseNumber(val);

    if (/^\d+$/.test(raw)) {
      if (raw.length > 7) return;
      onChange({ ...value, [key]: raw });
    } else {
      onChange({ ...value, [key]: val });
    }
  };

  const handleSelect = (key, option) => {
    handleChange(key, option);
    setOpenKey(key); // 选完后保持下拉打开
  };

  return (
    <div
      ref={wrapperRef}
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      {fields.map((field) => {
        const currentValue = value[field.key];
        const displayValue =
          typeof currentValue === "number" || /^\d+$/.test(currentValue)
            ? formatNumber(currentValue)
            : currentValue || "";

        return (
          <div key={field.key} className="flex flex-col relative">
            <label className="text-sm font-medium mb-1">{field.label}</label>
            <input
              type="text"
              className="border rounded p-2 w-full focus:outline-none focus:border-blue-500"
              placeholder="输入或选择数量"
              value={displayValue}
              onChange={(e) => handleChange(field.key, e.target.value)}
              onClick={() => setOpenKey(field.key)}
            />

            {openKey === field.key && (
              <div className="absolute z-10 mt-1 w-full border border-gray-300 rounded bg-white shadow max-h-40 overflow-y-auto">
                {field.options.map((opt) => (
                  <div
                    key={opt}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleSelect(field.key, opt)}
                  >
                    {opt}
                  </div>
                ))}
                <div className="px-3 py-2 text-gray-500">
                  请输入你要的数字
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
