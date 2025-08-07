// components/PriceInput.js
import { useEffect, useRef } from "react";

export default function PriceInput({ value, onChange }) {
  const inputRef = useRef(null);

  // 千分位格式化
  const formatPrice = (numberStr) => {
    if (!numberStr) return '';
    const cleaned = numberStr.replace(/\D/g, '');
    const formatted = cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return formatted;
  };

  const handleInputChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    onChange(raw); // 将纯数字传出去
  };

  useEffect(() => {
    const input = inputRef.current;
    const rmSpan = document.createElement("span");
    rmSpan.textContent = "RM ";
    rmSpan.style.position = "absolute";
    rmSpan.style.left = "0.75rem";
    rmSpan.style.top = "50%";
    rmSpan.style.transform = "translateY(-50%)";
    rmSpan.style.pointerEvents = "none";
    rmSpan.style.color = "#6B7280";
    rmSpan.style.fontSize = "0.875rem";
    input.parentNode.style.position = "relative";
    input.parentNode.appendChild(rmSpan);
  }, []);

  return (
    <input
      ref={inputRef}
      type="text"
      value={formatPrice(value)}
      onChange={handleInputChange}
      className="pl-14 pr-4 py-2 border rounded w-full"
      placeholder="输入价格"
    />
  );
}
