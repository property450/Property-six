// components/PriceInput.js
import { useState, useRef, useEffect } from "react";

export default function PriceInput({ value, onChange, area, type }) {
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

  // ---------- 3. 工具函数：把 area 统一变成「总平方英尺」 ----------
  const convertToSqft = (val, unit) => {
    const num = parseFloat(String(val || "").replace(/,/g, ""));
    if (isNaN(num) || num <= 0) return 0;
    const u = String(unit || "").toLowerCase();

    if (u.includes("square meter") || u.includes("sq m") || u.includes("sqm")) {
      return num * 10.7639;
    }
    if (u.includes("acre")) return num * 43560;
    if (u.includes("hectare")) return num * 107639;
    // 默认当作 sqft
    return num;
  };

  const getTotalAreaSqft = (areaValue) => {
    if (areaValue === null || areaValue === undefined) return 0;

    // 直接数字 / 字符串
    if (typeof areaValue === "number" || typeof areaValue === "string") {
      const num = parseFloat(String(areaValue).replace(/,/g, ""));
      return isNaN(num) ? 0 : num;
    }

    // AreaSelector 风格：{ values, units }
    if (typeof areaValue === "object") {
      if (areaValue.values && areaValue.units) {
        const buildUpSqft = convertToSqft(
          areaValue.values.buildUp,
          areaValue.units.buildUp
        );
        const landSqft = convertToSqft(
          areaValue.values.land,
          areaValue.units.land
        );
        return (buildUpSqft || 0) + (landSqft || 0);
      }

      // 简单对象：{ buildUp, land }，已经是 sqft
      const buildUp = Number(areaValue.buildUp || 0);
      const land = Number(areaValue.land || 0);
      return buildUp + land;
    }

    return 0;
  };

  const totalAreaSqft = getTotalAreaSqft(area);

  // ---------- 4. 同步外部 value 到内部 state ----------
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

  // ---------- 5. 点击外面收起下拉 ----------
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

  // ---------- 6. 输入 & 选择 逻辑 ----------
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

  // ---------- 7. 计算每平方英尺（单价 / 范围） ----------
  let normalPerSqftText = "";
  if (!isRange && totalAreaSqft > 0) {
    const priceNum = Number(String(single || "").replace(/,/g, "")) || 0;
    if (priceNum > 0) {
      const psf = priceNum / totalAreaSqft;
      normalPerSqftText = `每平方英尺: RM ${psf.toLocaleString(undefined, {
        maximumFractionDigits: 2,
      })}`;
    }
  }

  let rangePerSqftText = "";
  if (isRange && totalAreaSqft > 0) {
    const minNum = Number(String(min || "").replace(/,/g, "")) || 0;
    const maxNum = Number(String(max || "").replace(/,/g, "")) || 0;

    // ✅ 只要两个里面有一个填了，就算
    const lowPrice = minNum > 0 ? minNum : maxNum;
    const highPrice = maxNum > 0 ? maxNum : minNum;

    if (lowPrice > 0) {
      const lowPsf = lowPrice / totalAreaSqft;
      const highPsf = highPrice > 0 ? highPrice / totalAreaSqft : lowPsf;

      if (Math.abs(highPsf - lowPsf) < 0.005) {
        // 两个差不多，就当作一个值显示
        rangePerSqftText = `每平方英尺: RM ${lowPsf.toLocaleString(
          undefined,
          { maximumFractionDigits: 2 }
        )}`;
      } else {
        rangePerSqftText = `每平方英尺: RM ${lowPsf.toLocaleString(
          undefined,
          { maximumFractionDigits: 2 }
        )} ~ RM ${highPsf.toLocaleString(undefined, {
          maximumFractionDigits: 2,
        })}`;
      }
    }
  }

  // ---------- 8. UI ----------
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

          {/* ✅ New Project / Completed Unit 的每平方尺显示 */}
          {rangePerSqftText && (
            <p className="text-sm text-gray-500 mt-1">
              {rangePerSqftText}
            </p>
          )}
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
          {normalPerSqftText && (
            <p className="text-sm text-gray-500 mt-1">
              {normalPerSqftText}
            </p>
          )}
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
    </div>
  );
}
