import { useState, useRef, useEffect } from "react";

function PriceDropdownInput({ value, onChange, placeholder }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  const predefinedPrices = [
    50000, 100000, 200000, 300000, 500000,
    800000, 1000000, 1500000, 2000000,
    3000000, 5000000, 10000000
  ];

  // 点击外部时关闭下拉
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 格式化千分位
  const formatNumber = (num) => {
    if (!num) return "";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const parseNumber = (val) => {
    if (!val) return "";
    return val.toString().replace(/,/g, "");
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        value={value ? formatNumber(value) : ""}
        onChange={(e) => {
          const raw = parseNumber(e.target.value);
          onChange(raw ? Number(raw) : "");
        }}
        onFocus={() => setShowDropdown(true)}
        placeholder={placeholder}
        className="border p-2 rounded w-full"
      />
      {showDropdown && (
        <ul className="absolute z-10 bg-white border rounded w-full max-h-40 overflow-y-auto">
          {predefinedPrices.map((price) => (
            <li
              key={price}
              onClick={() => {
                onChange(price);
                setShowDropdown(false);
              }}
              className="p-2 hover:bg-gray-200 cursor-pointer"
            >
              {formatNumber(price)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function PriceInput({ status, price, setPrice, minPrice, setMinPrice, maxPrice, setMaxPrice }) {
  const projectStatuses = ["New Project", "Under Construction", "Completed Unit", "Developer Unit"];

  // 如果是项目类，显示 Min/Max
  if (projectStatuses.includes(status)) {
    return (
      <div className="grid grid-cols-2 gap-2">
        <PriceDropdownInput
          value={minPrice}
          onChange={setMinPrice}
          placeholder="Min Price"
        />
        <PriceDropdownInput
          value={maxPrice}
          onChange={setMaxPrice}
          placeholder="Max Price"
        />
      </div>
    );
  }

  // 否则单价输入
  return (
    <PriceDropdownInput
      value={price}
      onChange={setPrice}
      placeholder="Price"
    />
  );
}
