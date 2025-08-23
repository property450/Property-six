import { useState, useEffect, useRef } from "react";

export default function PriceInput({ value, onChange, area, mode }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  const predefinedPrices = [
    50000, 100000, 200000, 300000, 500000,
    800000, 1000000, 1500000, 2000000,
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

  // ---------- 初始化 ----------
  useEffect(() => {
    if (mode === "range") {
      setMinPrice(value?.min || "");
      setMaxPrice(value?.max || "");
    } else {
      setSinglePrice(value || "");
    }
  }, [value, mode]);

  // ---------- 事件 ----------
  const handleSingleChange = (e) => {
    const v = e.target.value.replace(/,/g, "");
    setSinglePrice(v);
    onChange(v);
  };

  const handleMinChange = (e) => {
    const v = e.target.value.replace(/,/g, "");
    setMinPrice(v);
    onChange({ min: v, max: maxPrice });
  };

  const handleMaxChange = (e) => {
    const v = e.target.value.replace(/,/g, "");
    setMaxPrice(v);
    onChange({ min: minPrice, max: v });
  };

  const handleSelectPrice = (p) => {
    if (mode === "range") {
      setMinPrice(p);
      setMaxPrice(p);
      onChange({ min: p, max: p });
    } else {
      setSinglePrice(p);
      onChange(p);
    }
    setShowDropdown(false);
  };

  return (
    <div className="space-y-2 relative" ref={wrapperRef}>
      {mode === "range" ? (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Min"
            value={formatNumber(minPrice)}
            onChange={handleMinChange}
            className="border p-2 flex-1 rounded"
            onFocus={() => setShowDropdown(true)}
          />
          <input
            type="text"
            placeholder="Max"
            value={formatNumber(maxPrice)}
            onChange={handleMaxChange}
            className="border p-2 flex-1 rounded"
            onFocus={() => setShowDropdown(true)}
          />
        </div>
      ) : (
        <input
          type="text"
          placeholder="Price"
          value={formatNumber(singlePrice)}
          onChange={handleSingleChange}
          className="border p-2 w-full rounded"
          onFocus={() => setShowDropdown(true)}
        />
      )}

      {/* 下拉选择价格 */}
      {showDropdown && (
        <div className="absolute z-10 bg-white border rounded shadow mt-1 max-h-40 overflow-y-auto w-full">
          {predefinedPrices.map((p) => (
            <div
              key={p}
              className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
              onMouseDown={() => handleSelectPrice(p)}
            >
              {p.toLocaleString()}
            </div>
          ))}
        </div>
      )}

      {/* 每平方尺单价 */}
      {mode !== "range" && area > 0 && singlePrice ? (
        <div>每平方尺单价: {(Number(singlePrice.replace(/,/g, "")) / area).toFixed(2)}</div>
      )}
    </div>
  );
}
