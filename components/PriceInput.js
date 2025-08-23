// components/PriceInput.js
import { useState, useRef, useEffect } from "react";

function PriceDropdownInput({ value, onChange, placeholder }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  const predefinedPrices = [
    50000, 100000, 200000, 300000, 500000,
    800000, 1000000, 1500000, 2000000,
    3000000, 5000000, 10000000
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatNumber = (num) => {
    if (num === null || num === undefined || num === "") return "";
    const n = typeof num === "number" ? num : Number(String(num).replace(/,/g, ""));
    if (isNaN(n)) return "";
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const parseNumber = (val) => {
    if (val === null || val === undefined) return "";
    const s = String(val).replace(/,/g, "").replace(/[^\d.-]/g, "");
    return s === "" ? "" : s;
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        value={formatNumber(value)}
        onChange={(e) => {
          const raw = parseNumber(e.target.value);
          onChange(raw === "" ? "" : Number(raw));
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

export default function PriceInput({ mode = "single", price, setPrice }) {
  // mode: "single" 或 "range"
  const isRange = mode === "range";

  // helpers to update price state kept in parent (upload-property)
  const setSinglePrice = (val) => {
    // val is number or "" — keep parent consistent
    setPrice(val === "" ? "" : Number(val));
  };

  const setMin = (val) => {
    const newVal = val === "" ? "" : Number(val);
    setPrice(prev => {
      const base = (prev && typeof prev === "object") ? prev : {};
      return { ...base, min: newVal };
    });
  };

  const setMax = (val) => {
    const newVal = val === "" ? "" : Number(val);
    setPrice(prev => {
      const base = (prev && typeof prev === "object") ? prev : {};
      return { ...base, max: newVal };
    });
  };

  if (isRange) {
    const currentMin = (price && typeof price === "object") ? price.min : "";
    const currentMax = (price && typeof price === "object") ? price.max : "";
    return (
      <div className="grid grid-cols-2 gap-2">
        <PriceDropdownInput value={currentMin} onChange={setMin} placeholder="Min Price" />
        <PriceDropdownInput value={currentMax} onChange={setMax} placeholder="Max Price" />
      </div>
    );
  }

  // single price
  const currentPrice = (price && typeof price === "object") ? (price.min || "") : (price || "");
  return (
    <PriceDropdownInput value={currentPrice} onChange={setSinglePrice} placeholder="Price" />
  );
}
