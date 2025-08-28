// components/AdvancedAvailabilityCalendar.js
import { useState, useRef } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

// 本地日期格式化，避免时区错位
const formatDate = (date) => {
  if (!date || !(date instanceof Date)) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${day}-${month}-${year}`; // ✅ 改成 dd-mm-yyyy
};

// 千分位格式化
const formatPrice = (num) =>
  num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "";

export default function AdvancedAvailabilityCalendar({ value = {}, onChange }) {
  const [selectedRange, setSelectedRange] = useState(null);
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("available");
  const [checkIn, setCheckIn] = useState("14:00");
  const [checkOut, setCheckOut] = useState("12:00");
  const inputRef = useRef(null);

  // 日期选择
  const handleSelect = (range) => {
    setSelectedRange(range);
    if (range?.from && range?.to === range.from) {
      const key = formatDate(range.from);
      const info = value[key];
      if (info) {
        setPrice(formatPrice(info.price || ""));
        setStatus(info.status || "available");
        setCheckIn(info.checkIn || "14:00");
        setCheckOut(info.checkOut || "12:00");
      }
    }
  };

  // 应用设置
  const applySettings = () => {
    if (!selectedRange?.from || !selectedRange?.to) return;
    let updated = { ...value };
    let day = new Date(selectedRange.from);

    while (day <= selectedRange.to) {
      const key = formatDate(day);
      updated[key] = {
        price: parseInt(price.replace(/,/g, "")) || "",
        status,
        checkIn,
        checkOut,
      };
      day.setDate(day.getDate() + 1);
    }

    onChange(updated);
    setSelectedRange(null);
    setPrice("");
    setStatus("available");
    setCheckIn("14:00");
    setCheckOut("12:00");
  };

  // 状态日期高亮
  const modifiers = {
    available: Object.keys(value)
      .filter((d) => value[d]?.status === "available")
      .map((d) => new Date(d)),
    booked: Object.keys(value)
      .filter((d) => value[d]?.status === "booked")
      .map((d) => new Date(d)),
    peak: Object.keys(value)
      .filter((d) => value[d]?.status === "peak")
      .map((d) => new Date(d)),
  };

  // ✅ 下拉价格列表
  const priceOptions = Array.from({ length: 1000 }, (_, i) => (i + 1) * 50); // 50~50,000

  return (
    <div className="space-y-4">
      <label className="block font-medium">房源日历管理</label>

      <DayPicker
        mode="range"
        selected={selectedRange}
        onSelect={handleSelect}
        showOutsideDays
        modifiers={modifiers}
        modifiersStyles={{
          available: { backgroundColor: "#bbf7d0" },
          booked: { backgroundColor: "#fca5a5" },
          peak: { backgroundColor: "#fde047" },
        }}
        components={{
          DayContent: ({ date }) => {
            const key = formatDate(date);
            const info = value[key];
            return (
              <div className="relative h-16 w-16 flex flex-col items-center justify-center">
                <span>{date.getDate()}</span>
                {info?.price && (
                  <span className="absolute bottom-1 right-1 text-[10px] text-gray-700">
                    RM {formatPrice(info.price)}
                  </span>
                )}
              </div>
            );
          },
        }}
      />

      {selectedRange && (
        <div className="space-y-2 border p-3 rounded bg-gray-50">
          {/* ✅ 改成更直观的 Check-in / Check-out 日期显示 */}
          <div className="flex justify-between">
            <p>Check-in 日期: {formatDate(selectedRange.from)}</p>
            <p>Check-out 日期: {formatDate(selectedRange.to)}</p>
          </div>

          {/* ✅ 输入框 + 下拉选择 */}
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-600">
              RM
            </span>
            <input
              ref={inputRef}
              type="text"
              placeholder="价格"
              value={price}
              list="price-options"
              onChange={(e) => {
                const raw = e.target.value.replace(/,/g, "");
                if (/^\d*$/.test(raw)) {
                  setPrice(formatPrice(raw));
                }
              }}
              onClick={() => {
                const input = inputRef.current;
                if (input) {
                  const len = input.value.length;
                  setTimeout(() => {
                    input.setSelectionRange(len, len);
                  }, 0);
                }
              }}
              className="pl-10 border p-2 w-full rounded"
            />
            {/* ✅ 下拉价格建议 */}
            <datalist id="price-options">
              {priceOptions.map((p) => (
                <option key={p} value={formatPrice(p)} />
              ))}
            </datalist>
          </div>

          {/* ✅ 状态选择 */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border p-2 w-full rounded"
          >
            <option value="available">可预订</option>
            <option value="booked">已订满</option>
            <option value="peak">高峰期</option>
          </select>

          {/* ✅ Check-in / Check-out 时间选择 */}
          <div className="flex gap-2">
            <div className="flex flex-col w-1/2">
              <label className="text-sm text-gray-600">
                Check-in 时间 ({formatDate(selectedRange.from)})
              </label>
              <input
                type="time"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="border p-2 rounded"
                min="00:00"
                max="23:59"
              />
            </div>
            <div className="flex flex-col w-1/2">
              <label className="text-sm text-gray-600">
                Check-out 时间 ({formatDate(selectedRange.to)})
              </label>
              <input
                type="time"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="border p-2 rounded"
                min="00:00"
                max="23:59"
              />
            </div>
          </div>

          <button
            onClick={applySettings}
            className="bg-blue-600 text-white px-4 py-2 rounded w-full"
          >
            确认应用到区间
          </button>
        </div>
      )}
    </div>
  );
}
