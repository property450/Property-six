import { useState } from "react";

export default function PriceInput({ value, onChange }) {
  const [selectedPrice, setSelectedPrice] = useState("");

  const predefinedPrices = [
    50000, 100000, 200000, 300000, 500000,
    800000, 1000000, 1500000, 2000000,
    3000000, 5000000, 10000000, 20000000,
    50000000, 100000000,
  ];

  const handleSelectChange = (e) => {
    const val = e.target.value;
    setSelectedPrice(val);
    if (val !== "custom") {
      onChange(val);
    }
    // 如果是 "custom"，不变更 value，由输入框决定
  };

  const handleInputChange = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    onChange(raw);
  };

  return (
    <div className="space-y-2">
      {/* 始终显示下拉框 */}
      <select
        value={selectedPrice}
        onChange={handleSelectChange}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
      >
        <option value="">请选择价格</option>
        {predefinedPrices.map((price) => (
          <option key={price} value={price}>
            {`RM ${price.toLocaleString()}`}
          </option>
        ))}
        <option value="custom">自定义（手动输入）</option>
      </select>

      {/* 当选择了“自定义”时，显示输入框 */}
      {selectedPrice === "custom" && (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">RM</span>
          <input
            type="text"
            value={value.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            onChange={handleInputChange}
            className="pl-12 pr-4 py-2 border rounded w-full"
            placeholder="请输入价格"
          />
        </div>
      )}
    </div>
  );
}
