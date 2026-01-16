// components/hotel/GuestSelector.js
"use client";

import { useEffect, useRef, useState } from "react";

export default function GuestSelector({ value, onChange }) {
  const guests = value || { adults: "", children: "" };

  const update = (patch) => {
    onChange?.({ ...guests, ...patch });
  };

  const normalizeNumberLike = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    const digits = s.replace(/[^\d]/g, "");
    return digits === "" ? "" : digits;
  };

  // ✅ 1~20 选项
  const OPTIONS = Array.from({ length: 20 }, (_, i) => String(i + 1));

  // ✅ 分别控制大人/小孩 dropdown 的展开
  const [open, setOpen] = useState({ adults: false, children: false });

  const wrapRefs = useRef({ adults: null, children: null });

  useEffect(() => {
    const handleClickOutside = (e) => {
      const a = wrapRefs.current.adults;
      const c = wrapRefs.current.children;

      const inAdults = a && a.contains(e.target);
      const inChildren = c && c.contains(e.target);

      if (!inAdults && !inChildren) {
        setOpen({ adults: false, children: false });
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openOnly = (field) => {
    setOpen({ adults: field === "adults", children: field === "children" });
  };

  const closeAll = () => setOpen({ adults: false, children: false });

  const selectValue = (field, v) => {
    update({ [field]: v });
    closeAll();
  };

  const renderEditableDropdown = (field, label) => (
    <div
      className="relative flex items-center gap-2"
      ref={(el) => (wrapRefs.current[field] = el)}
    >
      <span className="w-10 text-sm">{label}</span>

      <input
        className="border rounded p-1 w-24 bg-white text-black"
        inputMode="numeric"
        placeholder="请选择"
        value={guests[field] ?? ""}
        onFocus={() => openOnly(field)}
        onClick={() => openOnly(field)}
        onChange={(e) => update({ [field]: normalizeNumberLike(e.target.value) })}
        onBlur={(e) => update({ [field]: normalizeNumberLike(e.target.value) })}
      />

      {/* ✅ 自己画的白色下拉（不受暗色模式影响） */}
      {open[field] && (
        <ul
          className="absolute left-12 top-8 z-50 w-24 max-h-60 overflow-y-auto border rounded bg-white text-black shadow"
          onMouseDown={(e) => e.preventDefault()} // 防止点击选项时 input 先 blur
        >
          {OPTIONS.map((v) => (
            <li
              key={v}
              className="px-3 py-1 hover:bg-gray-100 cursor-pointer"
              onClick={() => selectValue(field, v)}
            >
              {v}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="space-y-2 mt-2">
      <label className="block text-sm font-medium mb-1">
        这个房型能住几个人？
      </label>

      <div className="flex flex-wrap gap-4">
        {renderEditableDropdown("adults", "大人")}
        {renderEditableDropdown("children", "小孩")}
      </div>
    </div>
  );
}
