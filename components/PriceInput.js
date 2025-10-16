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

  // normalize propertyStatus (supports string or object)
  const propertyStatus =
    typeof type === "string"
      ? type
      : (type && (type.propertyStatus || type.finalType)) || "";

  // include Completed Unit here too
  const isRange = /New Project|Developer Unit|Completed Unit/i.test(propertyStatus);

  const [single, setSingle] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");

  const [showDropdownSingle, setShowDropdownSingle] = useState(false);
  const [showDropdownMin, setShowDropdownMin] = useState(false);
  const [showDropdownMax, setShowDropdownMax] = useState(false);

  // parse incoming value into states
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

  // click outside to close dropdowns
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

  const convertToSqftLocal = (val, unit) => {
    const raw = val === undefined || val === null ? 0 : Number(String(val).toString().replace(/,/g, ""));
    if (!raw || Number.isNaN(raw)) return 0;
    const u = (unit || "").toString().toLowerCase();
    if (u.includes("square meter") || u.includes("sq m") || u.includes("square metres") || u.includes("square metre")) {
      return raw * 10.7639;
    }
    if (u.includes("acre")) return raw * 43560;
    if (u.includes("hectare")) return raw * 107639;
    // assume already sqft
    return raw;
  };

  // total area: prefer layouts (if non-empty) otherwise use area prop
  const getTotalArea = () => {
    // layouts may be array of objects with buildUp/buildUpUnit and land/landUnit
    if (Array.isArray(layouts) && layouts.length > 0) {
      let total = 0;
      layouts.forEach((l) => {
        // accept various field names defensively
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
      // if caller already converted to sqft, these are numbers; if not, they may include unit info (rare)
      return convertToSqftLocal(b, "square feet") + convertToSqftLocal(l, "square feet");
    }

    // area may be numeric or string
    return convertToSqftLocal(area, "square feet");
  };

  const totalArea = getTotalArea();

  const formatDisplay = (val) => {
    if (val === "" || val === null || val === undefined) return "";
    const n = Number(String(val).replace(/,/g, ""));
    if (Number.isNaN(n)) return "";
    return n.toLocaleString();
  };

  // handlers
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

  // compute price per sqft text
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

          {pricePerSqftText && <p className="text-sm text-gray-500 mt-1">{pricePerSqftText}</p>}
        </div>
      )}
    </div>
  );
}
