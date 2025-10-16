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

  // 解析 propertyStatus（支持 string 或 object）
  let propertyStatus = "";
  if (typeof type === "string") propertyStatus = type;
  else if (type && typeof type === "object") propertyStatus = type.propertyStatus || type.finalType || "";

  // New Project / Developer Unit / Completed Unit 视为 range 类型
  const isRange = /New Project|Developer Unit|Completed Unit/i.test(propertyStatus);

  const [single, setSingle] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");

  const [showDropdownSingle, setShowDropdownSingle] = useState(false);
  const [showDropdownMin, setShowDropdownMin] = useState(false);
  const [showDropdownMax, setShowDropdownMax] = useState(false);

  // 把外部传入 value 解析到内部 state（保留你原有行为）
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

  // 点击外部收起下拉
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

  // 格式化显示
  const formatDisplay = (val) => {
    if (val === "" || val === null || val === undefined) return "";
    const n = Number(String(val).replace(/,/g, ""));
    if (Number.isNaN(n)) return "";
    return n.toLocaleString();
  };

  // 解析数字（兼容带逗号 / 文本中带单位）
  const parseNumber = (v) => {
    if (v === undefined || v === null) return 0;
    const s = String(v);
    const match = s.match(/-?[\d,]*\.?\d+/);
    if (!match) return 0;
    const num = Number(match[0].replace(/,/g, ""));
    return Number.isNaN(num) ? 0 : num;
  };

  // 从传入的 value 或单独 unit 字段推断单位（fallback to sqft）
  const inferUnit = (unitParam, val) => {
    if (unitParam) return String(unitParam).toLowerCase();
    if (!val) return "square feet";
    const s = String(val).toLowerCase();
    if (s.includes("sq m") || s.includes("square meter") || s.includes("square metre") || s.includes("sqm")) return "square meter";
    if (s.includes("acre")) return "acre";
    if (s.includes("hectare") || s.includes("ha")) return "hectare";
    return "square feet";
  };

  // 转换任意输入到 sqft（非常健壮：接受数值、含单位字符串、以及 unit 参数）
  const convertToSqftLocal = (val, unit) => {
    const num = parseNumber(val);
    if (!num || num <= 0) return 0;
    const u = inferUnit(unit, val);
    if (u.includes("square meter") || u.includes("sq m") || u.includes("square metre")) {
      return num * 10.7639;
    }
    if (u.includes("acre")) return num * 43560;
    if (u.includes("hectare") || u.includes("ha")) return num * 107639;
    return num; // assume already sqft
  };

  // 输入处理（保持你原有逻辑）
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

  // === 原 subsale 单价 / area 每平方尺计算（保持原有） ===
  const perSqft =
    !isRange && area && single
      ? (Number(String(single).replace(/,/g, "")) / Number(area || 0)).toFixed(2)
      : null;

  // === 新增：如果传入 layouts，则从 layouts 的 min/max 与面积计算总体 PSF ===
  let layoutsPricePerSqftText = "";
  if (Array.isArray(layouts) && layouts.length > 0) {
    let totalArea = 0;
    let totalMin = 0;
    let totalMax = 0;

    layouts.forEach((l) => {
      // 支持多种命名：buildUp / build_up / size / area / buildUpSqft
      const buildUp = l?.buildUp ?? l?.build_up ?? l?.size ?? l?.area ?? l?.buildUpSqft ?? 0;
      const buildUpUnit = l?.buildUpUnit ?? l?.build_up_unit ?? l?.unit ?? l?.buildUpUnitName ?? undefined;
      const land = l?.land ?? l?.land_size ?? l?.land_area ?? l?.landSqft ?? 0;
      const landUnit = l?.landUnit ?? l?.land_unit ?? undefined;

      const buildUpSqft = convertToSqftLocal(buildUp, buildUpUnit);
      const landSqft = convertToSqftLocal(land, landUnit);

      // 支持多种价格字段命名
      const minCandidate = l?.minPrice ?? l?.min_price ?? l?.min ?? l?.minP ?? l?.priceMin ?? l?.startingPrice ?? l?.minprice ?? 0;
      const maxCandidate = l?.maxPrice ?? l?.max_price ?? l?.max ?? l?.maxP ?? l?.priceMax ?? l?.endingPrice ?? l?.maxprice ?? 0;

      const minNum = parseNumber(minCandidate);
      const maxNum = parseNumber(maxCandidate);

      totalArea += buildUpSqft + landSqft;
      totalMin += minNum;
      totalMax += maxNum;
    });

    if (totalArea > 0 && (totalMin > 0 || totalMax > 0)) {
      const minPsf = totalMin > 0 ? totalMin / totalArea : 0;
      const maxPsf = totalMax > 0 ? totalMax / totalArea : 0;
      // 若只有 min 或只有 max，也显示（格式化保留两位）
      if (totalMin > 0 && totalMax > 0) {
        layoutsPricePerSqftText = `每平方英尺: RM ${minPsf.toLocaleString(undefined, { maximumFractionDigits: 2 })} ~ RM ${maxPsf.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
      } else if (totalMin > 0) {
        layoutsPricePerSqftText = `每平方英尺（估）: RM ${minPsf.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
      } else {
        layoutsPricePerSqftText = `每平方英尺（估）: RM ${maxPsf.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
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
                  {predefinedPrices.map((price) => (
                    <li key={`min-${price}`} onClick={() => handleSelectMin(price)} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                      RM {price.toLocaleString()}
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
                  {predefinedPrices.map((price) => (
                    <li key={`max-${price}`} onClick={() => handleSelectMax(price)} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                      RM {price.toLocaleString()}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* layouts 计算结果优先显示（若有） */}
          {layoutsPricePerSqftText && (
            <p className="text-sm text-gray-500 mt-2">{layoutsPricePerSqftText}</p>
          )}
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

          {/* 若有 layouts 计算结果则优先显示（通常 subsale 不会有 layouts） */}
          {layoutsPricePerSqftText ? (
            <p className="text-sm text-gray-500 mt-1">{layoutsPricePerSqftText}</p>
          ) : (
            perSqft && (
              <p className="text-sm text-gray-500 mt-1">
                每平方英尺: RM {Number(perSqft).toLocaleString()}
              </p>
            )
          )}

          {showDropdownSingle && (
            <ul className="absolute z-10 w-full bg-white border mt-1 max-h-60 overflow-y-auto rounded shadow">
              {predefinedPrices.map((price) => (
                <li key={price} onClick={() => handleSelectSingle(price)} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                  RM {price.toLocaleString()}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
