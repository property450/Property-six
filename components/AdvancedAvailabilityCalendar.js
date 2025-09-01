import { useState, useMemo } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

// 格式化日期 yyyy-mm-dd
const formatDate = (date) => {
  if (!date || !(date instanceof Date)) return "";
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

  // 价格映射
  const priceMap = useMemo(() => {
    const map = {};
    if (value && typeof value === "object") {
      Object.keys(value).forEach((key) => {
        map[key] = value[key];
      });
    }
    return map;
  }, [value]);

  // 点击日期
  const handleDayClick = (day) => {
    const key = formatDate(day);
    setSelectedDay(day);
    if (priceMap[key]) {
      setPrice(priceMap[key].price?.toString() || "");
    } else {
      setPrice("");
    }
  };

  // 保存设置
  const applySettings = () => {
    if (!selectedDay) return;
    const key = formatDate(selectedDay);
    const updated = {
      ...value,
      [key]: {
        price: price !== "" ? parseInt(price, 10) : null,
      },
    };
    onChange(updated);
    setSelectedDay(null);
    setPrice("");
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <DayPicker
        mode="single"
        selected={selectedDay}
        onDayClick={handleDayClick}
        components={{
          Day: (props) => {
            const { date } = props;
            const key = formatDate(date);
            const info = priceMap[key];
            const showPrice = info?.price != null;

            return (
              <button
                {...props}
                className="rdp-day w-full h-full flex flex-col items-center justify-center"
              >
                <span>{date.getDate()}</span>
                {showPrice && (
                  <span className="text-[10px] text-gray-600">
                    MYR {formatPrice(info.price)}
                  </span>
                )}
              </button>
            );
          },
        }}
      />

      {selectedDay && (
        <div className="flex flex-col gap-2 border p-3 rounded-lg shadow-sm">
          <div>选择日期: {formatDate(selectedDay)}</div>

          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="输入价格"
            className="border rounded p-1 w-full"
          />

          <button
            onClick={applySettings}
            className="bg-blue-500 text-white px-3 py-1 rounded"
          >
            保存
          </button>
        </div>
      )}
    </div>
  );
}
