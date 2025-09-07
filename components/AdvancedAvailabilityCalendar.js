// components/AdvancedAvailabilityCalendar.js
import React, { useState, useCallback } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

// ✅ 单元格组件（日期左上角，价格右下角）
const DayCell = React.memo(function DayCell({ date, prices }) {
  const key = date.toDateString();
  const price = prices[key];
  return (
    <div className="relative w-full h-full p-1">
      {/* 日期 左上角 */}
      <span className="absolute top-0 left-0 text-sm font-medium">
        {date.getDate()}
      </span>
      {/* 价格 右下角 */}
      {price && (
        <span className="absolute bottom-0 right-0 text-[9px] text-gray-600">
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

  // ✅ 点击日期
  const handleDayClick = useCallback(
    (day) => {
      const key = day.toDateString();
      setSelectedDay(day);
      setTempPrice(prices[key]?.replace("MYR ", "") || "");
    },
    [prices]
  );

  // ✅ 保存价格
  const handleSave = useCallback(() => {
    if (selectedDay) {
      const key = selectedDay.toDateString();
      setPrices((prev) => ({
        ...prev,
        [key]: tempPrice
          ? `MYR ${Number(tempPrice).toLocaleString()}`
          : undefined,
      }));
      setSelectedDay(null);
      setTempPrice("");
    }
  }, [selectedDay, tempPrice]);

  // ✅ DayContent 渲染价格
  const DayContent = useCallback(
    (props) => <DayCell {...props} prices={prices} />,
    [prices]
  );

  return (
    <div className="space-y-4">
      {/* ✅ 日历整体更大 */}
      <div className="scale-125 origin-top">
        <DayPicker
          mode="single"
          selected={selectedDay}
          onDayClick={handleDayClick}
          components={{ DayContent }}
        />
      </div>

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
