// components/AdvancedAvailabilityCalendar.js
import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

/** ============ 小工具 ============ */
const addDays = (date, n) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
};
const toKey = (date) => date.toDateString();
const ymd = (date) => {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};
const digitsOnly = (s) => (s || "").replace(/[^\d]/g, "");
const withCommas = (s) =>
  s ? String(s).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "";

/** 显示规则 */
const toDisplayPrice = (num) => {
  if (!num) return undefined;
  if (num >= 1_000_000) return `RM ${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 100_000) return `RM ${Math.round(num / 1_000)}k`;
  return `RM ${num.toLocaleString()}`;
};

const displayToNumber = (text) => {
  if (!text) return 0;
  const s = text.toLowerCase().replace(/rm|\s|,/g, "");
  if (s.endsWith("m")) return Math.round(parseFloat(s) * 1_000_000);
  if (s.endsWith("k")) return Math.round(parseFloat(s) * 1_000);
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

/** 单元格 */
const DayCell = React.memo(function DayCell({ date, prices }) {
  const price = prices[toKey(date)];
  let currency = "";
  let amount = "";
  if (price) {
    const parts = price.split(" ");
    currency = parts[0] || "";
    amount = parts.slice(1).join(" ") || "";
  }
  return (
    <div className="flex flex-col items-center w-full h-full py-0.5 leading-tight">
      <span className="text-sm">{date.getDate()}</span>
      {currency && (
        <span className="text-[8px] text-gray-500 leading-none mt-0.5">
          {currency}
        </span>
      )}
      {amount && (
        <span className="text-[9px] text-gray-700 leading-none">{amount}</span>
      )}
    </div>
  );
});

/** ============ 主组件 ============ */
export default function AdvancedAvailabilityCalendar() {
  const [prices, setPrices] = useState({});
  const [ranges, setRanges] = useState([]);     // ✅ 支持多个区间
  const [tempRange, setTempRange] = useState(null); // 正在选择的区间
  const [selecting, setSelecting] = useState(false);
  const [tempPriceRaw, setTempPriceRaw] = useState("");

  const [checkInTime, setCheckInTime] = useState("15:00");
  const [checkOutTime, setCheckOutTime] = useState("11:00");

  const [showDropdown, setShowDropdown] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setTempRange(null);
        setSelecting(false);
        setTempPriceRaw("");
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const predefined = useMemo(
    () => Array.from({ length: 1000 }, (_, i) => (i + 1) * 50),
    []
  );

  /** ✅ 多选日期逻辑 */
  const handleDayClick = useCallback(
    (day) => {
      if (!selecting) {
        // 第一次点击：起点
        const key = toKey(day);
        const existing = prices[key];
        setTempRange({ from: day, to: day });
        setSelecting(true);
        setTempPriceRaw(displayToNumber(existing).toString() || "");
      } else {
        // 第二次点击：终点 → 确认区间
        setTempRange((r) => {
          if (!r?.from) return { from: day, to: day };
          let from = r.from;
          let to = day;
          if (day < from) {
            from = day;
            to = r.from;
          }
          const newRange = { from, to };
          setRanges((prev) => [...prev, newRange]); // ✅ 存入数组
          return newRange;
        });
        setSelecting(false);
      }
    },
    [selecting, prices]
  );

  /** ✅ 保存价格到所有区间 */
  const handleSave = useCallback(() => {
    if (!ranges.length) return;
    const num = Number(digitsOnly(tempPriceRaw));
    const display = toDisplayPrice(num);

    const next = { ...prices };
    ranges.forEach((r) => {
      const cursor = new Date(r.from);
      while (cursor <= r.to) {
        next[toKey(cursor)] = display;
        cursor.setDate(cursor.getDate() + 1);
      }
    });
    setPrices(next);
    setTempRange(null);
    setRanges([]);
    setSelecting(false);
    setTempPriceRaw("");
    setShowDropdown(false);
  }, [ranges, tempPriceRaw, prices]);

  const DayContent = useCallback(
    (props) => <DayCell {...props} prices={prices} />,
    [prices]
  );

  const checkInText = useMemo(
    () => (tempRange?.from ? ymd(tempRange.from) : ""),
    [tempRange]
  );
  const checkOutText = useMemo(
    () => (tempRange?.to ? ymd(addDays(tempRange.to, 1)) : ""),
    [tempRange]
  );

  return (
    <div>
      {/* 日历 */}
      <div className="scale-110 origin-top">
        <DayPicker
          mode="multiple"  // ✅ 支持多选
          selected={ranges.flatMap((r) => {
            const days = [];
            const cursor = new Date(r.from);
            while (cursor <= r.to) {
              days.push(new Date(cursor));
              cursor.setDate(cursor.getDate() + 1);
            }
            return days;
          })}
          onDayClick={handleDayClick}
          components={{ DayContent }}
          className="rdp-custom"
        />
      </div>

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

      {/* 输入面板 */}
      {tempRange?.from && tempRange?.to && (
        <div
          className="p-3 border rounded bg-gray-50 space-y-3 mt-3"
          ref={panelRef}
        >
          <div className="flex items-center justify-between text-sm text-gray-700">
            <div>
              <span className="font-medium">Check-in 日期：</span>
              {checkInText}
            </div>
            <div>
              <span className="font-medium">Check-out 日期：</span>
              {checkOutText}
            </div>
          </div>

          {/* 时间输入 */}
          <div className="flex items-center justify-between text-sm text-gray-700 gap-4">
            <div>
              <span className="font-medium">Check-in 时间：</span>
              <input
                type="time"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                className="border rounded px-2 py-1"
              />
            </div>
            <div>
              <span className="font-medium">Check-out 时间：</span>
              <input
                type="time"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
                className="border rounded px-2 py-1"
              />
            </div>
          </div>

          {/* 价格输入 */}
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-600 select-none pointer-events-none">
              RM
            </span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="输入价格"
              value={withCommas(digitsOnly(tempPriceRaw))}
              onChange={(e) => {
                setTempPriceRaw(digitsOnly(e.target.value));
                setShowDropdown(false);
              }}
              onFocus={() => setShowDropdown(true)}
              className="pl-10 border p-2 w-full rounded"
            />
            {showDropdown && (
              <ul className="absolute z-10 w-full bg-white border mt-1 max-h-60 overflow-y-auto rounded shadow">
                {predefined.map((p) => (
                  <li
                    key={p}
                    onClick={() => {
                      setTempPriceRaw(String(p));
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

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              保存价格（应用到所有区间）
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
