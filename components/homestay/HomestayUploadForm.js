// components/homestay/HomestayUploadForm.js
// components/homestay/HomestayUploadForm.js
"use client";

import { useMemo, useState } from "react";
import HotelUploadForm from "@/components/hotel/HotelUploadForm";

const PROPERTY_CATEGORIES = [
  "Bungalow / Villa",
  "Apartment / Condo / Service Residence",
  "Semi-Detached House",
  "Terrace / Link House",
  "Business Property",
  "Industrial Property",
  "Land",
];

// 只有这些类别才需要 Storeys（跟你原本风格一致）
const NEED_STOREYS_CATEGORIES = new Set([
  "Bungalow / Villa",
  "Semi-Detached House",
  "Terrace / Link House",
]);

// Property Subtype（多选）
const PROPERTY_SUBTYPE_OPTIONS = ["Penthouse", "Duplex", "Triplex", "Dual Key"];

// Sub Type 给建议 + 允许手动输入（白色 datalist，不会变黑）
const SUBTYPE_SUGGESTIONS_BY_CATEGORY = {
  "Bungalow / Villa": ["Bungalow", "Villa", "Cluster House", "Twin Villa"],
  "Apartment / Condo / Service Residence": [
    "Apartment",
    "Condominium",
    "Service Residence",
    "SOHO",
    "SOFO",
    "SOVO",
    "Studio",
  ],
  "Semi-Detached House": ["Semi-D", "Semi-Detached"],
  "Terrace / Link House": ["Terrace", "Link House", "Townhouse"],
  "Business Property": ["Shop", "Shop Lot", "Office", "Retail"],
  "Industrial Property": ["Factory", "Warehouse", "Workshop"],
  Land: ["Residential Land", "Commercial Land", "Industrial Land", "Agricultural Land"],
};

export default function HomestayUploadForm() {
  // ✅ 只新增你要的 4 个类型字段（不碰其他逻辑）
  const [propertyCategory, setPropertyCategory] = useState("");
  const [subType, setSubType] = useState("");
  const [storeys, setStoreys] = useState("");
  const [propertySubtypes, setPropertySubtypes] = useState([]);

  const needStoreys = NEED_STOREYS_CATEGORIES.has(propertyCategory);

  const subtypeSuggestions = useMemo(() => {
    return SUBTYPE_SUGGESTIONS_BY_CATEGORY[propertyCategory] || [];
  }, [propertyCategory]);

  return (
    <div className="space-y-4">
      {/* ✅ Homestay 里新增：类型选择（Property Category / Sub Type / Storeys / Property Subtype） */}
      <div className="border rounded p-4 space-y-3">
        <div className="font-semibold">房产类型（Homestay）</div>

        <div className="space-y-1">
          <div className="text-sm">Property Category</div>
          <select
            className="w-full border rounded p-2 bg-white"
            value={propertyCategory}
            onChange={(e) => {
              const next = e.target.value;
              setPropertyCategory(next);
              setSubType("");
              if (!NEED_STOREYS_CATEGORIES.has(next)) setStoreys("");
            }}
          >
            <option value="">请选择</option>
            {PROPERTY_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <div className="text-sm">Sub Type</div>
          <input
            list="homestay-subtype-suggestions"
            className="w-full border rounded p-2 bg-white"
            placeholder="请选择具体类型"
            value={subType}
            onChange={(e) => setSubType(e.target.value)}
          />
          <datalist id="homestay-subtype-suggestions">
            {subtypeSuggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>

        {needStoreys && (
          <div className="space-y-1">
            <div className="text-sm">有多少层（Storeys）</div>
            <input
              className="w-full border rounded p-2 bg-white"
              placeholder="例如：2 或 2.5"
              value={storeys}
              onChange={(e) => setStoreys(e.target.value)}
            />
          </div>
        )}

        <div className="space-y-2">
          <div className="text-sm">Property Subtype（可多选）</div>
          <div className="grid grid-cols-2 gap-2">
            {PROPERTY_SUBTYPE_OPTIONS.map((opt) => {
              const checked = propertySubtypes.includes(opt);
              return (
                <label key={opt} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const nextChecked = e.target.checked;
                      setPropertySubtypes((prev) => {
                        if (nextChecked) return [...prev, opt];
                        return prev.filter((x) => x !== opt);
                      });
                    }}
                  />
                  <span>{opt}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* ✅ Homestay 其它上传表单：继续沿用你原本“复制 hotel/resort 那套”的做法 */}
      <HotelUploadForm />
    </div>
  );
}
