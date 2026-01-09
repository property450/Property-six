// components/AreaSelector.js
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { convertToSqft } from "@/utils/psfUtils";

const AREA_TYPES = [
  { label: "Build up Area", value: "buildUp" },
  { label: "Land Area", value: "land" },
];

// ✅ 恢复：只保留你原本应该出现的单位（不要小写重复）
const UNITS = ["Square Feet (sqft)", "Square Meter (sqm)", "Acres", "Hectares"];

const COMMON_VALUES = Array.from({ length: 149 }, (_, i) => 200 + i * 200); // 200–30,000

function isLandCategory(category) {
  const raw = String(category || "").toLowerCase().trim();
  if (!raw) return false;
  return raw.includes("land");
}

function normalizeAreaValue(v) {
  const obj = v && typeof v === "object" ? v : {};
  const typesArr = Array.isArray(obj.types) ? obj.types : [];
  const types =
    typesArr.length > 0
      ? Array.from(new Set(typesArr.filter((t) => t === "buildUp" || t === "land")))
      : ["buildUp"];

  const units = {
    buildUp: obj.units?.buildUp || UNITS[0],
    land: obj.units?.land || UNITS[0],
  };

  const values = {
    buildUp: obj.values?.buildUp ?? "",
    land: obj.values?.land ?? "",
  };

  return { types, units, values };
}

function formatNumberLikeInput(input) {
  const plain = String(input ?? "").replace(/,/g, "").trim();
  if (plain === "") return "";
  const n = Number(plain);
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString(undefined, { maximumFractionDigits: 3 });
}

