import { useState, useEffect, useRef } from "react";

export default function PriceInput({ value, onChange, area, placeholder }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  const predefinedPrices = [
    50000, 100000, 200000, 300000, 500000,
    800000, 1000000, 1500000, 2000000,
    3000000, 5000000, 8000000, 10000000
  ];

  // 点击外部关闭下拉
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatNumber = (num) => {
    if (num === null || num === undefined || isNaN(num)) return "";
    return num.toLocaleString();
  };

  const parseNumber = (str) => {
    if (!str) return "";
    return parseFloat(str.replace(/,/g, ""));
  };

  const handleInputChange = (e) => {
    const rawValue = parseNumber(e.target.value);
    onChange(rawValue);
  };

  const handleSelectPrice = (price) => {
    onChange(price);
    setShowDropdown(false);
  };

  // 计算单价（每平方英尺）
  const pricePerSqft =
    area && value && !isNaN(parseFloat(area)) && !isNaN(parseFloat(value))
      ? (parseFloat(value) / parseFloat(area)).toFixed(2)
      : null;

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <label className="block text-sm font-medium mb-1">价格 (RM)</label>
      <input
        type="text"
        className="w-full border p-2 rounded"
        value={formatNumber(value)}
        onChange={handleInputChange}
        onFocus={() => setShowDropdown(true)}
        placeholder={placeholder || "请输入价格"}
      />
      {pricePerSqft && (
        <div className="text-xs text-gray-500 mt-1">
          单价: RM {pricePerSqft} / 平方英尺
        </div>
      )}
      {showDropdown && (
        <ul className="absolute z-10 bg-white border rounded mt-1 max-h-48 overflow-y-auto w-full">
          {predefinedPrices.map((price) => (
            <li
              key={price}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSelectPrice(price)}
            >
              {formatNumber(price)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
