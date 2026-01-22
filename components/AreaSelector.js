// components/AreaSelector.js
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

const AREA_TYPES = [
  { label: "Build up Area", value: "buildUp" },
  { label: "Land Area", value: "land" },
];

const UNITS = [
  "Square Feet (sqft)",
  "Square Meter (sqm)",
  "Acres",
  "Hectares",
  "square feet",
  "square meter",
  "acres",
  "hectares",
];

const COMMON_VALUES = Array.from({ length: 149 }, (_, i) => 200 + i * 200);

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

function toSqft(val, unit) {
  const raw = String(val ?? "").replace(/,/g, "").trim();
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 0;

  const u = String(unit || "").toLowerCase();

  if (u.includes("square feet") || u.includes("sqft")) return n;
  if (u.includes("square meter") || u.includes("sqm")) return n * 10.763910416709722;
  if (u.includes("acres")) return n * 43560;
  if (u.includes("hectares")) return n * 107639.1041670972;

  return 0;
}

function formatSqft(n) {
  if (!Number.isFinite(n) || n <= 0) return "";
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function AreaSelector({
  onChange = () => {},
  initialValue,
  value,
  propertyCategory,
}) {
  const incoming = useMemo(
    () => normalizeAreaValue(value ?? initialValue ?? {}),
    [value, initialValue]
  );

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

  /**
   * ✅✅✅ 关键修复：编辑模式回填时，如果 land/buildUp 已经有值或 incoming.types 已包含，
   * 一定要自动展开对应输入框（selectedTypes 必须包含它）。
   *
   * 只有当 incoming 完全没选 & 没值时，才根据 propertyCategory 给默认：
   * - land 类别 -> ["land"]
   * - 非 land -> ["buildUp"]
   */
  const lastCatRef = useRef(undefined);
  useEffect(() => {
    if (propertyCategory === undefined) return;
    if (lastCatRef.current === propertyCategory) return;
    lastCatRef.current = propertyCategory;

    const hasLandValue = String(incoming.values?.land ?? "").trim() !== "";
    const hasBuildUpValue = String(incoming.values?.buildUp ?? "").trim() !== "";
    const incomingHasLand = Array.isArray(incoming.types) && incoming.types.includes("land");
    const incomingHasBuildUp = Array.isArray(incoming.types) && incoming.types.includes("buildUp");

    // ✅ 优先：尊重 DB 回填（有值/有 types 就必须展开）
    let nextTypes = [];
    if (incomingHasLand || hasLandValue) nextTypes.push("land");
    if (incomingHasBuildUp || hasBuildUpValue) nextTypes.push("buildUp");

    // ✅ 如果 DB 回填完全没有，就用 propertyCategory 默认
    if (nextTypes.length === 0) {
      const land = isLandCategory(propertyCategory);
      nextTypes = land ? ["land"] : ["buildUp"];
    }

    // ✅ 保证至少一个
    if (nextTypes.length === 0) nextTypes = ["buildUp"];

    setSelectedTypes((prev) => {
      const prevKey = (Array.isArray(prev) ? prev : []).join("|");
      const nextKey = nextTypes.join("|");
      return prevKey === nextKey ? prev : nextTypes;
    });

    setDropdownOpen({ buildUp: false, land: false });
  }, [propertyCategory, incoming]);

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

  // ✅✅✅ 修复：避免“回传->父setState->再同步->再回传”的无限循环
  const lastEmittedRef = useRef("");
  useEffect(() => {
    const outgoing = normalizeAreaValue({
      types: selectedTypes.length ? selectedTypes : ["buildUp"],
      units,
      values: areaValues,
    });

    const outSig = JSON.stringify(outgoing);
    const inSig = JSON.stringify(incoming);

    if (outSig === inSig) {
      lastEmittedRef.current = outSig;
      return;
    }
    if (outSig === lastEmittedRef.current) return;

    lastEmittedRef.current = outSig;
    onChangeRef.current?.(outgoing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTypes, units, areaValues, incoming]);

  const toggleType = (type) => {
    setSelectedTypes((prev) => {
      const arr = Array.isArray(prev) ? [...prev] : [];
      const has = arr.includes(type);

      let next;
      if (has) next = arr.filter((x) => x !== type);
      else next = [...arr, type];

      if (next.length === 0) next = ["buildUp"];
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

    const sqft = toSqft(areaValues?.[type], unit);
    const sqftText = formatSqft(sqft);

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

        {sqftText ? <div className="text-sm text-gray-600 mt-1">= {sqftText} sqft</div> : null}
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