function formatSqftNumber(n) {
  if (!Number.isFinite(n) || n <= 0) return "";
  // 你原本显示的感觉是“数值 + sqft”，这里做轻量格式化
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function AreaSelector({
  onChange = () => {},
  initialValue,
  value,
  // ✅ 从外部传入当前 propertyCategory
  propertyCategory,
}) {
  const incoming = useMemo(
    () => normalizeAreaValue(value ?? initialValue ?? {}),
    [value, initialValue]
  );

  // ✅ onChange 用 ref，避免 parent inline function 导致无限循环
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const [selectedTypes, setSelectedTypes] = useState(incoming.types);
  const [units, setUnits] = useState(incoming.units);
  const [areaValues, setAreaValues] = useState(incoming.values);
  const [displayValues, setDisplayValues] = useState(() => ({
    buildUp: incoming.values.buildUp ? formatNumberLikeInput(incoming.values.buildUp) : "",
    land: incoming.values.land ? formatNumberLikeInput(incoming.values.land) : "",
  }));
  const [dropdownOpen, setDropdownOpen] = useState({ buildUp: false, land: false });

  const wrapperRef = useRef({ buildUp: null, land: null });

  // ✅ 父组件 value/initialValue 真正变化才同步（避免循环 setState）
  const lastIncomingRef = useRef(incoming);
  useEffect(() => {
    const last = lastIncomingRef.current;
    const same =
      last.types.join("|") === incoming.types.join("|") &&
      last.units.buildUp === incoming.units.buildUp &&
      last.units.land === incoming.units.land &&
      String(last.values.buildUp ?? "") === String(incoming.values.buildUp ?? "") &&
      String(last.values.land ?? "") === String(incoming.values.land ?? "");
    if (same) return;

    lastIncomingRef.current = incoming;
    setSelectedTypes(incoming.types);
    setUnits(incoming.units);
    setAreaValues(incoming.values);
    setDisplayValues({
      buildUp: incoming.values.buildUp ? formatNumberLikeInput(incoming.values.buildUp) : "",
      land: incoming.values.land ? formatNumberLikeInput(incoming.values.land) : "",
    });
  }, [incoming]);

  // ✅✅✅ 修复：第一次进入也要执行默认切换（Land -> land；非 Land -> buildUp）
  const lastCatRef = useRef(undefined); // ✅ 不要用 useRef(propertyCategory)
  useEffect(() => {
    if (propertyCategory === undefined) return;

    // 只有在“category真的变化”或“当前勾选不符合默认”才处理
    const land = isLandCategory(propertyCategory);
    const nextTypes = land ? ["land"] : ["buildUp"];
    const prevKey = (Array.isArray(selectedTypes) ? selectedTypes : []).join("|");
    const nextKey = nextTypes.join("|");

    const catChanged = lastCatRef.current !== propertyCategory;
    const typesMismatch = prevKey !== nextKey;

    if (!catChanged && !typesMismatch) return;

    lastCatRef.current = propertyCategory;

    setSelectedTypes(nextTypes);
    setDropdownOpen({ buildUp: false, land: false });
  }, [propertyCategory, selectedTypes]);

  // ✅ 点击外部关闭下拉
  useEffect(() => {
    const handleClickOutside = (event) => {
      AREA_TYPES.forEach((t) => {
        const node = wrapperRef.current[t.value];
        if (node && !node.contains(event.target)) {
          setDropdownOpen((prev) => ({ ...prev, [t.value]: false }));
        }
      });
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ 回传给父组件（不把 onChange 放 deps）
  useEffect(() => {
    onChangeRef.current?.({
      types: selectedTypes.length ? selectedTypes : ["buildUp"],
      units,
      values: areaValues,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTypes, units, areaValues]);

  const toggleType = (type) => {
    setSelectedTypes((prev) => {
      const arr = Array.isArray(prev) ? [...prev] : [];
      const has = arr.includes(type);

      let next;
      if (has) next = arr.filter((x) => x !== type);
      else next = [...arr, type];

      if (next.length === 0) next = ["buildUp"]; // 至少保留一个
      return next;
    });
  };

  const setUnit = (type, unitVal) => {
    setUnits((prev) => ({ ...prev, [type]: unitVal }));
  };

  const setVal = (type, input) => {
    const plain = String(input ?? "").replace(/,/g, "");
    if (!/^\d*\.?\d*$/.test(plain)) return;
    const parts = plain.split(".");
    if (parts[1]?.length > 3) return;

    setAreaValues((prev) => ({ ...prev, [type]: plain }));
    setDisplayValues((prev) => ({ ...prev, [type]: formatNumberLikeInput(plain) }));
  };

  const pickCommon = (type, v) => {
    const raw = String(v);
    setAreaValues((prev) => ({ ...prev, [type]: raw }));
    setDisplayValues((prev) => ({ ...prev, [type]: formatNumberLikeInput(raw) }));
    setDropdownOpen((prev) => ({ ...prev, [type]: false }));
  };

  const renderAreaInput = (type) => {
    const label = type === "buildUp" ? "Build up Area" : "Land Area";
    const unit = units[type];
    const displayVal = displayValues[type] || "";

    // ✅ 恢复：显示换算后的 sqft（你说原本在 Size 下面会看到）
    const sqft = convertToSqft(areaValues?.[type], unit);
    const sqftText = formatSqftNumber(sqft);

    return (
      <div key={type} className="mb-6" ref={(el) => (wrapperRef.current[type] = el)}>
        <label className="block font-semibold mb-2">{label} Unit</label>
        <select
          className="border px-3 py-2 w-full mb-2 rounded bg-white"
          value={unit}
          onChange={(e) => setUnit(type, e.target.value)}
        >
          {UNITS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>

        <label className="block font-medium mb-1">{label} Size</label>

        <div className="relative">
          <input
            className="border px-3 py-2 w-full rounded pr-40"
            value={displayVal}
            placeholder="输入面积或选择常用值"
            onFocus={() => setDropdownOpen((p) => ({ ...p, [type]: true }))}
            onChange={(e) => setVal(type, e.target.value)}
          />

          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
            {unit}
          </span>

          {dropdownOpen[type] && (
            <div className="absolute z-20 w-full bg-white border rounded mt-1 max-h-56 overflow-y-auto">
              {COMMON_VALUES.map((v) => (
                <div
                  key={v}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pickCommon(type, v);
                  }}
                >
                  {v.toLocaleString()}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ✅ 这行就是你说“原本会显示选择的面积=多少sf” */}
        {sqftText && <div className="text-sm text-gray-600 mt-1">≈ {sqftText} sqft</div>}
      </div>
    );
  };

  return (
    <div className="p-4 border rounded-xl shadow-md bg-white">
      <label className="block font-semibold mb-2">Build up Area / Land Area</label>

      <div className="flex gap-4 mb-4">
        {AREA_TYPES.map((t) => (
          <label key={t.value} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedTypes.includes(t.value)}
              onChange={() => toggleType(t.value)}
            />
            {t.label}
          </label>
        ))}
      </div>

      {selectedTypes.map((type) => renderAreaInput(type))}
    </div>
  );
}
