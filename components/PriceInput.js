// components/PriceInput.js
import { useState, useRef, useEffect } from "react";

export default function PriceInput({
  value,
  onChange,
  type,          // 用来解析 propertyStatus（是否范围价格）
  listingMode,   // ⭐ 新增：Sale / Rent / Homestay / Hotel
  area,
}) {
  const wrapperRef = useRef(null);

  // 旧的预设价格，用于「范围价格」(New Project / Developer Unit / Completed Unit)
  const predefinedPrices = [
    50000, 100000, 200000, 300000, 500000,
    800000, 1000000, 1500000, 2000000,
    3000000, 5000000, 10000000, 20000000,
    50000000, 100000000,
  ];

  // 👉 Sale 单价选项（Subsale / 普通买卖）
  const SALE_PRICE_OPTIONS = [
    50000, 100000, 200000, 300000, 500000,
    800000, 1000000, 1500000, 2000000,
    3000000, 5000000, 10000000,
  ];

  // 👉 Rent 单价选项（出租）
  const RENT_PRICE_OPTIONS = [
    500, 800, 1000, 1500, 2000,
    2500, 3000, 4000, 5000, 8000,
    10000, 15000, 20000, 50000, 100000,
    300000, 500000, 1000000,
  ];

  // ⭐ 根据 Sale / Rent 切换「单价」下拉选项
  const mode = (listingMode || "").toString(); // 可能是 "Sale" / "Rent" / "Homestay" / "Hotel/Resort"
  const singlePriceOptions =
    mode === "Rent" ? RENT_PRICE_OPTIONS : SALE_PRICE_OPTIONS;

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
      if (value && typeof value === "object") {
        const vmin = value.min ?? value.minPrice ?? value.from ?? "";
        const vmax = value.max ?? value.maxPrice ?? value.to ?? "";
        setMin(String(vmin).replace(/,/g, ""));
        setMax(String(vmax).replace(/,/g, ""));
      } else if (typeof value === "string" && value.includes("-")) {
        const [vmin, vmax] = value.split("-");
        setMin((vmin || "").replace(/,/g, ""));
        setMax((vmax || "").replace(/,/g, ""));
      } else {
        setMin("");
        setMax("");
      }
    } else {
      // 单一价格
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
    onChange && onChange(raw);
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
    onChange && onChange({ min: raw, max });
  };

  const handleMaxChange = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    setMax(raw);
    onChange && onChange({ min, max: raw });
  };

  const handleSelectMin = (p) => {
    const raw = String(p);
    setMin(raw);
    onChange && onChange({ min: raw, max });
    setShowDropdownMin(false);
  };

  const handleSelectMax = (p) => {
    const raw = String(p);
    setMax(raw);
    onChange && onChange({ min, max: raw });
    setShowDropdownMax(false);
  };

  // ---------- 6. UI ----------
  return (
    <div className="relative w-full" ref={wrapperRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {isRange ? "价格范围" : "价格"}
      </label>

      {isRange ? (
        // ---- 范围价格：New Project / Developer Unit / Completed Unit ----
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
      ) : (
        // ---- 单一价格：Subsale / Rent / Homestay / Hotel ----
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
              {singlePriceOptions.map((price) => (
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
