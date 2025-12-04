// components/PriceInput.js
import { useState, useRef, useEffect } from "react";

export default function PriceInput({ value, onChange, type, area }) {
  const wrapperRef = useRef(null);

  const predefinedPrices = [
    50000, 100000, 200000, 300000, 500000,
    800000, 1000000, 1500000, 2000000,
    3000000, 5000000, 10000000, 20000000,
    50000000, 100000000,
  ];

  // RENT 价格
  const RENT_PRICE_OPTIONS = [
    500, 800, 1000, 1500, 2000,
    2500, 3000, 4000, 5000, 8000,
    10000, 15000, 20000, 50000, 100000,
    300000, 500000, 1000000,
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
  const [min, setMin] = useState("");       // 范围最低价（纯数字字符串）
  const [max, setMax] = useState("");       // 范围最高价（纯数字字符串）

  const [showDropdownSingle, setShowDropdownSingle] = useState(false);
  const [showDropdownMin, setShowDropdownMin] = useState(false);
  const [showDropdownMax, setShowDropdownMax] = useState(false);

  // ---------- 3. 同步外部 value 到内部 state ----------
  useEffect(() => {
    if (isRange) {
      if (value && typeof value === "object") {
        // ✅ 我们期望的格式：{ min, max }
        const vmin = value.min ?? value.minPrice ?? value.from ?? "";
        const vmax = value.max ?? value.maxPrice ?? value.to ?? "";
        setMin(String(vmin).replace(/,/g, ""));
        setMax(String(vmax).replace(/,/g, ""));
      } else if (typeof value === "string" && value.includes("-")) {
        // 兼容旧格式："min-max"
        const [vmin, vmax] = value.split("-");
        setMin((vmin || "").replace(/,/g, ""));
        setMax((vmax || "").replace(/,/g, ""));
      } else {
        setMin("");
        setMax("");
      }
    } else {
      // 非范围价格：单一价格
      if (value === null || value === undefined || value === "") {
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

  // 单一价格
  const handleSingleChange = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    setSingle(raw);
    onChange && onChange(raw); // subsale 还是用单一数值字符串
  };

  const handleSelectSingle = (p) => {
    const raw = String(p);
    setSingle(raw);
    onChange && onChange(raw);
    setShowDropdownSingle(false);
  };

  // 范围价格：Min / Max 输入时，统一传 {min, max}
  const handleMinChange = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    setMin(raw);
    onChange && onChange({ min: raw, max });   // ✅ 改成对象
  };

  const handleMaxChange = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    setMax(raw);
    onChange && onChange({ min, max: raw });   // ✅ 改成对象
  };

  const handleSelectMin = (p) => {
    const raw = String(p);
    setMin(raw);
    onChange && onChange({ min: raw, max });   // ✅
    setShowDropdownMin(false);
  };

  const handleSelectMax = (p) => {
    const raw = String(p);
    setMax(raw);
    onChange && onChange({ min, max: raw });   // ✅
    setShowDropdownMax(false);
  };

  // ---------- 6. UI ----------
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
    </div>
  );
}
