import { useState, useRef, useEffect } from "react";

export default function PriceInput({ value, onChange, area, type }) {
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
    return n.toLocaleString();
  };

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

  const perSqft =
    !isRange && area && single
      ? (Number(String(single).replace(/,/g, "")) / Number(area || 0)).toFixed(2)
      : null;

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

          {/* ✅ 新增：显示每平方英尺单价（基于 Min） */}
          {min && area && (
            <p className="text-sm text-gray-500 mt-2">
              每平方英尺: RM{" "}
              {(Number(min.replace(/,/g, "")) / Number(area || 0)).toFixed(2)}
            </p>
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
          {perSqft && (
            <p className="text-sm text-gray-500 mt-1">
              每平方英尺: RM {Number(perSqft).toLocaleString()}
            </p>
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
