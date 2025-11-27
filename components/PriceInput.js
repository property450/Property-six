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

  // ===== 保持你原来的 propertyStatus 逻辑 =====
  let propertyStatus = "";
  if (typeof type === "object" && type !== null) {
    propertyStatus = type.propertyStatus || type.finalType || "";
  } else if (typeof type === "string") {
    propertyStatus = type;
  }

  // ✅ 范围价格：New Project / Developer Unit / Completed Unit
  const isRange =
    !!propertyStatus &&
    (
      propertyStatus.includes("New Project") ||
      propertyStatus.includes("Developer Unit") ||
      propertyStatus.includes("Completed Unit")
    );

  const [single, setSingle] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");

  const [showDropdownSingle, setShowDropdownSingle] = useState(false);
  const [showDropdownMin, setShowDropdownMin] = useState(false);
  const [showDropdownMax, setShowDropdownMax] = useState(false);

  // ===== 保持你原来的 value → state 同步逻辑 =====
  useEffect(() => {
    if (isRange) {
      if (typeof value === "string" && value.includes("-")) {
        const [vmin, vmax] = value.split("-");
        setMin(vmin ?? "");
        setMax(vmax ?? "");
      } else if (value && typeof value === "object") {
        setMin(value.min ?? "");
        setMax(value.max ?? "");
      } else {
        setMin("");
        setMax("");
      }
    } else {
      if (typeof value === "string" && !value.includes("-")) {
        setSingle(String(value).replace(/,/g, ""));
      } else if (typeof value === "number") {
        setSingle(String(value));
      } else {
        setSingle("");
      }
    }
  }, [value, isRange]);

  // ===== 保持你原来的点击外部收起下拉逻辑 =====
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
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // ===== 保持你原来的 onChange 逻辑 =====
  const handleSingleChange = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    setSingle(raw);
    onChange(raw);
  };
  const handleSelectSingle = (p) => {
    setSingle(String(p));
    onChange(String(p));
    setShowDropdownSingle(false);
  };

  const handleMinChange = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    setMin(raw);
    onChange(`${raw}-${max}`);
  };
  const handleMaxChange = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    setMax(raw);
    onChange(`${min}-${raw}`);
  };
  const handleSelectMin = (p) => {
    setMin(String(p));
    onChange(`${p}-${max}`);
    setShowDropdownMin(false);
  };
  const handleSelectMax = (p) => {
    setMax(String(p));
    onChange(`${min}-${p}`);
    setShowDropdownMax(false);
  };

  // ===== 面积换算函数：保留你的实现 =====
  const convertToSqftLocal = (val, unit) => {
    const num = parseFloat(String(val || "").replace(/,/g, ""));
    if (isNaN(num) || num <= 0) return 0;
    const u = (unit || "").toString().toLowerCase();
    if (u.includes("square meter") || u.includes("sq m") || u.includes("square metres")) {
      return num * 10.7639;
    }
    if (u.includes("acre")) return num * 43560;
    if (u.includes("hectare")) return num * 107639;
    return num; // assume sqft
  };

  // ===== 普通单价每平方尺（Subsale 用）保持不变 =====
  const perSqft =
    !isRange && area && single
      ? (
          Number(String(single).replace(/,/g, "")) /
          (Number(area.buildUp || 0) + Number(area.land || 0))
        ).toFixed(2)
      : null;

  // ===== New Project / Completed Unit：用 layouts 计算每平方尺 RM x ~ RM y =====
  let pricePerSqftText = "";
  if (isRange && Array.isArray(layouts) && layouts.length > 0) {
    let totalArea = 0;
    let totalMin = 0;
    let totalMax = 0;

    layouts.forEach((l) => {
      // 面积：buildUp + land
      const buildUpSqft = convertToSqftLocal(l.buildUp, l.buildUpUnit || "square feet");
      const landSqft = convertToSqftLocal(l.land, l.landUnit || "square feet");
      totalArea += buildUpSqft + landSqft;

      // 价格：优先用 minPrice/maxPrice；没有的话解析 price: "100000-200000"
      let minP = Number(String(l.minPrice || "").replace(/,/g, "")) || 0;
      let maxP = Number(String(l.maxPrice || "").replace(/,/g, "")) || 0;

      if ((!minP && !maxP) && typeof l.price === "string" && l.price.includes("-")) {
        const [pmin, pmax] = l.price.split("-");
        minP = Number(String(pmin).replace(/,/g, "")) || 0;
        maxP = Number(String(pmax).replace(/,/g, "")) || 0;
      }

      totalMin += minP;
      totalMax += maxP;
    });

    if (totalArea > 0 && (totalMin > 0 || totalMax > 0)) {
      const minPsf = totalMin / totalArea;
      const maxPsf = totalMax / totalArea;
      pricePerSqftText = `每平方英尺: RM ${minPsf.toLocaleString(undefined, {
        maximumFractionDigits: 2,
      })} ~ RM ${maxPsf.toLocaleString(undefined, {
        maximumFractionDigits: 2,
      })}`;
    }
  }

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <label className="block text-sm font-medium text-gray-700">
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

          {/* ✅ 在范围模式（New Project / Completed Unit）下显示每平方尺 RM x ~ RM y */}
          {pricePerSqftText && (
            <p className="text-sm text-gray-500 mt-1">{pricePerSqftText}</p>
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
          {/* 旧的普通房源每平方尺 */}
          {perSqft && (
            <p className="text-sm text-gray-500 mt-1">
              每平方英尺: RM {Number(perSqft).toLocaleString()}
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
