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
  num || num === 0 ? String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "";

export default function AdvancedAvailabilityCalendar({ value = {}, onChange }) {
  const [selectedRange, setSelectedRange] = useState(null);
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("available");
  const [checkIn, setCheckIn] = useState("14:00");
  const [checkOut, setCheckOut] = useState("12:00");

  const wrapperRef = useRef(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // 预定义价格
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

    if (range.from && !range.to) {
      // 选了 from 但没选 to，自动 +1 天
      const autoTo = new Date(range.from);
      autoTo.setDate(autoTo.getDate() + 1);
      setSelectedRange({ from: range.from, to: autoTo });
    } else {
      setSelectedRange(range);
    }

    // 单日选择时回填（方便编辑）
    if (range?.from && range?.to && range.to.getTime() === range.from.getTime()) {
      const key = formatDate(range.from);
      const info = value[key];
      if (info) {
        setPrice(formatPrice(info.price || ""));
        setStatus(info.status || "available");
        setCheckIn(info.checkIn || "14:00");
        setCheckOut(info.checkOut || "12:00");
      } else {
        setPrice("");
        setStatus("available");
        setCheckIn("14:00");
        setCheckOut("12:00");
      }
    }
  };

  // 确认应用设置到区间
  const applySettings = () => {
    if (!selectedRange?.from || !selectedRange?.to) return;

    // shallow clone，再按天写入
    const updated = { ...value };
    const day = new Date(selectedRange.from);
    while (day <= selectedRange.to) {
      const key = formatDate(day);
      updated[key] = {
        price: price ? parseInt(String(price).replace(/,/g, ""), 10) : null,
        status,
        checkIn,
        checkOut,
      };
      day.setDate(day.getDate() + 1);
    }

    // 保证新引用，触发父组件更新
    onChange({ ...updated });

    // 重置本地编辑状态
    setSelectedRange(null);
    setPrice("");
    setStatus("available");
    setCheckIn("14:00");
    setCheckOut("12:00");
  };

  // 用于高亮不同状态的 modifier（不改动）
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

  // 辅助：从 value 中找出与 date 对应的 info（兼容 yyyy-mm-dd / 时间戳 / iso）
  const findInfoForDate = (date) => {
    if (!date) return undefined;
    const k = formatDate(date);
    if (value && Object.prototype.hasOwnProperty.call(value, k)) return value[k];

    for (const key of Object.keys(value || {})) {
      // 先尝试解析为 Date
      const parsed = new Date(key);
      if (!isNaN(parsed.getTime())) {
        if (
          parsed.getFullYear() === date.getFullYear() &&
          parsed.getMonth() === date.getMonth() &&
          parsed.getDate() === date.getDate()
        ) {
          return value[key];
        }
      } else {
        // 再尝试当成时间戳数字
        const n = Number(key);
        if (!Number.isNaN(n)) {
          const parsed2 = new Date(n);
          if (!isNaN(parsed2.getTime())) {
            if (
              parsed2.getFullYear() === date.getFullYear() &&
              parsed2.getMonth() === date.getMonth() &&
              parsed2.getDate() === date.getDate()
            ) {
              return value[key];
            }
          }
        }
      }
    }
    return undefined;
  };

  return (
    <div className="space-y-4" ref={wrapperRef}>
      <label className="block font-medium">房源日历管理</label>

      {/* DayPicker 保持默认网格样式，不做破坏性布局修改 */}
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
          // 使用 DayContent（不会破坏 DayPicker 的格子布局）
          DayContent: ({ date }) => {
            if (!date) return null;
            const info = findInfoForDate(date);
            const priceNum = info?.price != null ? Number(info.price) : null;
            const showPrice = priceNum !== null && !Number.isNaN(priceNum) && priceNum > 0;

            // 返回一个简单的列布局：上面是日期号，下面是价格（如果有）
            return (
              <div className="flex flex-col items-center justify-between h-full p-1">
                <span className="text-sm leading-none">{date.getDate()}</span>
                {showPrice && (
                  <span className="text-[11px] text-green-700 font-medium mt-1">
                    RM {formatPrice(priceNum)}
                  </span>
                )}
              </div>
            );
          },
        }}
      />

      {selectedRange && (
        <div className="space-y-2 border p-3 rounded bg-gray-50">
          <div className="flex justify-between">
            <p>Check-in 日期: {formatDate(selectedRange.from)}</p>
            <p>
              Check-out 日期:{" "}
              {selectedRange.to
                ? formatDate(
                    (() => {
                      const d = new Date(selectedRange.to);
                      d.setDate(d.getDate() + 1);
                      return d;
                    })()
                  )
                : ""}
            </p>
          </div>

          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-600">RM</span>
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

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border p-2 w-full rounded"
          >
            <option value="available">可预订</option>
            <option value="booked">已订满</option>
            <option value="peak">高峰期</option>
          </select>

          <div className="flex gap-2">
            <div className="flex flex-col w-1/2">
              <label className="text-sm text-gray-600">Check-in 时间 ({formatDate(selectedRange.from)})</label>
              <input type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="border p-2 rounded" />
            </div>
            <div className="flex flex-col w-1/2">
              <label className="text-sm text-gray-600">
                Check-out 时间 ({selectedRange.to ? formatDate(() => new Date(selectedRange.to)) : ""})
              </label>
              <input type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="border p-2 rounded" />
            </div>
          </div>

          <button onClick={applySettings} className="bg-blue-600 text-white px-4 py-2 rounded w-full">
            确认应用到区间
          </button>
        </div>
      )}
    </div>
  );
}
