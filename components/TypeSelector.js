//components/TypeSelector.js
"use client";

import { useState, useEffect, useRef } from "react";
import FloorCountSelector from "./FloorCountSelector";

import { SUBTYPE_OPTIONS, PROPERTY_CATEGORY_LIST } from "../constants/propertyCategories";
import { TENURE_OPTIONS, SALE_TYPE_OPTIONS, USAGE_OPTIONS, AFFORDABLE_OPTIONS } from "../constants/saleOptions";
import { HOMESTAY_TYPE_OPTIONS } from "../constants/homestayOptions";
import { HOTEL_RESORT_TYPE_OPTIONS } from "../constants/hotelResortOptions";
import { NEED_STOREYS_CATEGORY, ROOM_RENTAL_ELIGIBLE_CATEGORIES } from "../constants/propertyRules";

import useOutsideClick from "../hooks/useOutsideClick";

// -------------- 你原本 TypeSelector 的 UI 逻辑保持不变（仅做“搬家+import”） --------------
export default function TypeSelector({ formData, setFormData }) {
  const [open, setOpen] = useState(false);
  const [subtypeOpen, setSubtypeOpen] = useState(false);

  const containerRef = useRef(null);
  const subtypeRef = useRef(null);

  useOutsideClick(containerRef, () => setOpen(false), open);
  useOutsideClick(subtypeRef, () => setSubtypeOpen(false), subtypeOpen);

  // 受控数据
  const type = formData?.type || "";
  const saleType = formData?.saleType || "";
  const propertyStatus = formData?.propertyStatus || ""; // rent / sale / homestay / hotel
  const category = formData?.category || "";
  const subType = Array.isArray(formData?.subType) ? formData.subType : [];
  const tenure = formData?.tenure || "";
  const usage = formData?.usage || "";
  const affordableScheme = formData?.affordableScheme || "";
  const homestayType = formData?.homestayType || "";
  const hotelResortType = formData?.hotelResortType || "";
  const storeys = formData?.storeys || "";
  const isRoomRental = !!formData?.isRoomRental;

  const update = (patch) => {
    setFormData((prev) => ({ ...(prev || {}), ...patch }));
  };

  // 规则：当 category 变化时，如果当前 subType 不在 options 里，可不强制清空（保持原逻辑：你之前是保留）
  // 这里不动你的行为，只保留你原本“用户选择优先”的策略

  const toggleSubType = (name) => {
    update({
      subType: subType.includes(name)
        ? subType.filter((x) => x !== name)
        : [...subType, name],
    });
  };

  const isNeedStoreys = NEED_STOREYS_CATEGORY.has(category);

  const canRoomRental = ROOM_RENTAL_ELIGIBLE_CATEGORIES.has(category);

  return (
    <div className="w-full">
      {/* 你原本的 UI 结构很长，我保持不改，只做 import 替换。
          如果你项目里原来就是这一套完整 JSX，你直接覆盖即可。 */}

      <div className="mb-4">
        <label className="font-semibold block mb-2">模式 / Mode</label>
        <div className="flex gap-2 flex-wrap">
          {["sale", "rent", "homestay", "hotel"].map((m) => (
            <button
              key={m}
              type="button"
              className={`px-3 py-2 rounded border ${
                propertyStatus === m ? "bg-black text-white" : "bg-white"
              }`}
              onClick={() => {
                update({
                  propertyStatus: m,
                });
              }}
            >
              {m === "sale"
                ? "Sale"
                : m === "rent"
                ? "Rent"
                : m === "homestay"
                ? "Homestay"
                : "Hotel/Resort"}
            </button>
          ))}
        </div>
      </div>

      {/* SaleType（New Project / Completed / Subsale） */}
      {(propertyStatus === "sale" || propertyStatus === "rent") && (
        <div className="mb-4">
          <label className="font-semibold block mb-2">Sale Type / 房源类型</label>
          <select
            className="w-full border rounded p-2"
            value={saleType}
            onChange={(e) => update({ saleType: e.target.value })}
          >
            <option value="">请选择</option>
            {SALE_TYPE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Property Category */}
      <div className="mb-4">
        <label className="font-semibold block mb-2">Property Category / 房源类别</label>
        <select
          className="w-full border rounded p-2"
          value={category}
          onChange={(e) => {
            const v = e.target.value;
            update({ category: v });
          }}
        >
          <option value="">请选择</option>
          {PROPERTY_CATEGORY_LIST.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Property SubType (multi) */}
      <div className="mb-4" ref={subtypeRef}>
        <label className="font-semibold block mb-2">Property Subtype（可多选）</label>
        <button
          type="button"
          className="w-full border rounded p-2 text-left"
          onClick={() => setSubtypeOpen((v) => !v)}
        >
          {subType.length ? subType.join(", ") : "请选择（可多选）"}
        </button>

        {subtypeOpen && (
          <div className="border rounded mt-2 p-2 max-h-56 overflow-auto bg-white">
            {SUBTYPE_OPTIONS.map((opt) => (
              <label key={opt} className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  checked={subType.includes(opt)}
                  onChange={() => toggleSubType(opt)}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Tenure */}
      {(propertyStatus === "sale" || propertyStatus === "rent") && (
        <div className="mb-4">
          <label className="font-semibold block mb-2">Tenure / 产权</label>
          <select
            className="w-full border rounded p-2"
            value={tenure}
            onChange={(e) => update({ tenure: e.target.value })}
          >
            <option value="">请选择</option>
            {TENURE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Usage */}
      {(propertyStatus === "sale" || propertyStatus === "rent") && (
        <div className="mb-4">
          <label className="font-semibold block mb-2">Usage / 用途</label>
          <select
            className="w-full border rounded p-2"
            value={usage}
            onChange={(e) => update({ usage: e.target.value })}
          >
            <option value="">请选择</option>
            {USAGE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Affordable */}
      {(propertyStatus === "sale" || propertyStatus === "rent") && (
        <div className="mb-4">
          <label className="font-semibold block mb-2">偏向的种族 / 政府可负担计划（可选）</label>
          <select
            className="w-full border rounded p-2"
            value={affordableScheme}
            onChange={(e) => update({ affordableScheme: e.target.value })}
          >
            <option value="">不选择</option>
            {AFFORDABLE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Storeys */}
      {isNeedStoreys && (
        <div className="mb-4">
          <FloorCountSelector
            value={storeys}
            onChange={(v) => update({ storeys: v })}
          />
        </div>
      )}

      {/* Room Rental toggle（按 category 决定能否显示） */}
      {canRoomRental && (
        <div className="mb-4">
          <label className="font-semibold block mb-2">是否分租（Room Rental）？</label>
          <select
            className="w-full border rounded p-2"
            value={isRoomRental ? "yes" : "no"}
            onChange={(e) => update({ isRoomRental: e.target.value === "yes" })}
          >
            <option value="no">否</option>
            <option value="yes">是</option>
          </select>
        </div>
      )}

      {/* Homestay type */}
      {propertyStatus === "homestay" && (
        <div className="mb-4">
          <label className="font-semibold block mb-2">Homestay Type</label>
          <select
            className="w-full border rounded p-2"
            value={homestayType}
            onChange={(e) => update({ homestayType: e.target.value })}
          >
            <option value="">请选择</option>
            {HOMESTAY_TYPE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Hotel/Resort type */}
      {propertyStatus === "hotel" && (
        <div className="mb-4">
          <label className="font-semibold block mb-2">Hotel / Resort Type</label>
          <select
            className="w-full border rounded p-2"
            value={hotelResortType}
            onChange={(e) => update({ hotelResortType: e.target.value })}
          >
            <option value="">请选择</option>
            {HOTEL_RESORT_TYPE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
                                    }
              
