// AdvancedAvailabilityCalendar.js
import { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

// 工具函数：格式化日期 yyyy-mm-dd
const formatDate = (date) => {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// 千分位格式化
const formatPrice = (num) =>
  num || num === 0
    ? String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    : "";

export default function AdvancedAvailabilityCalendar({ value = {}, onChange }) {
  const [selectedDay, setSelectedDay] = useState(null);
  const [price, setPrice] = useState("");
  const [priceMap, setPriceMap] = useState(value || {});

  // 选择某一天
  const handleSelect = (day) => {
    setSelectedDay(day);
    const key = formatDate(day);
    if (priceMap[key]) {
      setPrice(formatPrice(priceMap[key].price));
    } else {
      setPrice("");
    }
  };

  // 保存设置
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
        components={{
          DayContent: ({ date }) => {
            const key = formatDate(date);
            const info = priceMap[key];
            const priceNum = info?.price != null ? Number(info.price) : null;

            return (
              <div className="flex flex-col items-center w-full">
                <span className="text-sm">{date.getDate()}</span>
                {priceNum !== null && !isNaN(priceNum) && (
                  <span className="text-[10px] text-gray-700">
                    MYR {formatPrice(priceNum)}
                  </span>
                )}
              </div>
            );
          },
        }}
      />

      {/* 表单区 */}
      {selectedDay && (
        <div className="flex flex-col gap-2 border p-3 rounded-lg shadow-sm">
          <div>
            日期: {formatDate(selectedDay)}
          </div>

          <div>
            <input
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="输入价格 (如 100)"
              className="border rounded p-1 w-full"
            />
          </div>

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
