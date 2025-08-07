import { useState } from "react";

export default function PriceInput({ value, onChange }) {
  const [mode, setMode] = useState("select");
  const [selectedPrice, setSelectedPrice] = useState("");

  const predefinedPrices = [
    50000, 100000, 200000, 300000, 500000,
    800000, 1000000, 1500000, 2000000,
    3000000, 5000000, 10000000, 20000000,
    50000000, 100000000,
  ];

  const formatPrice = (numberStr) => {
    if (!numberStr) return '';
    const cleaned = numberStr.toString().replace(/\D/g, '');
    return `RM ${cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
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
    const raw = e.target.value.replace(/[^\d]/g, '');
    onChange(raw);
  };

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
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">RM</span>
    <input
      type="text"
      value={value.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
      onChange={handleInputChange}
      className="pl-12 pr-4 py-2 border rounded w-full"
      placeholder="请输入价格"
    />
  </div>
)}

