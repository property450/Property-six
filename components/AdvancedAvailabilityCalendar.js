// components/AdvancedAvailabilityCalendar.js
import { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

// ✅ 日期格式化函数 (yyyy-mm-dd，避免错位)
const formatDate = (date) => {
  if (!date || !(date instanceof Date)) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

  const wrapperRef = useRef(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // ✅ 预定义价格 (50 ~ 50,000)
  const predefinedPrices = Array.from({ length: 1000 }, (_, i) => (i + 1) * 50);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 日期选择
  const handleSelect = (range) => {
    if (!range) return;

    // ✅ 如果用户只选择了 "from" (check-in)，自动把 "to" 设为 +1 天
    if (range.from && !range.to) {
      const autoTo = new Date(range.from);
      autoTo.setDate(autoTo.getDate() + 1);
      setSelectedRange({ from: range.from, to: autoTo });
    } else {
      setSelectedRange(range);
    }

    // ✅ 单天 → 回填数据
    if (range?.from && range?.to && range.to.getTime() === range.from.getTime()) {
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

  return (
    <div className="space-y-4" ref={wrapperRef}>
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
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const info = value[key];
  console.log("日历日期:", date, "key:", key, "info:", info);
            return (
              <div className="relative h-16 w-16 flex flex-col items-center justify-center">
                {/* 日期号 */}
                <span className="text-sm">{date.getDate()}</span>
                {/* 价格显示 */}
                {info?.price && (
                  <span className="text-[11px] text-green-700 font-medium mt-1">
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
          {/* ✅ Check-in / Check-out 日期显示 */}
          <div className="flex justify-between">
            <p>Check-in 日期: {formatDate(selectedRange.from)}</p>
            <p>
              Check-out 日期:{" "}
              {selectedRange.to
                ? formatDate(
                    (() => {
                      const d = new Date(selectedRange.to);
                      d.setDate(d.getDate() + 1); // ✅ 自动加一天
                      return d;
                    })()
                  )
                : ""}
            </p>
          </div>

          {/* ✅ 价格输入 + 下拉选择 */}
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-600">
              RM
            </span>
            <input
              type="text"
              placeholder="价格"
              value={price}
              onChange={(e) => {
                const raw = e.target.value.replace(/,/g, "");
                if (/^\d*$/.test(raw)) {
                  setPrice(formatPrice(raw));
                }
              }}
              onFocus={() => setShowDropdown(true)}
              className="pl-10 border p-2 w-full rounded"
            />
            {showDropdown && (
              <ul className="absolute z-10 w-full bg-white border mt-1 max-h-60 overflow-y-auto rounded shadow">
                {predefinedPrices.map((p) => (
                  <li
                    key={p}
                    onClick={() => {
                      setPrice(formatPrice(p));
                      setShowDropdown(false);
                    }}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    RM {p.toLocaleString()}
                  </li>
                ))}
              </ul>
            )}
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
                Check-out 时间 (
                {selectedRange.to
                  ? formatDate(
                      (() => {
                        const d = new Date(selectedRange.to);
                        d.setDate(d.getDate() + 1);
                        return d;
                      })()
                    )
                  : ""}
                )
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

          {/* ✅ 确认按钮 */}
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
