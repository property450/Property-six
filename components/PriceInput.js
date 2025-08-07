import { useState, useEffect, useRef } from "react";

export default function PriceInput({ value, onChange }) {
  const inputRef = useRef(null);
  const [mode, setMode] = useState("select"); // "select" 或 "custom"
  const [selectedPrice, setSelectedPrice] = useState("");

  const predefinedPrices = [
    50000, 100000, 200000, 300000, 500000,
    800000, 1000000, 1500000, 2000000,
    3000000, 5000000, 10000000, 20000000,
    50000000, 100000000
  ];

  // 千分位格式化
  const formatPrice = (numberStr) => {
    if (!numberStr) return '';
    const cleaned = numberStr.toString().replace(/\D/g, '');
    const formatted = cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return formatted;
  };

  const handleSelectChange = (e) => {
    const val = e.target.value;
    if (val === "custom") {
      setMode("custom");
      setSelectedPrice("custom");
    } else {
      setSelectedPrice(val);
      onChange(val);
      setMode("select");
    }
  };

  const handleInputChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    onChange(raw);
  };

  // 插入 RM 标签（仅对输入框）
  useEffect(() => {
    if (!inputRef.current || mode !== "custom") return;

    const input = inputRef.current;
    if (input.parentNode.querySelector(".rm-span")) return;

    const rmSpan = document.createElement("span");
    rmSpan.textContent = "RM ";
    rmSpan.className = "rm-span";
    rmSpan.style.position = "absolute";
    rmSpan.style.left = "0.75rem";
    rmSpan.style.top = "50%";
    rmSpan.style.transform = "translateY(-50%)";
    rmSpan.style.pointerEvents = "none";
    rmSpan.style.color = "#6B7280";
    rmSpan.style.fontSize = "0.875rem";
    input.parentNode.style.position = "relative";
    input.parentNode.appendChild(rmSpan);
  }, [mode]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">价格</label>

      {mode === "select" && (
        <select
          value={selectedPrice}
          onChange={handleSelectChange}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="">请选择价格</option>
          {predefinedPrices.map((price) => (
            <option key={price} value={price}>{`RM ${price.toLocaleString()}`}</option>
          ))}
          <option value="custom">自定义（手动输入）</option>
        </select>
      )}

      {mode === "custom" && (
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={formatPrice(value)}
            onChange={handleInputChange}
            className="pl-14 pr-4 py-2 border rounded w-full"
            placeholder="请输入价格"
          />
        </div>
      )}
    </div>
  );
}
