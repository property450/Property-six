"use client";
import { useState, useEffect, useRef } from "react";

export default function PriceInput({ value, onChange, type, layouts = [] }) {
  const [inputValue, setInputValue] = useState(value || "");
  const [pricePerSqftText, setPricePerSqftText] = useState("");
  const wrapperRef = useRef(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const predefinedPrices = [
    50000, 100000, 200000, 300000, 500000,
    800000, 1000000, 1500000, 2000000,
    3000000, 5000000, 10000000
  ];

  // ✅ 将各种单位转换为平方英尺
  const convertToSqftLocal = (val, unit) => {
    const num = Number(val) || 0;
    switch (unit) {
      case "square meter":
        return num * 10.7639;
      case "acres":
        return num * 43560;
      case "hectares":
        return num * 107639;
      default:
        return num;
    }
  };

  // ✅ 输入框变化（带千分位格式）
  const handleChange = (e) => {
    const raw = e.target.value.replace(/,/g, "");
    if (!isNaN(raw)) {
      const formatted = Number(raw).toLocaleString();
      setInputValue(formatted);
      onChange(formatted);
    } else {
      setInputValue(e.target.value);
      onChange(e.target.value);
    }
  };

  // ✅ 点击预设价格
  const handleSelectPrice = (price) => {
    const formatted = price.toLocaleString();
    setInputValue(formatted);
    onChange(formatted);
    setShowDropdown(false);
  };

  // ✅ 处理点击外部关闭预设下拉
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ 当 New Project / Completed Unit 时，计算价格范围 + 面积
  useEffect(() => {
    if (
      (type === "New Project / Under Construction" ||
        type === "Completed Unit / Developer Unit") &&
      Array.isArray(layouts) &&
      layouts.length > 0
    ) {
      let totalArea = 0;
      let totalMin = 0;
      let totalMax = 0;

      layouts.forEach((l) => {
        const buildUpSqft = convertToSqftLocal(l.buildUp, l.buildUpUnit || "square feet");
        const landSqft = convertToSqftLocal(l.land, l.landUnit || "square feet");
        const minP = Number(String(l.minPrice || "").replace(/,/g, "")) || 0;
        const maxP = Number(String(l.maxPrice || "").replace(/,/g, "")) || 0;

        totalArea += buildUpSqft + landSqft;
        totalMin += minP;
        totalMax += maxP;
      });

      if (totalArea > 0 && (totalMin > 0 || totalMax > 0)) {
        const minPsf = totalMin / totalArea;
        const maxPsf = totalMax / totalArea;
        setPricePerSqftText(
          `每平方英尺: RM ${minPsf.toLocaleString(undefined, { maximumFractionDigits: 2 })} ~ RM ${maxPsf.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
        );
      } else {
        setPricePerSqftText("");
      }
    } else {
      // ✅ 普通 Subsale 模式，根据单价和面积显示
      setPricePerSqftText("");
    }
  }, [layouts, type]);

  return (
    <div className="space-y-1" ref={wrapperRef}>
      <label className="block text-sm font-medium text-gray-700">价格</label>
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleChange}
          onFocus={() => setShowDropdown(true)}
          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="请输入价格"
        />
        {showDropdown && (
          <div className="absolute z-10 mt-1 w-full rounded-lg border bg-white shadow-lg max-h-40 overflow-y-auto">
            {predefinedPrices.map((p) => (
              <div
                key={p}
                onClick={() => handleSelectPrice(p)}
                className="cursor-pointer px-3 py-2 hover:bg-gray-100"
              >
                {p.toLocaleString()}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ✅ 每平方英尺价格显示 */}
      {pricePerSqftText && (
        <p className="text-sm text-green-600">{pricePerSqftText}</p>
      )}
    </div>
  );
}
