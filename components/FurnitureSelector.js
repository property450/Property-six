// components/FurnitureSelector.js
import { useState } from "react";
import { X } from "lucide-react";

export default function FurnitureSelector({ value = [], onChange }) {
  const [inputValue, setInputValue] = useState("");
  const [quantity, setQuantity] = useState(1);

  const predefinedOptions = [
    "桌子",
    "椅子",
    "冰箱",
    "洗衣机",
    "风扇",
    "床",
    "衣柜",
    "抽油烟机",
    "烘干机",
    "沙发",
    "烤炉",
    "冷气",
    "电视柜",
    "电视机",
    "橱柜",
    "电磁炉",
    "煤气炉",
  ];

  const addFurniture = (name) => {
    if (!name) return;
    const exists = value.find((item) => item.name === name);
    if (exists) {
      onChange(
        value.map((item) =>
          item.name === name
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      );
    } else {
      onChange([...value, { name, quantity }]);
    }
    setInputValue("");
    setQuantity(1);
  };

  const removeFurniture = (name) => {
    onChange(value.filter((item) => item.name !== name));
  };

  return (
    <div className="space-y-2">
      <label className="block font-medium">家私</label>

      {/* 已选择的家具 */}
      <div className="flex flex-wrap gap-2">
        {value.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center bg-gray-100 px-3 py-1 rounded-full text-sm"
          >
            {item.name} × {item.quantity}
            <button
              type="button"
              onClick={() => removeFurniture(item.name)}
              className="ml-2 text-red-500"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* 下拉选择 */}
      <select
        value=""
        onChange={(e) => addFurniture(e.target.value)}
        className="w-full border rounded px-2 py-1"
      >
        <option value="">选择家私...</option>
        {predefinedOptions.map((opt, idx) => (
          <option key={idx} value={opt}>
            {opt}
          </option>
        ))}
      </select>

      {/* 手动输入 + 数量 */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="输入家私名称"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="flex-1 border rounded px-2 py-1"
        />
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="w-20 border rounded px-2 py-1"
        />
        <button
          type="button"
          onClick={() => addFurniture(inputValue)}
          className="bg-blue-600 text-white px-3 rounded"
        >
          添加
        </button>
      </div>
    </div>
  );
}
