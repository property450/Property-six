// components/homestay/HomestayUploadForm.js
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import HotelUploadForm from "@/components/hotel/HotelUploadForm";

/**
 * Homestay 只加「类型选择」：
 * - Property Category
 * - Sub Type
 * - Storeys（需要时）
 * - Property Subtype（Penthouse / Duplex / Triplex / Dual Key，多选；仅特定 category 才显示）
 *
 * 不要出现 Hotel/Resort Type（那个是 Hotel/Resort 模式才需要）
 */

// ================== 选项常量（跟你 Sale/Rent 那套一致的风格） ==================
const PROPERTY_CATEGORIES = [
  "Bungalow / Villa",
  "Apartment / Condo / Service Residence",
  "Semi-Detached House",
  "Terrace / Link House",
  "Business Property",
  "Industrial Property",
  "Land",
];

const SUBTYPE_OPTIONS = {
  "Bungalow / Villa": ["Bungalow", "Villa", "Cluster House", "Twin Villa"],
  "Apartment / Condo / Service Residence": [
    "Apartment",
    "Condominium",
    "Service Residence",
    "SOHO",
    "SOFO",
    "SOVO",
    "Studio",
    "Duplex",
    "Penthouse",
  ],
  "Semi-Detached House": ["Semi-D", "Cluster Semi-D", "Twin Semi-D"],
  "Terrace / Link House": [
    "Terrace House",
    "Link House",
    "Superlink",
    "Townhouse",
    "Cluster Terrace",
  ],
  "Business Property": [
    "Shoplot",
    "Office",
    "Retail Space",
    "Commercial Land",
    "Shopping Mall Lot",
    "Showroom",
    "Business Centre",
  ],
  "Industrial Property": [
    "Factory",
    "Warehouse",
    "Industrial Land",
    "Workshop",
    "Cold Room Warehouse",
    "Logistics Hub",
  ],
  Land: ["Residential Land", "Commercial Land", "Industrial Land", "Agricultural Land"],
};

// 哪些 category 需要 Storeys（照你原本“需要时才显示”的逻辑）
const NEED_STOREYS_CATEGORY = new Set([
  "Bungalow / Villa",
  "Semi-Detached House",
  "Terrace / Link House",
  "Business Property",
  "Industrial Property",
]);

// 哪些 category 才显示 Property Subtype（照你原本的：Apartment / Business / Industrial）
const NEED_PROPERTY_SUBTYPE = new Set([
  "Apartment / Condo / Service Residence",
  "Business Property",
  "Industrial Property",
]);

const PROPERTY_SUBTYPE_OPTIONS = ["Penthouse", "Duplex", "Triplex", "Dual Key"];

// 生成 Storeys 选项（白色下拉 + 可手动输入）
const STOREYS_SUGGESTIONS = [
  "1",
  "1.5",
  "2",
  "2.5",
  "3",
  "3.5",
  "4",
  "4.5",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
];

// ================== 小工具：点外面关闭 dropdown ==================
function useClickOutside(ref, handler) {
  useEffect(() => {
    const onDown = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) handler?.();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [ref, handler]);
}

