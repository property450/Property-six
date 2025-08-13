// components/RoomCountSelector.js
import { useState, useEffect } from "react";

export default function RoomCountSelector({ label, value, onChange }) {
  const options = [0, 1, 2, 3, 4, 5, 6];
  const [inputValue, setInputValue] = useState("");

  // 格式化为带千分位
  const formatNumber = (num) => {
    if (!num) return "";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // 初始化
  useEffect(() => {
    if (value !== undefined && value !== null && value !== "") {
      setInputValue(formatNumber(value));
    }
  }, [value]);

  // 处理输入
  const handleInputChange = (e) => {
    let raw = e.target.value.replace(/,/g, ""); // 去掉逗号
    // 只允许数字
    raw = raw.replace(/\D/g, "");
    // 限制 6 位
    if (raw.length > 6) raw = raw.slice(0, 6);
    setInputValue(formatNumber(raw));
    onChange(raw); // 传纯数字
  };

  // 处理下拉选择
  const handleSelectChange = (e) => {
    const selectedValue = e.target.value;
    setInputValue(formatNumber(selectedValue));
    onChange(selectedValue);
  };

  return (
    <div className="space-y-2">
      <label>{label}</label>
      <div className="flex gap-2">
        {/* 下拉选择 */}
        <select
          value={value}
          onChange={handleSelectChange}
          className="border p-2 rounded w-28"
        >
          <option value="">选择数量</option>
          {options.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>

        {/* 输入框（可以直接修改数量） */}
        <input
          type="text"
          placeholder="请输入数量"
          value={inputValue}
          onChange={handleInputChange}
          className="border p-2 rounded flex-1"
        />
      </div>
    </div>
  );
}
