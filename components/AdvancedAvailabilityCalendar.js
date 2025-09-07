// components/AdvancedAvailabilityCalendar.js
import { useState, useMemo } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

// ✅ 格式化日期 (yyyy-mm-dd)
const formatDate = (date) => {
  if (!date || !(date instanceof Date)) return "";
  return date.toISOString().split("T")[0];
};

// ✅ 千分位价格格式化
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

  // ✅ 转成映射表
  const priceMap = useMemo(() => {
    const map = {};
    if (value && typeof value === "object") {
      Object.keys(value).forEach((key) => (map[key] = value[key]));
    }
    return map;
  }, [value]);

  // ✅ 日期选择（替代 onDayClick，不会卡）
  const handleSelect = (date) => {
    if (!date) return;
    const key = formatDate(date);
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

  // ✅ 保存
  const applySettings = () => {
    if (!selectedKey) return;
    const updated = {
      ...value,
      [selectedKey]: {
        price:
          price !== "" ? parseInt(String(price).replace(/,/g, ""), 10) : null,
        status,
        checkIn,
        checkOut,
      },
    };
    onChange?.(updated);
  };

  // ✅ 自定义日历单元格
  const DayCell = ({ date }) => {
    if (!date) return null;
    const key = formatDate(date);
    const info = priceMap[key];
    const priceNum = info?.price != null ? Number(info.price) : null;

    return (
      <div
        className={`flex flex-col items-center justify-center w-full h-full ${
          key === selectedKey ? "bg-blue-200 rounded-full" : ""
        }`}
      >
        <span className="text-sm font-medium select-none">
          {date.getDate()}
        </span>
        {priceNum !== null && !isNaN(priceNum) && (
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
        onSelect={handleSelect} // ✅ 用 onSelect，不再用 onDayClick
        selected={selectedKey ? new Date(selectedKey) : undefined}
        components={{ DayContent: DayCell }}
      />

      {selectedKey && (
        <div className="flex flex-col gap-3 border p-3 rounded-lg shadow-sm">
          <div>选择日期: {selectedKey}</div>

          {/* ✅ 价格输入 */}
          <input
            type="text"
            value={price}
            onChange={(e) => {
              const raw = e.target.value.replace(/,/g, "");
              if (/^\d*$/.test(raw)) {
                setPrice(formatPrice(raw));
              }
            }}
            placeholder="输入价格 (如 100)"
            className="border rounded p-1 w-full"
          />

          {/* ✅ 状态选择 */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded p-1 w-full"
          >
            <option value="available">可预订</option>
            <option value="booked">已预订</option>
            <option value="peak">高峰期</option>
          </select>

          {/* ✅ Check-in / Check-out */}
          <div className="flex gap-2">
            <label className="flex flex-col w-1/2">
              <span className="text-sm text-gray-600">Check-in 时间</span>
              <input
                type="time"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="border rounded p-1"
              />
            </label>

            <label className="flex flex-col w-1/2">
              <span className="text-sm text-gray-600">Check-out 时间</span>
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
            保存设置
          </button>
        </div>
      )}
    </div>
  );
}
