// components/AdvancedAvailabilityCalendar.js
import { useState, useMemo } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

const formatDate = (date) => {
  if (!date || !(date instanceof Date)) return "";
  return date.toISOString().split("T")[0];
};

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

  const priceMap = useMemo(() => {
    const map = {};
    if (value && typeof value === "object") {
      Object.keys(value).forEach((key) => (map[key] = value[key]));
    }
    return map;
  }, [value]);

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

  // ✅ 关键：用 render 来保留 button 点击区域
  const renderDay = (date) => {
    const key = formatDate(date);
    const info = priceMap[key];
    const priceNum = info?.price != null ? Number(info.price) : null;

    return (
      <div className="flex flex-col items-center w-full">
        <span>{date.getDate()}</span>
        {priceNum !== null && !isNaN(priceNum) && (
          <span className="text-[10px] text-gray-600">
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
        onSelect={handleSelect}
        selected={selectedKey ? new Date(selectedKey) : undefined}
        modifiersClassNames={{
          selected: "bg-blue-200 rounded-full",
        }}
        render={renderDay} // ✅ 保留 button，点击灵敏
      />

      {selectedKey && (
        <div className="flex flex-col gap-3 border p-3 rounded-lg shadow-sm">
          <div>选择日期: {selectedKey}</div>

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

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded p-1 w-full"
          >
            <option value="available">可预订</option>
            <option value="booked">已预订</option>
            <option value="peak">高峰期</option>
          </select>

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
