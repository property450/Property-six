// components/AdvancedAvailabilityCalendar.js
import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

/** 工具函数 */
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

const toDisplayPrice = (num) => {
  if (!num) return undefined;
  if (num >= 1_000_000) return `RM ${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 100_000) return `RM ${Math.round(num / 1_000)}k`;
  return `RM ${num.toLocaleString()}`;
};

const displayToNumber = (text) => {
  if (!text) return 0;
  const s = String(text).toLowerCase().replace(/rm|\s|,/g, "");
  if (s.endsWith("m")) return Math.round(parseFloat(s) * 1_000_000);
  if (s.endsWith("k")) return Math.round(parseFloat(s) * 1_000);
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

function safeParseValue(value) {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (typeof value === "object") return value;
  return null;
}

// ✅ 更稳：不靠 JSON.stringify（key 顺序不同也会被当成不同），改成 key/value 对比
function isSamePrices(a, b) {
  const A = a || {};
  const B = b || {};
  const aKeys = Object.keys(A);
  const bKeys = Object.keys(B);
  if (aKeys.length !== bKeys.length) return false;
  aKeys.sort();
  bKeys.sort();
  for (let i = 0; i < aKeys.length; i++) {
    if (aKeys[i] !== bKeys[i]) return false;
    const k = aKeys[i];
    if (String(A[k]) !== String(B[k])) return false;
  }
  return true;
}

/** 日期单元格：显示价格 */
const DayCell = React.memo(function DayCell({ date, prices }) {
  const price = prices[toKey(date)];
  let currency = "";
  let amount = "";
  if (price) {
    const parts = String(price).split(" ");
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

/**
 * 受控：
 * <AdvancedAvailabilityCalendar value={formData.availability} onChange={(next)=>...} />
 * - value 可对象或 JSON 字符串
 * - onChange 回传：{ prices, checkInTime, checkOutTime }
 */
export default function AdvancedAvailabilityCalendar({ value, onChange }) {
  const [prices, setPrices] = useState({});
  const [range, setRange] = useState(null);
  const [tempPriceRaw, setTempPriceRaw] = useState("");
  const [checkInTime, setCheckInTime] = useState("15:00");
  const [checkOutTime, setCheckOutTime] = useState("11:00");
  const [showDropdown, setShowDropdown] = useState(false);

  const panelRef = useRef(null);
  const calendarRef = useRef(null);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // ✅✅✅ 关键修复：Hydrate 完成前，不允许把默认值写回父层（否则就会闪烁）
  const [isHydrated, setIsHydrated] = useState(() => {
    // 如果一开始就有 value（编辑模式同步给到），直接算已 hydrate
    const parsed = safeParseValue(value);
    return !!parsed;
  });

  // ✅ 回填（编辑模式）
  const didHydrateRef = useRef(false);
  useEffect(() => {
    const parsed = safeParseValue(value);
    if (!parsed) return;

    const nextPrices = parsed?.prices || {};
    const nextIn = parsed?.checkInTime || "15:00";
    const nextOut = parsed?.checkOutTime || "11:00";

    if (!didHydrateRef.current) {
      setPrices(nextPrices);
      setCheckInTime(nextIn);
      setCheckOutTime(nextOut);
      didHydrateRef.current = true;

      // ✅ 现在才允许写回父层
      setIsHydrated(true);
      return;
    }

    setPrices((prev) => (isSamePrices(prev, nextPrices) ? prev : nextPrices));
    setCheckInTime((prev) => (prev === nextIn ? prev : nextIn));
    setCheckOutTime((prev) => (prev === nextOut ? prev : nextOut));

    // ✅ 只要父层真的给到 value，就视为 hydrate 完成
    setIsHydrated(true);
  }, [value]);

  // ✅ 写回父层（让 Supabase 能保存）
  useEffect(() => {
    // ✅✅✅ 没 hydrate 前不写回，避免默认值覆盖 -> 闪烁
    if (!isHydrated) return;

    const fn = onChangeRef.current;
    if (typeof fn !== "function") return;

    fn({ prices, checkInTime, checkOutTime });
  }, [prices, checkInTime, checkOutTime, isHydrated]);

  // ✅ 点击空白关闭
  useEffect(() => {
    const handleOutside = (e) => {
      const target = e.target;
      if (
        (panelRef.current && panelRef.current.contains(target)) ||
        (calendarRef.current && calendarRef.current.contains(target))
      ) {
        return;
      }
      setRange(null);
      setTempPriceRaw("");
      setShowDropdown(false);
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const predefined = useMemo(
    () => Array.from({ length: 1000 }, (_, i) => (i + 1) * 50),
    []
  );

  const handleDayClick = useCallback(
    (day) => {
      setRange((prev) => {
        if (!prev) {
          const key = toKey(day);
          const existing = prices[key];
          const v = displayToNumber(existing);
          setTempPriceRaw(v ? String(v) : "");
          return { from: day, to: day };
        }

        if (prev.from && prev.to && prev.from.getTime() === prev.to.getTime()) {
          const start = prev.from;
          if (day.getTime() === start.getTime()) return prev;
          const from = start < day ? start : day;
          const to = start < day ? day : start;
          return { from, to };
        }

        const key = toKey(day);
        const existing = prices[key];
        const v = displayToNumber(existing);
        setTempPriceRaw(v ? String(v) : "");
        return { from: day, to: day };
      });
    },
    [prices]
  );

  const handleSave = useCallback(() => {
    if (!range?.from || !range?.to) return;

    // ✅ 新建模式：用户一旦开始操作，就允许写回
    setIsHydrated(true);

    const num = Number(digitsOnly(tempPriceRaw));
    const display = toDisplayPrice(num);

    setPrices((prev) => {
      const next = { ...(prev || {}) };
      const cursor = new Date(range.from);
      while (cursor <= range.to) {
        const k = toKey(cursor);
        if (display) next[k] = display;
        else delete next[k];
        cursor.setDate(cursor.getDate() + 1);
      }
      return next;
    });

    setRange(null);
    setTempPriceRaw("");
    setShowDropdown(false);
  }, [range, tempPriceRaw]);

  const DayContent = useCallback(
    (props) => <DayCell {...props} prices={prices} />,
    [prices]
  );

  const checkInText = useMemo(
    () => (range?.from ? ymd(range.from) : ""),
    [range]
  );
  const checkOutText = useMemo(
    () => (range?.to ? ymd(addDays(range.to, 1)) : ""),
    [range]
  );

  return (
    <div>
      <div className="scale-110 origin-top" ref={calendarRef}>
        <DayPicker
          mode="range"
          selected={range || undefined}
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

      {range?.from && range?.to && (
        <div
          className="p-3 border rounded bg-gray-50 space-y-3 mt-3"
          ref={panelRef}
          onPointerDown={(e) => e.stopPropagation()}
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

          <div className="flex items-center justify-between text-sm text-gray-700 gap-4">
            <div>
              <span className="font-medium">Check-in 时间：</span>
              <input
                type="time"
                value={checkInTime}
                onChange={(e) => {
                  setIsHydrated(true);
                  setCheckInTime(e.target.value);
                }}
                className="border rounded px-2 py-1"
              />
            </div>
            <div>
              <span className="font-medium">Check-out 时间：</span>
              <input
                type="time"
                value={checkOutTime}
                onChange={(e) => {
                  setIsHydrated(true);
                  setCheckOutTime(e.target.value);
                }}
                className="border rounded px-2 py-1"
              />
            </div>
          </div>

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
                setIsHydrated(true);
                setTempPriceRaw(digitsOnly(e.target.value));
                setShowDropdown(false);
              }}
              onFocus={() => setShowDropdown(true)}
              onClick={() => setShowDropdown(true)}
              className="pl-10 border p-2 w-full rounded"
            />
            {showDropdown && (
              <ul className="absolute z-10 w-full bg-white border mt-1 max-h-60 overflow-y-auto rounded shadow">
                {predefined.map((p) => (
                  <li
                    key={p}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setIsHydrated(true);
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
            {/* ✅✅ 关键：避免在 form 内触发 submit */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleSave();
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              保存价格（应用到整个区间）
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