// ================== 主组件 ==================
export default function HomestayUploadForm(props) {
  // 你原本是“复制 hotel/resort 表单来用”，这里继续沿用（不要重写表单）
  // 只是加类型选择在上面

  const [category, setCategory] = useState("");
  const [subType, setSubType] = useState("");
  const [storeys, setStoreys] = useState("");
  const [propertySubtypes, setPropertySubtypes] = useState([]); // 多选

  // --- Sub Type 白色 dropdown（不要 datalist）---
  const subTypeWrapRef = useRef(null);
  const [subTypeOpen, setSubTypeOpen] = useState(false);
  useClickOutside(subTypeWrapRef, () => setSubTypeOpen(false));

  const currentSubTypes = useMemo(() => {
    if (!category) return [];
    return SUBTYPE_OPTIONS[category] || [];
  }, [category]);

  // category 变了：清掉 subType / storeys / propertySubtypes（避免残留）
  useEffect(() => {
    setSubType("");
    setStoreys("");
    setPropertySubtypes([]);
  }, [category]);

  const showStoreys = !!category && NEED_STOREYS_CATEGORY.has(category);
  const showPropertySubtype = !!category && NEED_PROPERTY_SUBTYPE.has(category);

  // --- Storeys 白色 dropdown（可输入）---
  const storeysWrapRef = useRef(null);
  const [storeysOpen, setStoreysOpen] = useState(false);
  useClickOutside(storeysWrapRef, () => setStoreysOpen(false));

  // --- Property Subtype 白色 dropdown（多选）---
  const psWrapRef = useRef(null);
  const [psOpen, setPsOpen] = useState(false);
  useClickOutside(psWrapRef, () => setPsOpen(false));

  const toggleSubtype = (v) => {
    setPropertySubtypes((prev) => {
      if (prev.includes(v)) return prev.filter((x) => x !== v);
      return [...prev, v];
    });
  };

  return (
    <div className="space-y-4">
      {/* ====== Homestay 类型选择（只新增这一块，不动其它表单） ====== */}
      <div className="border rounded-lg p-4 bg-white">
        <h3 className="font-semibold mb-3">房产类型（Homestay）</h3>

        {/* Property Category */}
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Property Category</label>
          <select
            className="w-full border rounded px-3 py-2 bg-white"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">请选择</option>
            {PROPERTY_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Sub Type（白色 dropdown + 可输入） */}
        <div className="mb-3" ref={subTypeWrapRef}>
          <label className="block text-sm font-medium mb-1">Sub Type</label>
          <input
            className="w-full border rounded px-3 py-2 bg-white"
            placeholder="请选择具体类型"
            value={subType}
            onChange={(e) => {
              setSubType(e.target.value);
              setSubTypeOpen(true);
            }}
            onFocus={() => setSubTypeOpen(true)}
            disabled={!category}
          />

          {subTypeOpen && category && currentSubTypes.length > 0 && (
            <div className="mt-1 max-h-56 overflow-auto border rounded bg-white shadow">
              {currentSubTypes
                .filter((x) =>
                  subType ? x.toLowerCase().includes(subType.toLowerCase()) : true
                )
                .map((x) => (
                  <button
                    key={x}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-gray-100"
                    onClick={() => {
                      setSubType(x);
                      setSubTypeOpen(false);
                    }}
                  >
                    {x}
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Storeys（需要时才显示，白色 dropdown + 可输入） */}
        {showStoreys && (
          <div className="mb-3" ref={storeysWrapRef}>
            <label className="block text-sm font-medium mb-1">有多少层（Storeys）</label>
            <input
              className="w-full border rounded px-3 py-2 bg-white"
              placeholder="例如：2 或 2.5"
              value={storeys}
              onChange={(e) => {
                setStoreys(e.target.value);
                setStoreysOpen(true);
              }}
              onFocus={() => setStoreysOpen(true)}
            />

            {storeysOpen && (
              <div className="mt-1 max-h-56 overflow-auto border rounded bg-white shadow">
                {STOREYS_SUGGESTIONS.filter((x) =>
                  storeys ? x.startsWith(storeys) : true
                ).map((x) => (
                  <button
                    key={x}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-gray-100"
                    onClick={() => {
                      setStoreys(x);
                      setStoreysOpen(false);
                    }}
                  >
                    {x}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Property Subtype（仅特定 category 才显示；多选；白色 dropdown） */}
        {showPropertySubtype && (
          <div className="mb-1" ref={psWrapRef}>
            <label className="block text-sm font-medium mb-1">
              Property Subtype（可多选）
            </label>

            <button
              type="button"
              className="w-full border rounded px-3 py-2 bg-white text-left flex items-center justify-between"
              onClick={() => setPsOpen((v) => !v)}
            >
              <span className={propertySubtypes.length ? "text-gray-900" : "text-gray-400"}>
                {propertySubtypes.length ? propertySubtypes.join(", ") : "请选择 subtype（可多选）"}
              </span>
              <span className="text-gray-500">▾</span>
            </button>

            {psOpen && (
              <div className="mt-1 border rounded bg-white shadow p-2 space-y-1">
                {PROPERTY_SUBTYPE_OPTIONS.map((opt) => {
                  const checked = propertySubtypes.includes(opt);
                  return (
                    <label
                      key={opt}
                      className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSubtype(opt)}
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ====== 下面继续沿用你原本“复制 hotel/resort 的上传表单” ====== */}
      <HotelUploadForm {...props} />
    </div>
  );
}
