import { useState, useRef, useEffect } from "react";

export default function PriceInput({ value, onChange, area }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  const predefinedPrices = [
    50000, 100000, 200000, 300000, 500000,
    800000, 1000000, 1500000, 2000000,
    3000000, 5000000, 10000000, 20000000,
    50000000, 100000000,
  ];

  const handleInputChange = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    onChange(raw);
  };

  const handleSelect = (price) => {
    onChange(price.toString());
    setShowDropdown(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ✅ 自动计算每平方英尺价格
  let perSqftText = null;
  const priceNum = parseFloat(value);
  const areaNum = parseFloat(area);
  
  if (priceNum > 0 && areaNum > 0) {
    const perSqft = priceNum / areaNum;
    perSqftText = perSqft.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <label className="block text-sm font-medium text-gray-700">价格</label>

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
          RM
        </span>
        <input
          type="text"
          value={value.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
          onChange={handleInputChange}
          onFocus={() => setShowDropdown(true)}
          className="pl-12 pr-4 py-2 border rounded w-full"
          placeholder="请输入价格"
        />
      </div>

      {/* ✅ 自动显示 per sqft 提示 */}
      {perSqftText && (
        <p className="text-sm text-gray-500 mt-1">
          每平方英尺: RM {perSqftText}
        </p>
      )}

      {showDropdown && (
        <ul className="absolute z-10 w-full bg-white border mt-1 max-h-60 overflow-y-auto rounded shadow">
          {predefinedPrices.map((price) => (
            <li
              key={price}
              onClick={() => handleSelect(price)}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            >
              RM {price.toLocaleString()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
