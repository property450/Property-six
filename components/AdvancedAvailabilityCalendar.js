// AdvancedAvailabilityCalendar.js
import { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

const formatDate = (date) => {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const formatPrice = (num) =>
  num || num === 0
    ? String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    : "";

export default function AdvancedAvailabilityCalendar({ value = {}, onChange }) {
  const [selectedDay, setSelectedDay] = useState(null);
  const [price, setPrice] = useState("");
  const [priceMap, setPriceMap] = useState(value || {});

  const handleSelect = (day) => {
    if (!day) return;
    setSelectedDay(day);
    const key = formatDate(day);
    setPrice(priceMap[key]?.price ? String(priceMap[key].price) : "");
  };

  const applySettings = () => {
    if (!selectedDay) return;
    const key = formatDate(selectedDay);
    const newMap = {
      ...priceMap,
      [key]: {
        price: price !== "" ? parseInt(price.replace(/,/g, ""), 10) : null,
      },
    };
    setPriceMap(newMap);
    onChange && onChange(newMap);
    setSelectedDay(null);
    setPrice("");
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <DayPicker
        mode="single"
        selected={selectedDay}
        onSelect={handleSelect}
        modifiersClassNames={{
          selected: "bg-blue-500 text-white", // 点击时高亮
        }}
        components={{
          // 👇 注意：用 span，React-Day-Picker 会自动包裹在 button 里，不会挡掉点击
          DayContent: ({ date }) => {
            const key = formatDate(date);
            const info = priceMap[key];
            return (
              <span className="flex flex-col items-center w-full">
                <span>{date.getDate()}</span>
                {info?.price != null && (
                  <span className="text-[10px] text-gray-700">
                    MYR {formatPrice(info.price)}
                  </span>
                )}
              </span>
            );
          },
        }}
      />

      {/* 编辑框 */}
      {selectedDay && (
        <div className="flex flex-col gap-2 border p-3 rounded-lg shadow-sm">
          <div>日期: {formatDate(selectedDay)}</div>
          <input
            type="text"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="输入价格 (如 100)"
            className="border rounded p-1 w-full"
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
