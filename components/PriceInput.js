// components/PriceInput.js
"use client";
import { useState, useRef, useEffect } from "react";

export default function PriceInput({ value, onChange, area, type, layouts }) {
  const wrapperRef = useRef(null);

  const predefinedPrices = [
    50000, 100000, 200000, 300000, 500000,
    800000, 1000000, 1500000, 2000000,
    3000000, 5000000, 10000000, 20000000,
    50000000, 100000000,
  ];

  // ✅ 兼容 propertyStatus 类型
  const propertyStatus =
    typeof type === "string"
      ? type
      : (type && (type.propertyStatus || type.finalType)) || "";

  // ✅ 新增 Completed Unit 也归入 Range 类型
  const isRange = /New Project|Developer Unit|Completed Unit/i.test(propertyStatus);

  const [single, setSingle] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");

  const [showDropdownSingle, setShowDropdownSingle] = useState(false);
  const [showDropdownMin, setShowDropdownMin] = useState(false);
  const [showDropdownMax, setShowDropdownMax] = useState(false);

  // ✅ 解析外部 value
  useEffect(() => {
    if (isRange) {
      if (typeof value === "string" && value.includes("-")) {
        const [vmin, vmax] = value.split("-");
        setMin((vmin || "").replace(/,/g, ""));
        setMax((vmax || "").replace(/,/g, ""));
      } else if (value && typeof value === "object") {
        setMin(String(value.min ?? "").replace(/,/g, ""));
        setMax(String(value.max ?? "").replace(/,/g, ""));
      } else {
        setMin("");
        setMax("");
      }
    } else {
      if (value === null || value === undefined) {
        setSingle("");
      } else if (typeof value === "number") {
        setSingle(String(value));
      } else {
        setSingle(String(value).replace(/,/g, ""));
      }
    }
  }, [value, isRange]);

  // ✅ 点击外部收起下拉
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdownSingle(false);
        setShowDropdownMin(false);
        setShowDropdownMax(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ 转换各种单位为 sqft
  const convertToSqftLocal = (val, unit) => {
    const raw = val === undefined || val === null ? 0 : Number(String(val).toString().replace(/,/g, ""));
    if (!raw || Number.isNaN(raw)) return 0;
    const u = (unit || "").toString().toLowerCase();
    if (u.includes("square meter") || u.includes("sq m") || u.includes("square metres") || u.includes("square metre")) {
      return raw * 10.7639;
    }
    if (u.includes("acre")) return raw * 43560;
    if (u.includes("hectare")) return raw * 107639;
    return raw; // 默认 sqft
  };

  // ✅ 计算总面积（优先 layouts）
  const getTotalArea = () => {
    if (Array.isArray(layouts) && layouts.length > 0) {
      let total = 0;
      layouts.forEach((l) => {
        const buildUp = l.buildUp ?? l.build_up ?? l.size ?? l.area ?? 0;
        const buildUpUnit = l.buildUpUnit ?? l.build_up_unit ?? l.unit ?? l.buildUpUnitName ?? "square feet";
        const land = l.land ?? l.land_size ?? 0;
        const landUnit = l.landUnit ?? l.land_unit ?? "square feet";
        total += convertToSqftLocal(buildUp, buildUpUnit);
        total += convertToSqftLocal(land, landUnit);
      });
      return total;
    }

    if (!area) return 0;

    if (typeof area === "object") {
      const b = area.buildUp ?? area.build_up ?? area.buildUpSqft ?? 0;
      const l = area.land ?? area.land_size ?? area.landSqft ?? 0;
      return convertToSqftLocal(b, "square feet") + convertToSqftLocal(l, "square feet");
    }

    return convertToSqftLocal(area, "square feet");
  };

  const totalArea = getTotalArea();

  const formatDisplay = (val) => {
    if (val === "" || val === null || val === undefined) return "";
    const n = Number(String(val).replace(/,/g, ""));
    if (Number.isNaN(n)) return "";
    return n.toLocaleString();
  };

  // ✅ 输入/选择事件（保持你原有逻辑）
  const handleSingleChange = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    setSingle(raw);
    onChange && onChange(raw);
  };
  const handleSelectSingle = (p) => {
    setSingle(String(p));
    onChange && onChange(String(p));
    setShowDropdownSingle(false);
  };

  const handleMinChange = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    setMin(raw);
    onChange && onChange(`${raw}-${max || ""}`);
  };
  const handleMaxChange = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    setMax(raw);
    onChange && onChange(`${min || ""}-${raw}`);
  };
  const handleSelectMin = (p) => {
    setMin(String(p));
    onChange && onChange(`${p}-${max || ""}`);
    setShowDropdownMin(false);
  };
  const handleSelectMax = (p) => {
    setMax(String(p));
    onChange && onChange(`${min || ""}-${p}`);
    setShowDropdownMax(false);
  };

  // ✅ PSF 计算逻辑（💡 新增）
  let pricePerSqftText = "";
  if (totalArea > 0) {
    if (isRange) {
      const minVal = Number(String(min || "").replace(/,/g, "")) || 0;
      const maxVal = Number(String(max || "").replace(/,/g, "")) || 0;
      if (minVal > 0 && maxVal > 0) {
        const minPsf = minVal / totalArea;
        const maxPsf = maxVal / totalArea;
        pricePerSqftText = `每平方英尺: RM ${minPsf.toLocaleString(undefined, { maximumFractionDigits: 2 })} ~ RM ${maxPsf.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
      }
    } else {
      const pVal = Number(String(single || "").replace(/,/g, "")) || 0;
      if (pVal > 0) {
        const psf = pVal / totalArea;
        pricePerSqftText = `每平方英尺: RM ${psf.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
      }
    }
  }

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {isRange ? "价格范围" : "价格"}
      </label>

      {isRange ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            {/* Min */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">RM</span>
              <input
                type="text"
                value={formatDisplay(min)}
                onChange={handleMinChange}
                onFocus={() => setShowDropdownMin(true)}
                className="pl-12 pr-4 py-2 border rounded w-full"
                placeholder="Min Price"
              />
              {showDropdownMin && (
                <ul className="absolute z-10 w-full bg-white border mt-1 max-h-60 overflow-y-auto rounded shadow">
                  {predefinedPrices.map((p) => (
                    <li key={`min-${p}`} onClick={() => handleSelectMin(p)} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                      RM {p.toLocaleString()}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Max */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">RM</span>
              <input
                type="text"
                value={formatDisplay(max)}
                onChange={handleMaxChange}
                onFocus={() => setShowDropdownMax(true)}
                className="pl-12 pr-4 py-2 border rounded w-full"
                placeholder="Max Price"
              />
              {showDropdownMax && (
                <ul className="absolute z-10 w-full bg-white border mt-1 max-h-60 overflow-y-auto rounded shadow">
                  {predefinedPrices.map((p) => (
                    <li key={`max-${p}`} onClick={() => handleSelectMax(p)} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                      RM {p.toLocaleString()}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* ✅ 每平方尺价格范围 */}
          {pricePerSqftText && <p className="text-sm text-gray-500 mt-2">{pricePerSqftText}</p>}
        </>
      ) : (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">RM</span>
          <input
            type="text"
            value={formatDisplay(single)}
            onChange={handleSingleChange}
            onFocus={() => setShowDropdownSingle(true)}
            className="pl-12 pr-4 py-2 border rounded w-full"
            placeholder="请输入价格"
          />
          {showDropdownSingle && (
            <ul className="absolute z-10 w-full bg-white border mt-1 max-h-60 overflow-y-auto rounded shadow">
              {predefinedPrices.map((p) => (
                <li key={p} onClick={() => handleSelectSingle(p)} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                  RM {p.toLocaleString()}
                </li>
              ))}
            </ul>
          )}
          {/* ✅ 单一价格下的每平方尺价格 */}
          {pricePerSqftText && <p className="text-sm text-gray-500 mt-1">{pricePerSqftText}</p>}
        </div>
      )}
    </div>
  );
}
