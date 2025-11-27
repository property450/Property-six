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
  const isRange =
    !!propertyStatus &&
    (propertyStatus.includes("New Project") ||
      propertyStatus.includes("Developer Unit"));

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

  // ---------- 面积换算工具 ----------

  const convertToSqftLocal = (val, unit) => {
    const num = parseFloat(String(val ?? "").replace(/,/g, ""));
    if (isNaN(num) || num <= 0) return 0;
    const u = String(unit || "").toLowerCase();
    if (
      u.includes("square meter") ||
      u.includes("sq m") ||
      u.includes("square metres")
    ) {
      return num * 10.7639;
    }
    if (u.includes("acre")) return num * 43560;
    if (u.includes("hectare")) return num * 107639;
    return num; // 默认当 sqft
  };

  // 把 area 转成 { buildUpSqft, landSqft }
  const getAreaSqftFromAreaProp = (areaObj) => {
    if (!areaObj) return { buildUp: 0, land: 0 };

    // 情况 1：AreaSelector 返回的对象 { values, units }
    if (areaObj.values && areaObj.units) {
      const v = areaObj.values || {};
      const u = areaObj.units || {};
      return {
        buildUp: convertToSqftLocal(v.buildUp, u.buildUp || "square feet"),
        land: convertToSqftLocal(v.land, u.land || "square feet"),
      };
    }

    // 情况 2：已经是数字 { buildUp: 1200, land: 3000 }
    return {
      buildUp: Number(areaObj.buildUp || 0),
      land: Number(areaObj.land || 0),
    };
  };

  // 从单个 layout 里取总面积
  const getAreaSqftFromLayout = (layout) => {
    const a = layout?.buildUp;
    if (!a) return 0;

    // buildUp 是 AreaSelector 对象
    if (a.values && a.units) {
      const v = a.values || {};
      const u = a.units || {};
      const b = convertToSqftLocal(v.buildUp, u.buildUp || "square feet");
      const l = convertToSqftLocal(v.land, u.land || "square feet");
      return b + l;
    }

    // 或者是数字 / 简单对象
    if (typeof a === "number") return a;
    if (typeof a === "object") {
      const b = Number(a.buildUp || 0);
      const l = Number(a.land || 0);
      return b + l;
    }

    return 0;
  };

  const { buildUp: buildUpSqft, land: landSqft } = getAreaSqftFromAreaProp(area);
  const totalAreaSqftFromAreaProp = buildUpSqft + landSqft;

  // ---------- 每平方尺计算 ----------

  // 普通单价（非 New Project）
  const normalPerSqft =
    !isRange && totalAreaSqftFromAreaProp > 0 && single
      ? (
          Number(String(single).replace(/,/g, "")) /
          totalAreaSqftFromAreaProp
        ).toFixed(2)
      : null;

  // New Project / Completed Unit
  let rangePerSqftText = "";

  if (isRange) {
    // 先用「顶层面积 + 顶层 min/max」做一个兜底
    let totalArea = totalAreaSqftFromAreaProp;
    let totalMin = Number(String(min || "").replace(/,/g, "")) || 0;
    let totalMax = Number(String(max || "").replace(/,/g, "")) || 0;

    // 再看 layouts 里有没有真实的数据，如果有，就覆盖上面的数值
    if (Array.isArray(layouts) && layouts.length > 0) {
      let layoutsArea = 0;
      let layoutsMin = 0;
      let layoutsMax = 0;
      let hasValidLayout = false;

      layouts.forEach((l) => {
        const areaVal = getAreaSqftFromLayout(l);
        let minP = 0;
        let maxP = 0;

        if (typeof l.price === "string" && l.price.includes("-")) {
          const [minStr, maxStr] = l.price.split("-");
          minP = Number(String(minStr).replace(/,/g, "")) || 0;
          maxP = Number(String(maxStr).replace(/,/g, "")) || 0;
        }

        if (areaVal > 0 && (minP > 0 || maxP > 0)) {
          hasValidLayout = true;
        }

        layoutsArea += areaVal;
        layoutsMin += minP;
        layoutsMax += maxP;
      });

      // 只有当 layouts 里真的有面积+价格时，才覆盖掉顶层的数值
      if (hasValidLayout && layoutsArea > 0 && (layoutsMin > 0 || layoutsMax > 0)) {
        totalArea = layoutsArea;
        totalMin = layoutsMin;
        totalMax = layoutsMax;
      }
    }

    if (totalArea > 0 && (totalMin > 0 || totalMax > 0)) {
      if (totalMin > 0 && totalMax > 0) {
        const minPsf = totalMin / totalArea;
        const maxPsf = totalMax / totalArea;
        rangePerSqftText = `每平方英尺: RM ${minPsf.toLocaleString(undefined, {
          maximumFractionDigits: 2,
        })} ~ RM ${maxPsf.toLocaleString(undefined, {
          maximumFractionDigits: 2,
        })}`;
      } else if (totalMax > 0) {
        const psf = totalMax / totalArea;
        rangePerSqftText = `每平方英尺: RM ${psf.toLocaleString(undefined, {
          maximumFractionDigits: 2,
        })}`;
      }
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
