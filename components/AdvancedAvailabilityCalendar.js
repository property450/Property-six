// components/AdvancedAvailabilityCalendar.js
import { useState, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

export default function AdvancedAvailabilityCalendar({ prices = {}, onPriceChange }) {
  const [selectedDay, setSelectedDay] = useState(null);

  // ✅ 渲染日期 + 价格
  const renderDay = (day) => {
    const dateStr = day.toISOString().split("T")[0]; // YYYY-MM-DD
    const price = prices[dateStr];

    return (
      <div className="flex flex-col items-center justify-center">
        {/* 日期数字 */}
        <span className="text-base">{day.getDate()}</span>
        {/* 价格数字（比日期小一号） */}
        {price && <span className="text-[10px] text-gray-600">RM {price}</span>}
      </div>
    );
  };

  return (
    <div className="p-4">
      <DayPicker
        mode="single"
        selected={selectedDay}
        onSelect={setSelectedDay}
        showOutsideDays
        modifiersClassNames={{
          selected: "bg-blue-500 text-white rounded-full",
        }}
        className="text-lg" // ✅ 整个日历字体整体放大
        components={{ DayContent: ({ date }) => renderDay(date) }}
      />
    </div>
  );
}
