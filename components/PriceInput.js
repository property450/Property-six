// components/PriceInput.js
import { useState, useRef, useEffect } from "react";

// ---------- 工具：把 AreaSelector 的结果转换成总 sqft ----------
function getTotalAreaSqft(area) {
  if (!area) return 0;

  const toNumber = (val) => {
    if (val == null) return 0;
    const n = parseFloat(String(val).replace(/,/g, ""));
    return Number.isNaN(n) ? 0 : n;
  };

  const convertToSqFt = (val, unit) => {
    const num = toNumber(val);
    if (!num) return 0;
    const u = String(unit || "").toLowerCase();

    if (u.includes("square meter") || u.includes("sq m") || u.includes("sqm")) {
      return num * 10.7639;
    }
    if (u.includes("acre")) return num * 43560;
    if (u.includes("hectare")) return num * 107639;
    return num; // 默认当 sqft
  };

  // 标准结构：{ values, units }
  if (area.values && area.units) {
    const buildUpSqft = convertToSqFt(area.values.buildUp, area.units.buildUp);
    const landSqft = convertToSqFt(area.values.land, area.units.land);
    return (buildUpSqft || 0) + (landSqft || 0);
  }

  // 简单结构：{ buildUp, land }，已是 sqft
  if (typeof area === "object") {
    const buildUp = toNumber(area.buildUp);
    const land = toNumber(area.land);
    return buildUp + land;
  }

  // 数字 / 字符串
  return toNumber(area);
}

// ---------- 工具：生成 psf 文本 ----------
function getPsfText(area, price) {
  const totalAreaSqft = getTotalAreaSqft(area);
  if (!totalAreaSqft || totalAreaSqft <= 0) return "";

  let minPrice = 0;
  let maxPrice = 0;

  if (price == null || price === "") return "";

  if (typeof price === "object") {
    minPrice = Number(price.min) || 0;
    maxPrice = Number(price.max) || 0;
  } else if (typeof price === "string" && price.includes("-")) {
    const [minStr, maxStr] = price.split("-");
    minPrice = Number(minStr) || 0;
    maxPrice = Number(maxStr) || 0;
  } else {
    const num = Number(price) || 0;
    minPrice = num;
    maxPrice = num;
  }

  if (!minPrice && !maxPrice) return "";

  const lowPrice = minPrice > 0 ? minPrice : maxPrice;
  const highPrice = maxPrice > 0 ? maxPrice : minPrice;

  if (!lowPrice) return "";

  const lowPsf = lowPrice / totalAreaSqft;
  const highPsf = highPrice ? highPrice / totalAreaSqft : lowPsf;

  if (!isFinite(lowPsf) || Number.isNaN(lowPsf) || Number.isNaN(highPsf)) {
    return "";
  }

  if (!highPrice || Math.abs(highPsf - lowPsf) < 0.005) {
    return `每平方英尺: RM ${lowPsf.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })}`;
  }

  return `每平方英尺: RM ${lowPsf.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })} ~ RM ${highPsf.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}`;
}

/**
 * props:
 *  - value: 价格
 *  - onChange: (val) => void
 *  - type: propertyStatus，用来判断是不是 range
 *  - area: 面积对象（AreaSelector 的结果，或者 {buildUp,land}）
 */
export default function PriceInput({ value, onChange, type, area }) {
  const wrapperRef = useRef(null);

  const predefinedPrices = [
    50000, 100000, 200000, 300000, 500000,
    800000, 1000000, 1500000, 2000000,
    3000000, 5000000, 10000000, 20000000,
    50000000, 100000000,
  ];

  // ---------- 1. 解析 propertyStatus，判断是不是范围价格 ----------
  let propertyStatus = "";
  if (typeof type === "object" && type !== null) {
    propertyStatus = type.propertyStatus || type.finalType || "";
  } else if (typeof type === "string") {
    propertyStatus = type;
  }

  // New Project / Developer Unit / Completed Unit 用价格范围
  const isRange =
    !!propertyStatus &&
    (propertyStatus.includes("New Project") ||
      propertyStatus.includes("Developer Unit") ||
      propertyStatus.includes("Completed Unit"));

  // ---------- 2. 内部 state ----------
  const [single, setSingle] = useState(""); // 单价
  const [min, setMin] = useState("");       // 范围最低价
  const [max, setMax] = useState("");       // 范围最高价

  const [showDropdownSingle, setShowDropdownSingle] = useState(false);
  const [showDropdownMin, setShowDropdownMin] = useState(false);
  const [showDropdownMax, setShowDropdownMax] = useState(false);

  // ---------- 3. 同步外部 value 到内部 state ----------
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
      } else if (typeof value === "string") {
        setSingle(value.replace(/,/g, ""));
      } else {
        setSingle("");
      }
    }
  }, [value, isRange]);

  // ---------- 4. 点击外面收起下拉 ----------
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdownSingle(false);
        setShowDropdownMin(false);
        setShowDropdownMax(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ---------- 5. 输入 & 选择 逻辑 ----------
  const formatDisplay = (val) => {
    if (val === "" || val === null || val === undefined) return "";
    const n = Number(String(val).replace(/,/g, ""));
    if (Number.isNaN(n)) return "";
    return n.toLocaleString();
  };

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

  // ---------- 6. 计算 psf 文本 ----------
  let priceForPsf;
  if (isRange) {
    priceForPsf = {
      min: Number(min || 0),
      max: Number(max || 0),
    };
  } else {
    priceForPsf = Number(single || 0);
  }

  const psfText = getPsfText(area, priceForPsf);

  // ---------- 7. UI ----------
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
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                RM
              </span>
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
                    <li
                      key={`min-${price}`}
                      onClick={() => handleSelectMin(price)}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      RM {price.toLocaleString()}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Max */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                RM
              </span>
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
                    <li
                      key={`max-${price}`}
                      onClick={() => handleSelectMax(price)}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      RM {price.toLocaleString()}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            RM
          </span>
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
              {predefinedPrices.map((price) => (
                <li
                  key={`single-${price}`}
                  onClick={() => handleSelectSingle(price)}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  RM {price.toLocaleString()}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ✅ psf 显示 */}
      {psfText && (
        <p className="text-sm text-gray-600 mt-1">{psfText}</p>
      )}
    </div>
  );
}
