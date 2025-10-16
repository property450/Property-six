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

  let propertyStatus = "";
  if (typeof type === "object" && type !== null) {
    propertyStatus = type.propertyStatus || type.finalType || "";
  } else if (typeof type === "string") {
    propertyStatus = type;
  }

  // ✅ 把 Completed Unit 也算进 range 类型
  const isRange = !!(
    propertyStatus &&
    (
      propertyStatus.includes("New Project") ||
      propertyStatus.includes("Developer Unit") ||
      propertyStatus.includes("Completed Unit")
    )
  );

  const [single, setSingle] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");

  const [showDropdownSingle, setShowDropdownSingle] = useState(false);
  const [showDropdownMin, setShowDropdownMin] = useState(false);
  const [showDropdownMax, setShowDropdownMax] = useState(false);

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
    onChange && onChange(`${raw}-${max}`);
  };
  const handleMaxChange = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    setMax(raw);
    onChange && onChange(`${min}-${raw}`);
  };
  const handleSelectMin = (p) => {
    setMin(String(p));
    onChange && onChange(`${p}-${max}`);
    setShowDropdownMin(false);
  };
  const handleSelectMax = (p) => {
    setMax(String(p));
    onChange && onChange(`${min}-${p}`);
    setShowDropdownMax(false);
  };

  // === 原有单价 / area 每平方英尺计算（保持不变） ===
  const perSqft =
    !isRange && area && single
      ? (Number(String(single).replace(/,/g, "")) / Number(area || 0)).toFixed(2)
      : null;

  // === 新增：若传入 layouts，则使用 layouts 中的 minPrice/maxPrice 与面积计算每平方尺价格范围 ===
  const convertToSqftLocal = (val, unit) => {
    const raw = Number(String(val || "").replace(/,/g, "")) || 0;
    const u = (unit || "").toString().toLowerCase();
    if (u.includes("square meter") || u.includes("sq m") || u.includes("square metres") || u.includes("square metre")) {
      return raw * 10.7639;
    }
    if (u.includes("acre")) return raw * 43560;
    if (u.includes("hectare")) return raw * 107639;
    return raw; // assume already sqft
  };

  let layoutsPricePerSqftText = "";
  if (Array.isArray(layouts) && layouts.length > 0) {
    let totalArea = 0;
    let totalMin = 0;
    let totalMax = 0;

    layouts.forEach((l) => {
      const buildUp = l.buildUp ?? l.build_up ?? l.size ?? 0;
      const buildUpUnit = l.buildUpUnit ?? l.build_up_unit ?? l.unit ?? "square feet";
      const land = l.land ?? l.land_size ?? 0;
      const landUnit = l.landUnit ?? l.land_unit ?? "square feet";

      const buildUpSqft = convertToSqftLocal(buildUp, buildUpUnit);
      const landSqft = convertToSqftLocal(land, landUnit);

      const minP = Number(String(l.minPrice ?? l.min ?? "").replace(/,/g, "")) || 0;
      const maxP = Number(String(l.maxPrice ?? l.max ?? "").replace(/,/g, "")) || 0;

      totalArea += buildUpSqft + landSqft;
      totalMin += minP;
      totalMax += maxP;
    });

    if (totalArea > 0 && (totalMin > 0 || totalMax > 0)) {
      const minPsf = totalMin / totalArea;
      const maxPsf = totalMax / totalArea;
      layoutsPricePerSqftText = `每平方英尺: RM ${minPsf.toLocaleString(undefined, { maximumFractionDigits: 2 })} ~ RM ${maxPsf.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    }
  }

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <label className="block text-sm font-medium text-gray-700">
        {isRange ? "价格范围" : "价格"}
      </label>

      {isRange ? (
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

          {/* 如果有 layouts 计算结果，显示每平方尺价格范围 */}
          {layoutsPricePerSqftText ? (
            <div className="col-span-2">
              <p className="text-sm text-gray-500 mt-2">{layoutsPricePerSqftText}</p>
            </div>
          ) : null}
        </div>
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
          {/* 若传入 layouts 并有计算结果，优先显示 layouts 的每平方尺价格（一般不会对 subsale 生效） */}
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
                <li
                  key={price}
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
