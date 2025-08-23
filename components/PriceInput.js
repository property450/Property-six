import { useState, useRef, useEffect } from "react";

export default function PriceInput({ value, onChange, area, mode = "single" }) {
  const wrapperRef = useRef(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDropdownMin, setShowDropdownMin] = useState(false);
  const [showDropdownMax, setShowDropdownMax] = useState(false);

  const predefinedPrices = [
    50000, 100000, 200000, 300000, 500000,
    800000, 1000000, 1500000, 2000000,
    3000000, 5000000, 10000000, 20000000,
    50000000, 100000000,
  ];

  const formatNumber = (num) => {
    if (num === null || num === undefined || num === "") return "";
    const n = typeof num === "string" ? parseFloat(num.replace(/,/g, "")) : num;
    if (isNaN(n)) return "";
    return n.toLocaleString();
  };

  // ---------- 内部状态 ----------
  const [singlePrice, setSinglePrice] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // ---------- 初始化 / 同步 props.value（当父组件切换 mode 或 value 时） ----------
  useEffect(() => {
    if (mode === "range") {
      // value 期望为对象 {min, max} 或空
      setMinPrice(value?.min ?? "");
      setMaxPrice(value?.max ?? "");
    } else {
      // value 期望为字符串数字
      setSinglePrice(value ?? "");
    }
  }, [value, mode]);

  // ---------- 输入事件 ----------
  const handleSingleChange = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    setSinglePrice(raw);
    onChange(raw);
  };

  const handleMinChange = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    setMinPrice(raw);
    onChange({ min: raw, max: maxPrice });
  };

  const handleMaxChange = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    setMaxPrice(raw);
    onChange({ min: minPrice, max: raw });
  };

  // 选择下拉项
  const handleSelect = (price, type) => {
    const priceStr = String(price);
    if (mode === "range") {
      if (type === "min") {
        setMinPrice(priceStr);
        onChange({ min: priceStr, max: maxPrice });
      } else {
        setMaxPrice(priceStr);
        onChange({ min: minPrice, max: priceStr });
      }
    } else {
      setSinglePrice(priceStr);
      onChange(priceStr);
      setShowDropdown(false);
    }
  };

  // 点击外部关闭下拉
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
        setShowDropdownMin(false);
        setShowDropdownMax(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 每平方英尺（仅 single）
  const perSqft =
    mode === "single" && area && singlePrice
      ? (parseFloat(singlePrice) / parseFloat(area)).toFixed(2)
      : null;

  return (
    <div className="relative w-full space-y-2" ref={wrapperRef}>
      {mode === "range" ? (
        <div className="flex gap-2">
          {/* Min */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Min"
              value={formatNumber(minPrice)}
              onChange={handleMinChange}
              className="border p-2 w-full rounded"
              onFocus={() => {
                setShowDropdownMin(true);
                setShowDropdown(false);
              }}
            />
            {showDropdownMin && (
              <ul className="absolute z-10 w-full bg-white border mt-1 max-h-60 overflow-y-auto rounded shadow">
                {predefinedPrices.map((p) => (
                  <li
                    key={p}
                    onMouseDown={() => handleSelect(p, "min")}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    RM {p.toLocaleString()}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Max */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Max"
              value={formatNumber(maxPrice)}
              onChange={handleMaxChange}
              className="border p-2 w-full rounded"
              onFocus={() => {
                setShowDropdownMax(true);
                setShowDropdown(false);
              }}
            />
            {showDropdownMax && (
              <ul className="absolute z-10 w-full bg-white border mt-1 max-h-60 overflow-y-auto rounded shadow">
                {predefinedPrices.map((p) => (
                  <li
                    key={p}
                    onMouseDown={() => handleSelect(p, "max")}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    RM {p.toLocaleString()}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700">价格</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">RM</span>
            <input
              type="text"
              value={formatNumber(singlePrice)}
              onChange={handleSingleChange}
              className="pl-12 pr-4 py-2 border rounded w-full"
              placeholder="请输入价格"
              onFocus={() => {
                setShowDropdown(true);
                setShowDropdownMin(false);
                setShowDropdownMax(false);
              }}
            />
          </div>

          {showDropdown && (
            <ul className="absolute z-10 w-full bg-white border mt-1 max-h-60 overflow-y-auto rounded shadow">
              {predefinedPrices.map((price) => (
                <li
                  key={price}
                  onMouseDown={() => handleSelect(price)}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  RM {price.toLocaleString()}
                </li>
              ))}
            </ul>
          )}

          {perSqft && (
            <p className="text-sm text-gray-500 mt-1">
              每平方英尺: RM {parseFloat(perSqft).toLocaleString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
