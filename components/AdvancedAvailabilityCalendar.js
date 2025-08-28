// components/AdvancedAvailabilityCalendar.js
import { useState, useRef } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

export default function AdvancedAvailabilityCalendar({ value = {}, onChange }) {
  const [selectedRange, setSelectedRange] = useState(null);
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("available");
  const inputRef = useRef(null);

  // 格式化日期
  const formatDate = (date) => {
    if (!date || !(date instanceof Date)) return "";
    return date.toISOString().split("T")[0];
  };

  // 千分位格式化
  const formatPrice = (num) =>
    num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "";

  const parsePrice = (str) => {
    const cleaned = str.replace(/,/g, "");
    const num = parseInt(cleaned, 10);
    if (isNaN(num)) return "";
    return Math.min(50000, Math.max(50, num)); // 限制范围
  };

  // 选择日期区间
  const handleSelect = (range) => {
    setSelectedRange(range);
  };

  // 批量设置价格和状态
  const applySettings = () => {
    if (!selectedRange?.from || !selectedRange?.to) return;
    let updated = { ...value };
    let day = new Date(selectedRange.from);

    while (day <= selectedRange.to) {
      const key = formatDate(day);
      updated[key] = { price: parsePrice(price), status };
      day.setDate(day.getDate() + 1);
    }

    onChange(updated);
    setSelectedRange(null);
    setPrice("");
    setStatus("available");
  };

  // 区分不同状态的日期
  const availableDays = Object.keys(value)
    .filter((d) => value[d]?.status === "available")
    .map((d) => new Date(d));

  const bookedDays = Object.keys(value)
    .filter((d) => value[d]?.status === "booked")
    .map((d) => new Date(d));

  const peakDays = Object.keys(value)
    .filter((d) => value[d]?.status === "peak")
    .map((d) => new Date(d));

  return (
    <div className="space-y-4">
      <label className="block font-medium">房源日历管理</label>

      <DayPicker
        mode="range"
        selected={selectedRange}
        onSelect={handleSelect}
        showOutsideDays
        modifiers={{
          available: availableDays,
          booked: bookedDays,
          peak: peakDays,
        }}
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
          <p>
            设置区间:{" "}
            {formatDate(selectedRange.from)} → {formatDate(selectedRange.to)}
          </p>

          {/* ✅ 带千分位、只能输入数字、始终带 RM 前缀 */}
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-600">
              RM
            </span>
            <input
              ref={inputRef}
              type="text"
              placeholder="价格"
              value={price}
              onChange={(e) => {
                const num = parsePrice(e.target.value);
                setPrice(num ? formatPrice(num) : "");
              }}
              onKeyDown={(e) => {
                if (
                  !/[0-9]/.test(e.key) &&
                  !["Backspace", "Delete", "ArrowLeft", "ArrowRight"].includes(
                    e.key
                  )
                ) {
                  e.preventDefault();
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
          </div>

          {/* ✅ 下拉快速选择价格 */}
          <select
            onChange={(e) => setPrice(formatPrice(parseInt(e.target.value)))}
            className="border p-2 w-full rounded"
          >
            <option value="">快速选择价格</option>
            {[50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000].map(
              (p) => (
                <option key={p} value={p}>
                  RM {formatPrice(p)}
                </option>
              )
            )}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border p-2 w-full rounded"
          >
            <option value="available">可预订</option>
            <option value="booked">已订满</option>
            <option value="peak">高峰期</option>
          </select>
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
