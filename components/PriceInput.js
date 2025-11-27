// components/PriceInput.js
import { useState, useRef, useEffect } from "react";

export default function PriceInput({ value, onChange, area, type, layouts }) {
  const wrapperRef = useRef(null);

  const predefinedPrices = [
    50000, 100000, 200000, 300000, 500000,
    800000, 1000000, 1500000, 2000000,
    3000000, 5000000, 10000000, 20000000,
    50000000, 100000000,
  ];

  // 当前 propertyStatus
  let propertyStatus = "";
  if (typeof type === "object" && type !== null) {
    propertyStatus = type.propertyStatus || type.finalType || "";
  } else if (typeof type === "string") {
    propertyStatus = type;
  }

  // New Project / Developer Unit 用价格范围
  const isRange = !!(
    propertyStatus &&
    (propertyStatus.includes("New Project") ||
      propertyStatus.includes("Developer Unit"))
  );

  const [single, setSingle] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");

  const [showDropdownSingle, setShowDropdownSingle] = useState(false);
  const [showDropdownMin, setShowDropdownMin] = useState(false);
  const [showDropdownMax, setShowDropdownMax] = useState(false);

  // 同步外部 value
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

  // 点击外部收起下拉
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

  // ---------- 面积统一换算（兼容两种写法） ----------

  const convertToSqftLocal = (val, unit) => {
    const num = parseFloat(String(val ?? "").replace(/,/g, ""));
    if (isNaN(num) || num <= 0) return 0;
    const u = String(unit || "").toLowerCase();
    if (u.includes("square meter") || u.includes("sq m") || u.includes("square metres")) {
      return num * 10.7639;
    }
    if (u.includes("acre")) return num * 43560;
    if (u.includes("hectare")) return num * 107639;
    return num; // 默认当 sqft
  };

  // 统一把 area 转成 { buildUpSqft, landSqft } 两个数字
  const getAreaSqft = (areaObj) => {
    if (!areaObj) return { buildUp: 0, land: 0 };

    // ✅ 情况 1：AreaSelector 返回的对象 { values, units }
    if (areaObj.values && areaObj.units) {
      const v = areaObj.values || {};
      const u = areaObj.units || {};
      return {
        buildUp: convertToSqftLocal(v.buildUp, u.buildUp || "square feet"),
        land: convertToSqftLocal(v.land, u.land || "square feet"),
      };
    }

    // ✅ 情况 2：已经是数字 { buildUp: 1200, land: 3000 }
    return {
      buildUp: Number(areaObj.buildUp || 0),
      land: Number(areaObj.land || 0),
    };
  };

  const { buildUp: buildUpSqft, land: landSqft } = getAreaSqft(area);
  const totalAreaSqft = buildUpSqft + landSqft;

  // ---------- 每平方尺计算 ----------

  // 普通单价（非 New Project）用单价 + area
  const normalPerSqft =
    !isRange && totalAreaSqft > 0 && single
      ? (
          Number(String(single).replace(/,/g, "")) /
          totalAreaSqft
        ).toFixed(2)
      : null;

  // New Project / Completed Unit 用 价格范围 + area
  let rangePerSqftText = "";
  if (isRange && totalAreaSqft > 0) {
    const minNum = Number(String(min || "").replace(/,/g, "")) || 0;
    const maxNum = Number(String(max || "").replace(/,/g, "")) || 0;

    if (minNum > 0 && maxNum > 0) {
      const minPsf = minNum / totalAreaSqft;
      const maxPsf = maxNum / totalAreaSqft;
      rangePerSqftText = `每平方英尺: RM ${minPsf.toLocaleString(undefined, {
        maximumFractionDigits: 2,
      })} ~ RM ${maxPsf.toLocaleString(undefined, {
        maximumFractionDigits: 2,
      })}`;
    } else if (maxNum > 0) {
      const psf = maxNum / totalAreaSqft;
      rangePerSqftText = `每平方英尺: RM ${psf.toLocaleString(undefined, {
        maximumFractionDigits: 2,
      })}`;
    }
  }

  // ---------- UI ----------

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

          {/* ✅ New Project / Completed Unit 每平方尺 */}
          {rangePerSqftText && (
            <p className="text-sm text-gray-500 mt-1">{rangePerSqftText}</p>
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
          {normalPerSqft && (
            <p className="text-sm text-gray-500 mt-1">
              每平方英尺: RM {Number(normalPerSqft).toLocaleString()}
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
