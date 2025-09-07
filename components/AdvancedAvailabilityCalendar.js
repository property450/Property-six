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

/** 显示规则：≥1,000,000 -> RM x.xM；≥100,000 -> RM xxxk；其他 -> 千分位 */
const toDisplayPrice = (num) => {
  if (!num) return undefined;
  if (num >= 1_000_000) return `RM ${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 100_000) return `RM ${Math.round(num / 1_000)}k`;
  return `RM ${num.toLocaleString()}`;
};

/** 从显示文本还原数字（支持 k/M）用于回填输入框 */
const displayToNumber = (text) => {
  if (!text) return 0;
  const s = text.toLowerCase().replace(/rm|\s|,/g, "");
  if (s.endsWith("m")) return Math.round(parseFloat(s) * 1_000_000);
  if (s.endsWith("k")) return Math.round(parseFloat(s) * 1_000);
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

/** ============ 单元格：日期 + 价格（上下两行） ============ */
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
                     // components/AdvancedAvailabilityCalendar.js
// ……前面代码保持不变……

export default function AdvancedAvailabilityCalendar() {
  const [prices, setPrices] = useState({});
  const [ranges, setRanges] = useState([]);   // ✅ 改成数组，支持多个区间
  const [tempRange, setTempRange] = useState(null); // 临时正在选择的区间
  const [selecting, setSelecting] = useState(false);
  const [tempPriceRaw, setTempPriceRaw] = useState("");

  const [checkInTime, setCheckInTime] = useState("15:00");
  const [checkOutTime, setCheckOutTime] = useState("11:00");

  const [showDropdown, setShowDropdown] = useState(false);
  const panelRef = useRef(null);

  // ✅ 点击空白处关闭输入面板
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
        // 第二次点击：终点，保存到 ranges
        setTempRange((r) => {
          if (!r?.from) return { from: day, to: day };
          let from = r.from;
          let to = day;
          if (day < from) {
            from = day;
            to = r.from;
          }
          const newRange = { from, to };
          setRanges((prev) => [...prev, newRange]); // ✅ 累加到数组
          return newRange;
        });
        setSelecting(false);
      }
    },
    [selecting, prices]
  );

  /** ✅ 保存价格到所有选中区间 */
  const handleSave = useCallback(() => {
    if (!tempRange?.from || !tempRange?.to) return;
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
  }, [ranges, tempRange, tempPriceRaw, prices]);

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
      {/* ✅ 日历 */}
      <div className="scale-110 origin-top">
        <DayPicker
          mode="multiple"  // ✅ 改成 multiple 允许多个区间
          selected={ranges.flatMap((r) => [r.from, r.to])}
          onDayClick={handleDayClick}
          components={{ DayContent }}
          className="rdp-custom"
        />
      </div>

      {/* ……保持你的样式和输入面板不变，只用 tempRange / ranges 替换 range …… */}

      {tempRange?.from && tempRange?.to && (
        <div
          className="p-3 border rounded bg-gray-50 space-y-3 mt-3"
          ref={panelRef}
        >
          {/* Check-in / Check-out 日期 */}
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

          {/* 时间输入框 + 价格输入 ……保持不变 */}

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
