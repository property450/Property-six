"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * 统一 Area 数据结构（供 PriceInput/psf 计算使用）
 * {
 *   types: ["buildUp"] | ["land"] | ["buildUp","land"],
 *   units: { buildUp: "square feet", land: "square feet" },
 *   values: { buildUp: "1200", land: "3000" }
 * }
 */

const AREA_TYPES = [
  { label: "Build up Area", value: "buildUp" },
  { label: "Land Area", value: "land" },
];

const UNITS = ["square feet", "square meter", "acres", "hectares"];
const COMMON_VALUES = Array.from({ length: 149 }, (_, i) => 200 + i * 200); // 200–30,000

function normalizeAreaValue(raw) {
  const v = raw && typeof raw === "object" ? raw : {};
  const typesArr = Array.isArray(v.types) ? v.types : [];
  const types =
    typesArr.length > 0
      ? Array.from(new Set(typesArr.filter((t) => t === "buildUp" || t === "land")))
      : ["buildUp"];

  const units = {
    buildUp: v.units?.buildUp || UNITS[0],
    land: v.units?.land || UNITS[0],
  };

  const values = {
    buildUp: v.values?.buildUp ?? "",
    land: v.values?.land ?? "",
  };

  return { types, units, values };
}

function isLandCategoryText(cat) {
  const s = String(cat || "").toLowerCase().trim();
  if (!s) return false;

  // 你的 UI 里常见： "Land" / "LAND" / "Land " / "Land / ..." / "Residential Land" 等
  // 只要包含 land 就当 land 类别
  return s.includes("land");
}

function sameShallow(a, b) {
  if (!a || !b) return false;
  if (a.types?.join("|") !== b.types?.join("|")) return false;
  if (a.units?.buildUp !== b.units?.buildUp) return false;
  if (a.units?.land !== b.units?.land) return false;
  if (String(a.values?.buildUp ?? "") !== String(b.values?.buildUp ?? "")) return false;
  if (String(a.values?.land ?? "") !== String(b.values?.land ?? "")) return false;
  return true;
}

export default function AreaSelector({
  onChange = () => {},
  // 兼容你不同文件传参方式：SaleUploadForm 用 initialValue，RentUploadForm 用 value
  initialValue,
  value,
  // ✅ 关键：从外部传入当前 Property Category，用于自动切换 buildUp/land 默认勾选
  propertyCategory,
}) {
  const incoming = useMemo(() => normalizeAreaValue(value ?? initialValue ?? {}), [value, initialValue]);

  const [selectedTypes, setSelectedTypes] = useState(incoming.types);
  const [units, setUnits] = useState(incoming.units);
  const [areaValues, setAreaValues] = useState(incoming.values);

  // 防止 parent 传入同样内容时重复 setState 造成循环
  const lastIncomingRef = useRef(incoming);
  useEffect(() => {
    const last = lastIncomingRef.current;
    if (!sameShallow(last, incoming)) {
      lastIncomingRef.current = incoming;
      setSelectedTypes(incoming.types);
      setUnits(incoming.units);
      setAreaValues(incoming.values);
    }
  }, [incoming]);

  // ✅ 当 propertyCategory 变成 Land：默认只勾 land
  // ✅ 当 propertyCategory 不是 Land：默认只勾 buildUp
  const lastCatRef = useRef(propertyCategory);
  useEffect(() => {
    const prev = lastCatRef.current;
    if (prev === propertyCategory) return;
    lastCatRef.current = propertyCategory;

    const shouldLand = isLandCategoryText(propertyCategory);
    const nextTypes = shouldLand ? ["land"] : ["buildUp"];

    setSelectedTypes((prevTypes) => {
      const prevKey = (prevTypes || []).join("|");
      const nextKey = nextTypes.join("|");
      if (prevKey === nextKey) return prevTypes;
      return nextTypes;
    });
    // values 不清空，让用户切换回去还在（只是默认勾选变了）
  }, [propertyCategory]);

  // 把当前状态打包并通知父组件
  const emitChange = (next) => {
    const payload = normalizeAreaValue(next);
    onChange(payload);
  };

  const toggleType = (type) => {
    setSelectedTypes((prev) => {
      const arr = Array.isArray(prev) ? [...prev] : [];
      const has = arr.includes(type);

      let next;
      if (has) {
        next = arr.filter((x) => x !== type);
      } else {
        next = [...arr, type];
      }

      // 至少保留一个
      if (next.length === 0) next = ["buildUp"];

      // 如果 land 类别，默认是 land，但用户仍可手动加 buildUp（按你的需求）
      const nextState = { types: next, units, values: areaValues };
      emitChange(nextState);
      return next;
    });
  };

  const setUnit = (type, unit) => {
    setUnits((prev) => {
      const next = { ...prev, [type]: unit };
      emitChange({ types: selectedTypes, units: next, values: areaValues });
      return next;
    });
  };

  const setVal = (type, val) => {
    setAreaValues((prev) => {
      const next = { ...prev, [type]: val };
      emitChange({ types: selectedTypes, units, values: next });
      return next;
    });
  };

  const showBuildUp = selectedTypes.includes("buildUp");
  const showLand = selectedTypes.includes("land");

  return (
    <div className="border rounded-xl p-4 bg-white space-y-4">
      <div className="text-sm font-semibold">Build up Area / Land Area</div>

      <div className="flex items-center gap-6">
        {AREA_TYPES.map((t) => (
          <label key={t.value} className="flex items-center gap-2 text-sm select-none">
            <input
              type="checkbox"
              checked={selectedTypes.includes(t.value)}
              onChange={() => toggleType(t.value)}
            />
            {t.label}
          </label>
        ))}
      </div>

      {showBuildUp && (
        <div className="space-y-3">
          <div className="text-sm font-semibold">Build up Area Unit</div>
          <select
            className="border rounded px-3 py-2 w-full"
            value={units.buildUp}
            onChange={(e) => setUnit("buildUp", e.target.value)}
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>

          <div className="text-sm font-semibold">Build up Area Size</div>
          <div className="flex gap-2">
            <input
              className="border rounded px-3 py-2 w-full"
              placeholder="输入面积或选择常用值"
              value={areaValues.buildUp}
              onChange={(e) => setVal("buildUp", e.target.value)}
              list="buildup-common"
            />
            <div className="border rounded px-3 py-2 text-sm text-gray-600 whitespace-nowrap">
              {units.buildUp}
            </div>
          </div>
          <datalist id="buildup-common">
            {COMMON_VALUES.map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </div>
      )}

      {showLand && (
        <div className="space-y-3">
          <div className="text-sm font-semibold">Land Area Unit</div>
          <select
            className="border rounded px-3 py-2 w-full"
            value={units.land}
            onChange={(e) => setUnit("land", e.target.value)}
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>

          <div className="text-sm font-semibold">Land Area Size</div>
          <div className="flex gap-2">
            <input
              className="border rounded px-3 py-2 w-full"
              placeholder="输入面积或选择常用值"
              value={areaValues.land}
              onChange={(e) => setVal("land", e.target.value)}
              list="land-common"
            />
            <div className="border rounded px-3 py-2 text-sm text-gray-600 whitespace-nowrap">
              {units.land}
            </div>
          </div>
          <datalist id="land-common">
            {COMMON_VALUES.map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </div>
      )}
    </div>
  );
}
