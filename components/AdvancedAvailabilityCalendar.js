// components/AdvancedAvailabilityCalendar.js
import { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

export default function AdvancedAvailabilityCalendar({ value = {}, onChange }) {
  const [selectedRange, setSelectedRange] = useState(null);
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("available");

  // 格式化日期
  const formatDate = (date) => {
    if (!date || !(date instanceof Date)) return "";
    return date.toISOString().split("T")[0];
  };

  // 区间选择逻辑
  const handleSelect = (range) => {
    setSelectedRange(range);
  };

  // 批量设置价格和状态
  const applySettings = () => {
    if (!selectedRange?.from || !selectedRange?.to) return;
    let updated = { ...value };
    let day = new Date(selectedRange.from);

    while (day <= selectedRange.to) {
      const key = formatDate(day);
      updated[key] = { price: Number(price), status };
      day.setDate(day.getDate() + 1);
    }

    onChange(updated); // 通知父组件
    setSelectedRange(null);
    setPrice("");
    setStatus("available");
  };

  // 🔑 转换 availability 数据到 modifiers
  const availableDays = Object.keys(value)
    .filter((d) => value[d]?.status === "available")
    .map((d) => new Date(d));

  const bookedDays = Object.keys(value)
    .filter((d) => value[d]?.status === "booked")
    .map((d) => new Date(d));

  const peakDays = Object.keys(value)
    .filter((d) => value[d]?.status === "peak")
    .map((d) => new Date(d));

  return (
    <div className="space-y-4">
      <label className="block font-medium">房源日历管理</label>

      <DayPicker
        mode="range"
        selected={selectedRange}
        onSelect={handleSelect}
        showOutsideDays
        modifiers={{
          available: availableDays,
          booked: bookedDays,
          peak: peakDays,
        }}
        modifiersStyles={{
          available: { backgroundColor: "#bbf7d0" }, // 绿色
          booked: { backgroundColor: "#fca5a5" },    // 红色
          peak: { backgroundColor: "#fde047" },      // 黄色
        }}
      />

      {selectedRange && (
        <div className="space-y-2 border p-3 rounded bg-gray-50">
          <p>
            设置区间:{" "}
            {formatDate(selectedRange.from)} → {formatDate(selectedRange.to)}
          </p>
          <input
            type="number"
            placeholder="价格 (RM)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="border p-2 w-full rounded"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border p-2 w-full rounded"
          >
            <option value="available">可预订</option>
            <option value="booked">已订满</option>
            <option value="peak">高峰期</option>
          </select>
          <button
            onClick={applySettings}
            className="bg-blue-600 text-white px-4 py-2 rounded w-full"
          >
            确认应用到区间
          </button>
        </div>
      )}

      {/* ✅ 价格展示 */}
      <div className="grid grid-cols-7 gap-2 text-xs">
        {Object.keys(value).map((d) => (
          <div key={d} className="p-1 border rounded">
            {d}: RM {value[d].price} ({value[d].status})
          </div>
        ))}
      </div>
    </div>
  );
}
