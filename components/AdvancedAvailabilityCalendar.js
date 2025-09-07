// components/AdvancedAvailabilityCalendar.js
import React, { useState, useCallback } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

// ✅ 单元格组件（用 memo 缓存，避免卡顿）
const DayCell = React.memo(function DayCell({ date, prices }) {
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
});

export default function AdvancedAvailabilityCalendar() {
  const [selectedDay, setSelectedDay] = useState(null);
  const [prices, setPrices] = useState({});
  const [tempPrice, setTempPrice] = useState("");

  // ✅ 点击日期（不卡）
  const handleDayClick = useCallback((day) => {
    const key = day.toDateString();
    setSelectedDay(day);
    setTempPrice(prices[key]?.replace("MYR ", "") || "");
  }, [prices]);

  // ✅ 保存价格
  const handleSave = useCallback(() => {
    if (selectedDay) {
      const key = selectedDay.toDateString();
      setPrices((prev) => ({
        ...prev,
        [key]: tempPrice ? `MYR ${tempPrice}` : undefined,
      }));
      setSelectedDay(null);
      setTempPrice("");
    }
  }, [selectedDay, tempPrice]);

  // ✅ DayContent 只依赖 prices，不会每次点击都重建
  const DayContent = useCallback(
    (props) => <DayCell {...props} prices={prices} />,
    [prices]
  );

  return (
    <div className="space-y-4">
      <DayPicker
        mode="single"
        selected={selectedDay}
        onDayClick={handleDayClick}
        components={{ DayContent }}
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
