// components/RoomCountSelector.js
import { useState } from "react";

export default function QuantitySelector() {
  const options = [
    { label: "1", value: "1" },
    { label: "2", value: "2" },
    { label: "3", value: "3" },
    { label: "4+", value: "4+" },
    { label: "自定义", value: "custom" }
  ];

  const [isOpen, setIsOpen] = useState(false);
  const [selectedValues, setSelectedValues] = useState([]);
  const [customValue, setCustomValue] = useState("");

  const toggleOption = (value) => {
    if (value === "custom") {
      if (!selectedValues.includes("custom")) {
        setSelectedValues([...selectedValues, "custom"]);
      }
    } else {
      if (selectedValues.includes(value)) {
        setSelectedValues(selectedValues.filter((v) => v !== value));
      } else {
        setSelectedValues([...selectedValues, value]);
      }
    }
  };

  return (
    <div className="relative w-64">
      {/* 框架 */}
      <div
        className="border p-2 rounded cursor-pointer bg-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedValues.length > 0
          ? selectedValues
              .map((v) => (v === "custom" ? (customValue || "自定义") : v))
              .join(", ")
          : "选择数量"}
      </div>

      {/* 下拉选择 */}
      {isOpen && (
        <div className="absolute z-10 mt-1 border rounded bg-white shadow-lg w-full p-2">
          {options.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center space-x-2 p-1 cursor-pointer hover:bg-gray-100"
            >
              <input
                type="checkbox"
                checked={selectedValues.includes(opt.value)}
                onChange={() => toggleOption(opt.value)}
              />
              <span>{opt.label}</span>
            </label>
          ))}

          {/* 自定义输入框 */}
          {selectedValues.includes("custom") && (
            <input
              type="number"
              className="mt-2 border p-1 rounded w-full"
              placeholder="请输入你要的数量"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
            />
          )}
        </div>
      )}
    </div>
  );
}
