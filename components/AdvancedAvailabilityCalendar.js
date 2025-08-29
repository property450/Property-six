import { useState, useRef, useEffect, useMemo } from "react";
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

// 辅助：把一个 key（可能是 "yyyy-mm-dd" 或 ISO）解析成本地 Date（去掉时区偏差）
const parseKeyToLocalDate = (key) => {
  if (!key) return null;
  const m = String(key).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  const parsed = new Date(key);
  if (!isNaN(parsed)) {
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }
  return null;
};

export default function AdvancedAvailabilityCalendar({ value = {}, onChange }) {
  const [selectedRange, setSelectedRange] = useState(null);
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("available");
  const [checkIn, setCheckIn] = useState("14:00");
  const [checkOut, setCheckOut] = useState("12:00");

  const wrapperRef = useRef(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // 预定义价格 (50 ~ 50,000)
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

  // —— 关键：把传进来的 value 预处理成 priceMap (yyyy-mm-dd -> info)
  const { priceMap, priceDates } = useMemo(() => {
  const map = {};
  const dates = [];
  if (value && typeof value === "object") {
    Object.keys(value).forEach((key) => {
      const local = parseKeyToLocalDate(key);
      if (local) {
        const k = formatDate(local); // 强制转 yyyy-mm-dd
        map[k] = value[key];
        dates.push(local);
      }
    });
  }
  return { priceMap: map, priceDates: dates };
}, [value]);

  // 日期选择
  const handleSelect = (range) => {
    if (!range) return;

    if (range.from && !range.to) {
      const autoTo = new Date(range.from);
      autoTo.setDate(autoTo.getDate() + 1);
      setSelectedRange({ from: range.from, to: autoTo });
    } else {
      setSelectedRange(range);
    }

    if (range?.from && range?.to && range.to.getTime() === range.from.getTime()) {
      const key = formatDate(range.from);
      const info = priceMap[key];
      if (info) {
        setPrice(formatPrice(info.price ?? ""));
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

  const applySettings = () => {
    if (!selectedRange?.from || !selectedRange?.to) return;
    let updated = { ...value };
    let day = new Date(selectedRange.from);

    while (day <= selectedRange.to) {
  const key = formatDate(day); // 永远存 yyyy-mm-dd
  updated[key] = {
    price: price ? parseInt(String(price).replace(/,/g, "")) : null,
    status,
    checkIn,
    checkOut,
  };
  day.setDate(day.getDate() + 1);
}


    onChange({ ...updated });
    setSelectedRange(null);
    setPrice("");
    setStatus("available");
    setCheckIn("14:00");
    setCheckOut("12:00");
  };

  const modifiers = {
    available: Object.keys(priceMap)
      .filter((d) => priceMap[d]?.status === "available")
      .map((d) => parseKeyToLocalDate(d)),
    booked: Object.keys(priceMap)
      .filter((d) => priceMap[d]?.status === "booked")
      .map((d) => parseKeyToLocalDate(d)),
    peak: Object.keys(priceMap)
      .filter((d) => priceMap[d]?.status === "peak")
      .map((d) => parseKeyToLocalDate(d)),
    hasPrice: priceDates.map(
      (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
    ),
  };

  const DayContent = ({ date }) => {
    const key = formatDate(date);
    const info = priceMap[key];
    const priceNum = info?.price != null ? Number(info.price) : null;
    const showPrice = priceNum !== null && !isNaN(priceNum) && priceNum > 0;

    return (
      <div className="flex flex-col items-center justify-center w-full h-full">
        <span className="text-sm font-medium select-none">{date.getDate()}</span>
        {showPrice && (
          <span className="text-xs text-gray-700 select-none mt-0.5">
            MYR {formatPrice(priceNum)}
          </span>
        )}
      </div>
    );
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
          hasPrice: { paddingBottom: "0.5rem" },
        }}
        components={{ DayContent }}
      />

      {selectedRange && (
        <div className="space-y-2 border p-3 rounded bg-gray-50">
          <div className="flex justify-between">
            <p>Check-in 日期: {formatDate(selectedRange.from)}</p>
            <p>
              Check-out 日期:{" "}
              {selectedRange.to ? formatDate(selectedRange.to) : ""}
            </p>
          </div>

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
              <label className="text-sm text-gray-600">Check-in 时间</label>
              <input
                type="time"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="border p-2 rounded"
              />
            </div>
            <div className="flex flex-col w-1/2">
              <label className="text-sm text-gray-600">Check-out 时间</label>
              <input
                type="time"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="border p-2 rounded"
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
