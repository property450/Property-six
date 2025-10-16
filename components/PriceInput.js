import { useState, useRef, useEffect } from "react";

export default function PriceInput({ value, onChange, area, type, layouts }) {
  const wrapperRef = useRef(null);

  const predefinedPrices = [
    50000, 100000, 200000, 300000, 500000,
    800000, 1000000, 1500000, 2000000,
    3000000, 5000000, 10000000, 20000000,
    50000000, 100000000,
  ];

  // 识别 propertyStatus
  let propertyStatus = "";
  if (typeof type === "object" && type !== null) {
    propertyStatus = type.propertyStatus || type.finalType || "";
  } else if (typeof type === "string") {
    propertyStatus = type;
  }

  const isRange = !!(
    propertyStatus &&
    (
      propertyStatus.includes("New Project") ||
      propertyStatus.includes("Developer Unit")
    )
  );

  const [single, setSingle] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");

  const [showDropdownSingle, setShowDropdownSingle] = useState(false);
  const [showDropdownMin, setShowDropdownMin] = useState(false);
  const [showDropdownMax, setShowDropdownMax] = useState(false);

  // 初始化值
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

  // 点击外部关闭下拉
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

  // 🔸 计算总面积（优先 layouts）
  const getTotalArea = () => {
    if (layouts && layouts.length > 0) {
      let totalBuildUp = 0;
      let totalLand = 0;
      layouts.forEach(l => {
        const buildUpVal = Number(String(l.buildUp || 0).replace(/,/g, "")) || 0;
        const landVal = Number(String(l.land || 0).replace(/,/g, "")) || 0;
        totalBuildUp += buildUpVal;
        totalLand += landVal;
      });
      return totalBuildUp + totalLand;
    }

    if (!area) return 0;
    if (typeof area === "object") {
      const parse = (v) => Number(String(v).replace(/,/g, "")) || 0;
      const buildUp = parse(area.buildUp);
      const land = parse(area.land);
      return buildUp + land;
    }
    return Number(String(area).replace(/,/g, "")) || 0;
  };

  const totalArea = getTotalArea();

  // 格式化显示
  const formatDisplay = (val) => {
    if (val === "" || val === null || val === undefined) return "";
    const n = Number(String(val).replace(/,/g, ""));
    if (Number.isNaN(n)) return "";
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // 输入 & 选择事件
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

  // 计算每平方尺价格
  let pricePerSqftText = "";
  if (totalArea > 0) {
    if (isRange && min && max) {
      const minP = Number(String(min).replace(/,/g, "")) / totalArea;
      const maxP = Number(String(max).replace(/,/g, "")) / totalArea;
      pricePerSqftText = `每平方英尺: RM ${minP.toLocaleString(undefined, { maximumFractionDigits: 2 })} ~ RM ${maxP.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    } else if (!isRange && single) {
      const p = Number(String(single).replace(/,/g, "")) / totalArea;
      pricePerSqftText = `每平方英尺: RM ${p.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
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

      {pricePerSqftText && (
        <p className="text-sm text-gray-500 mt-1">{pricePerSqftText}</p>
      )}
    </div>
  );
}
