// components/PriceInput.js
import { useState, useRef, useEffect } from "react";

export default function PriceInput({
  value,
  onChange,
  type,          // 用来解析 propertyStatus（是否范围价格）
  listingMode,   // ⭐ 新增：Sale / Rent / Homestay / Hotel
  area,
  areaData,
}) {
  const wrapperRef = useRef(null);

  // ✅ 兼容：旧版传 area，新版传 areaData
  const usedArea = areaData ?? area;

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
    2500, 3000, 3500, 4000, 4500,
    5000, 6000, 7000, 8000, 9000,
    10000, 12000, 15000, 20000, 25000,
    30000, 40000, 50000, 80000, 100000,
    150000, 200000, 300000, 500000, 1000000,
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
      propertyStatus.includes("Under Construction") ||
      propertyStatus.includes("Developer Unit") ||
      propertyStatus.includes("Completed Unit"));

  // ---------- 2. 内部状态 ----------
  const [single, setSingle] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");

  const [showDropdownSingle, setShowDropdownSingle] = useState(false);
  const [showDropdownMin, setShowDropdownMin] = useState(false);
  const [showDropdownMax, setShowDropdownMax] = useState(false);

  // ---------- 3. 初始化：根据 value 填充 ----------
  useEffect(() => {
    if (isRange) {
      // value 可能是 {min, max}
      const v = value && typeof value === "object" ? value : {};
      setMin(v.min ? String(v.min) : "");
      setMax(v.max ? String(v.max) : "");
      setSingle("");
    } else {
      setSingle(value ? String(value) : "");
      setMin("");
      setMax("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRange]);

  // ---------- 4. 点击外部关闭下拉 ----------
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target)) {
        setShowDropdownSingle(false);
        setShowDropdownMin(false);
        setShowDropdownMax(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ---------- 5. 输入 & 选择 逻辑 ----------

  // ---------- PSF 计算（用于显示 “每平方英尺: RM ...”） ----------
  const toSqft = (val, unit) => {
    const raw = String(val ?? "").replace(/,/g, "").trim();
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return 0;
    const u = String(unit || "").toLowerCase();
    if (u.includes("sqft") || u.includes("square feet")) return n;
    if (u.includes("sqm") || u.includes("square meter") || u.includes("square metre")) return n * 10.763910416709722;
    if (u.includes("acre")) return n * 43560;
    if (u.includes("hectare")) return n * 107639.1041670972;
    return 0;
  };

  const getTotalSqftFromArea = () => {
    const a = usedArea;
    if (!a || typeof a !== "object") return 0;
    const types = Array.isArray(a.types) ? a.types : [];
    const values = a.values && typeof a.values === "object" ? a.values : {};
    const units = a.units && typeof a.units === "object" ? a.units : {};

    let total = 0;
    if (types.includes("buildUp")) total += toSqft(values.buildUp, units.buildUp);
    if (types.includes("land")) total += toSqft(values.land, units.land);

    // 如果 types 没有维护好，就按有值的来
    if (!types.length) {
      if (values.buildUp) total += toSqft(values.buildUp, units.buildUp);
      if (values.land) total += toSqft(values.land, units.land);
    }
    return total;
  };

  const formatPsf = (n) => {
    if (!Number.isFinite(n) || n <= 0) return "";
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const totalSqft = getTotalSqftFromArea();
  const getSinglePsfText = (priceVal) => {
    const p = Number(String(priceVal ?? "").replace(/,/g, ""));
    if (!Number.isFinite(p) || p <= 0 || !totalSqft) return "";
    const psf = p / totalSqft;
    return `每平方英尺: RM ${formatPsf(psf)}`;
  };

  const getRangePsfText = (minVal, maxVal) => {
    const minP = Number(String(minVal ?? "").replace(/,/g, ""));
    const maxP = Number(String(maxVal ?? "").replace(/,/g, ""));
    if (!totalSqft) return "";
    const hasMin = Number.isFinite(minP) && minP > 0;
    const hasMax = Number.isFinite(maxP) && maxP > 0;
    if (!hasMin && !hasMax) return "";
    const minPsf = hasMin ? minP / totalSqft : null;
    const maxPsf = hasMax ? maxP / totalSqft : null;
    if (minPsf !== null && maxPsf !== null) return `每平方英尺: RM ${formatPsf(minPsf)} ~ RM ${formatPsf(maxPsf)}`;
    if (minPsf !== null) return `每平方英尺: RM ${formatPsf(minPsf)}`;
    return `每平方英尺: RM ${formatPsf(maxPsf)}`;
  };

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

          {getRangePsfText(min, max) ? (
            <div className="text-sm text-gray-600 mt-2">{getRangePsfText(min, max)}</div>
          ) : null}
        </>
      ) : (
        // ---- 单一价格：Subsale / Rent ----
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
          {getSinglePsfText(single) ? (
            <div className="text-sm text-gray-600 mt-1">{getSinglePsfText(single)}</div>
          ) : null}
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
