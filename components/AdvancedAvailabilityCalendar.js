// AdvancedAvailabilityCalendar.js
import { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

// 格式化日期 yyyy-mm-dd
const formatDate = (date) => {
  if (!date) return "";
  return date.toISOString().split("T")[0];
};

// 千分位格式化
const formatPrice = (num) =>
  num || num === 0
    ? String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    : "";

export default function AdvancedAvailabilityCalendar() {
  const [selectedDay, setSelectedDay] = useState(null);
  const [price, setPrice] = useState("");
  const [priceMap, setPriceMap] = useState({}); // { "2025-08-29": 100 }

  // 保存价格
  const applySettings = () => {
    if (!selectedDay) return;
    const key = formatDate(selectedDay);
    setPriceMap((prev) => ({
      ...prev,
      [key]: price !== "" ? parseInt(String(price).replace(/,/g, ""), 10) : null,
    }));
  };

  return (
    <div className="p-4 flex flex-col gap-4">
      <DayPicker
        mode="single"
        selected={selectedDay}
        onDayClick={(day) => {
          // ⚡ 确保每次都是新对象
          const picked = new Date(day);
          setSelectedDay(picked);

          const key = formatDate(picked);
          setPrice(priceMap[key] ? priceMap[key].toString() : "");
        }}
        components={{
          DayContent: (props) => {
            const { date } = props;
            const key = formatDate(date);
            const priceNum = priceMap[key];
            return (
              <div className="flex flex-col items-center justify-center w-full h-full">
                <span className="text-sm font-medium">{date.getDate()}</span>
                {priceNum != null && (
                  <span className="text-[10px] text-gray-600">
                    MYR {formatPrice(priceNum)}
                  </span>
                )}
              </div>
            );
          },
        }}
      />

      {/* 编辑区 */}
      {selectedDay && (
        <div className="flex flex-col gap-2 border p-3 rounded">
          <div>
            选择的日期: <b>{formatDate(selectedDay)}</b>
          </div>
          <input
            type="text"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="输入价格 (如 100)"
            className="border rounded p-1"
          />
          <button
            onClick={applySettings}
            className="bg-blue-500 text-white px-3 py-1 rounded"
          >
            保存价格
          </button>
        </div>
      )}
    </div>
  );
}
