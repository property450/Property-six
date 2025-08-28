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

  // 自定义渲染单元格
  const renderDay = (day) => {
    if (!(day instanceof Date)) return <div />;

    const key = formatDate(day);
    const info = value[key];

    if (!info) {
      return (
        <div className="h-16 w-16 flex items-center justify-center">
          {day.getDate()}
        </div>
      );
    }

    const colors = {
      available: "bg-green-200",
      booked: "bg-red-300",
      peak: "bg-yellow-300",
    };

    return (
      <div
        className={`h-16 w-16 flex flex-col items-center justify-center rounded ${colors[info.status] || ""}`}
      >
        <span>{day.getDate()}</span>
        <span className="text-xs">RM {info.price}</span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <label className="block font-medium">房源日历管理</label>

      <DayPicker
        mode="range"
        selected={selectedRange}
        onSelect={handleSelect}
        showOutsideDays
        components={{
          Day: ({ date }) => renderDay(date),
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
    </div>
  );
}
