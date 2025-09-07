// components/AdvancedAvailabilityCalendar.js
import React, { useState, useCallback, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

// ✅ 日期格式化函数
const formatDate = (date) => {
  if (!date || !(date instanceof Date)) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// ✅ 千分位格式化
const formatPrice = (num) =>
  num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "";

// ✅ 单元格组件（价格拆成 RM 和数值两行）
const DayCell = React.memo(function DayCell({ date, prices }) {
  const key = date.toDateString();
  const price = prices[key];

  let currency = "";
  let amount = "";
  if (price) {
    const parts = price.split(" ");
    currency = parts[0] || "";
    amount = parts[1] || "";
  }

  return (
    <div className="flex flex-col items-center w-full h-full py-0.5 leading-tight">
      {/* 日期 */}
      <span className="text-sm">{date.getDate()}</span>

      {/* 币种 */}
      {currency && (
        <span className="text-[8px] text-gray-500 leading-none mt-0.5">
          {currency}
        </span>
      )}

      {/* 金额 */}
      {amount && (
        <span className="text-[9px] text-gray-700 leading-none">{amount}</span>
      )}
    </div>
  );
});

export default function AdvancedAvailabilityCalendar() {
  const [selectedDay, setSelectedDay] = useState(null);
  const [prices, setPrices] = useState({});
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

  // ✅ 点击日期
  const handleDayClick = useCallback(
    (day) => {
      const key = day.toDateString();
      setSelectedDay(day);

      if (prices[key]) {
        // 回填
        const raw = prices[key].replace("RM ", "").replace(/,/g, "");
        setPrice(formatPrice(raw));
      } else {
        setPrice("");
      }
      setStatus("available");
      setCheckIn("14:00");
      setCheckOut("12:00");
    },
    [prices]
  );

  // ✅ 保存设置
  const applySettings = () => {
    if (!selectedDay) return;

    const key = selectedDay.toDateString();
    const num = price ? parseInt(price.replace(/,/g, ""), 10) : null;

    let displayPrice = undefined;
    if (num) {
      if (num >= 1000000) {
        displayPrice = `RM ${(num / 1000000).toFixed(1)}M`;
      } else if (num >= 100000) {
        displayPrice = `RM ${Math.round(num / 1000)}k`;
      } else {
        displayPrice = `RM ${num.toLocaleString()}`;
      }
    }

    setPrices((prev) => ({
      ...prev,
      [key]: displayPrice,
    }));

    setSelectedDay(null);
    setPrice("");
    setStatus("available");
    setCheckIn("14:00");
    setCheckOut("12:00");
  };

  // ✅ DayContent 渲染价格
  const DayContent = useCallback(
    (props) => <DayCell {...props} prices={prices} />,
    [prices]
  );

  return (
    <div ref={wrapperRef}>
      {/* ✅ 日历 */}
      <div className="scale-110 origin-top">
        <DayPicker
          mode="single"
          selected={selectedDay}
          onDayClick={handleDayClick}
          components={{ DayContent }}
          className="rdp-custom"
        />
      </div>

      {/* ✅ 样式覆盖：格子长方形 */}
      <style jsx global>{`
        .rdp-custom .rdp-day {
          width: 120px !important;
          height: 55px !important;
          padding: 0 !important;
        }
        .rdp-custom .rdp-head_cell {
          width: 120px !important;
        }

        @media (max-width: 768px) {
          .rdp-custom .rdp-day {
            width: calc(100% / 7) !important;
            height: 50px !important;
          }
          .rdp-custom .rdp-head_cell {
            width: calc(100% / 7) !important;
          }
        }
      `}</style>

      {/* ✅ 输入设置框 */}
      {selectedDay && (
        <div className="p-3 border rounded bg-gray-50 space-y-2 mt-3">
          <p>
            你选择的是： <strong>{selectedDay.toLocaleDateString()}</strong>
          </p>

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
                Check-in 时间 ({formatDate(selectedDay)})
              </label>
              <input
                type="time"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="border p-2 rounded"
              />
            </div>
            <div className="flex flex-col w-1/2">
              <label className="text-sm text-gray-600">
                Check-out 时间 ({formatDate(selectedDay)})
              </label>
              <input
                type="time"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="border p-2 rounded"
              />
            </div>
          </div>

          {/* ✅ 确认按钮 */}
          <button
            onClick={applySettings}
            className="bg-blue-600 text-white px-4 py-2 rounded w-full"
          >
            确认应用
          </button>
        </div>
      )}
    </div>
  );
}
