// components/AdvancedAvailabilityCalendar.js
import React, { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

export default function AdvancedAvailabilityCalendar() {
  const [selectedDay, setSelectedDay] = useState(null);
  const [prices, setPrices] = useState({});
  const [tempPrice, setTempPrice] = useState("");

  // 点击日期
  const handleDayClick = (day) => {
    const key = day.toDateString();
    setSelectedDay(day);
    setTempPrice(prices[key]?.replace("MYR ", "") || "");
  };

  // 保存价格
  const handleSave = () => {
    if (selectedDay) {
      const key = selectedDay.toDateString();
      setPrices((prev) => ({
        ...prev,
        [key]: tempPrice ? `MYR ${tempPrice}` : undefined,
      }));
      setSelectedDay(null);
      setTempPrice("");
    }
  };

  // ✅ 自定义单元格内容
  const DayContent = ({ date }) => {
    const key = date.toDateString();
    const price = prices[key];
    return (
      <div className="flex flex-col items-center w-full">
        <span>{date.getDate()}</span>
        {price && (
          <span className="text-[11px] text-green-600 font-medium">
            {price}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <DayPicker
        mode="single"
        selected={selectedDay}
        onDayClick={handleDayClick}
        components={{
          DayContent, // ✅ 关键：替换掉 renderDay
        }}
      />

      {selectedDay && (
        <div className="p-3 border rounded bg-gray-50 space-y-2">
          <p>
            你选择的是：{" "}
            <strong>{selectedDay.toLocaleDateString()}</strong>
          </p>
          <input
            type="number"
            value={tempPrice}
            placeholder="输入价格"
            onChange={(e) => setTempPrice(e.target.value)}
            className="border px-2 py-1 rounded w-full"
          />
          <button
            onClick={handleSave}
            className="bg-blue-500 text-white px-3 py-1 rounded"
          >
            保存价格
          </button>
        </div>
      )}
    </div>
  );
}
