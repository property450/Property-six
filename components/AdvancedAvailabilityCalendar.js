// AdvancedAvailabilityCalendar.js
import { useState, useMemo } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

// 日期格式化函数 (yyyy-mm-dd)
const formatDate = (date) => {
  if (!date || !(date instanceof Date)) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// 千分位格式化
const formatPrice = (num) =>
  num || num === 0
    ? String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    : "";

export default function AdvancedAvailabilityCalendar({ value = {}, onChange }) {
  const [selectedKey, setSelectedKey] = useState(null);
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("available");
  const [checkIn, setCheckIn] = useState("14:00");
  const [checkOut, setCheckOut] = useState("12:00");

  // 把外部 value 转成价格映射表
  const { priceMap } = useMemo(() => {
    const map = {};
    if (value && typeof value === "object") {
      Object.keys(value).forEach((key) => {
        map[key] = value[key];
      });
    }
    return { priceMap: map };
  }, [value]);

  // 点击日期
  const handleDayClick = (day) => {
    const key = formatDate(day);
    setSelectedKey(key);

    const info = priceMap[key];
    if (info) {
      setPrice(info.price ? info.price.toString() : "");
      setStatus(info.status || "available");
      setCheckIn(info.checkIn || "14:00");
      setCheckOut(info.checkOut || "12:00");
    } else {
      setPrice("");
      setStatus("available");
      setCheckIn("14:00");
      setCheckOut("12:00");
    }
  };

  // 保存设置
  const applySettings = () => {
    if (!selectedKey) return;

    const updated = {
      ...value,
      [selectedKey]: {
        price: price !== "" ? parseInt(String(price).replace(/,/g, ""), 10) : null,
        status,
        checkIn,
        checkOut,
      },
    };

    onChange?.(updated);

    // 清空选中状态（如果你想点完后自动取消选中）
    // setSelectedKey(null);
  };

  // 自定义日历单元格
  const DayCell = ({ date }) => {
    if (!date) return null;
    const key = formatDate(date);
    const info = priceMap[key];
    const priceNum = info?.price != null ? Number(info.price) : null;
    const showPrice = priceNum !== null && !isNaN(priceNum);

    return (
      <div className="flex flex-col items-center justify-center w-full h-full">
        <span className="text-sm font-medium select-none">
          {date.getDate()}
        </span>
        {showPrice && (
          <span className="text-xs text-gray-700 select-none mt-0.5">
            MYR {formatPrice(priceNum)}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <DayPicker
        mode="single"
        onDayClick={handleDayClick}
        modifiers={{
          selected: selectedKey ? [new Date(selectedKey)] : [],
        }}
        modifiersClassNames={{
          selected: "bg-blue-200 rounded-full",
        }}
        components={{
          DayContent: DayCell,
        }}
      />

      {/* 表单区 */}
      {selectedKey && (
        <div className="flex flex-col gap-2 border p-3 rounded-lg shadow-sm">
          <div>选择日期: {selectedKey}</div>

          <div>
            <input
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="输入价格 (如 100)"
              className="border rounded p-1 w-full"
            />
          </div>

          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border rounded p-1 w-full"
            >
              <option value="available">可预订</option>
              <option value="booked">已预订</option>
              <option value="peak">高峰期</option>
            </select>
          </div>

          <div className="flex gap-2">
            <label>
              Check-in 时间
              <input
                type="time"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="border rounded p-1"
              />
            </label>
            <label>
              Check-out 时间
              <input
                type="time"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="border rounded p-1"
              />
            </label>
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
