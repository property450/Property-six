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
const withCommas = (s) => (s ? String(s).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "");

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

// 深度稳定序列化（排序 key，避免顺序变化导致“看起来不同”）
function stableJson(obj) {
  const seen = new WeakSet();
  const sortDeep = (v) => {
    if (v === null || v === undefined) return v;
    if (v instanceof Date) return v.toISOString();
    if (Array.isArray(v)) return v.map(sortDeep);

    if (typeof v === "object") {
      if (seen.has(v)) return null;
      seen.add(v);
      const out = {};
      Object.keys(v)
        .sort()
        .forEach((k) => {
          const val = v[k];
          if (val === undefined) return;
          if (typeof val === "function") return;
          out[k] = sortDeep(val);
        });
      return out;
    }
    return v;
  };

  try {
    return JSON.stringify(sortDeep(obj ?? null));
  } catch {
    return "";
  }
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
      {currency && <span className="text-[8px] text-gray-500 leading-none mt-0.5">{currency}</span>}
      {amount && <span className="text-[9px] text-gray-700 leading-none">{amount}</span>}
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

  // ✅ 固定 onChange 引用
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // ✅✅✅ 关键：编辑回填完成前，不允许写回父层（否则父层/子层互相覆盖导致闪烁）
  const didHydrateRef = useRef(false);
  const readyToSyncRef = useRef(false);
  const skipNextSyncRef = useRef(false);

  // ✅ 去重：props value hash / 已发送 hash
  const lastIncomingHashRef = useRef("");
  const lastSentHashRef = useRef("");

  // ✅ 回填（编辑模式 + 新建模式也兼容）
  useEffect(() => {
    const parsed = safeParseValue(value);
    // 没有 value：新建模式直接允许同步（但不会立刻写回，因为我们有去重）
    if (!parsed) {
      readyToSyncRef.current = true;
      return;
    }

    const next = {
      prices: parsed?.prices || {},
      checkInTime: parsed?.checkInTime || "15:00",
      checkOutTime: parsed?.checkOutTime || "11:00",
    };

    const incomingHash = stableJson(next);
    if (incomingHash && incomingHash === lastIncomingHashRef.current) {
      // props 虽然是新 object，但内容没变：不要重复 setState
      readyToSyncRef.current = true;
      return;
    }
    lastIncomingHashRef.current = incomingHash;

    // ✅ 这次是“从父层灌回子层”，接下来紧挨着的写回要跳过一次
    skipNextSyncRef.current = true;

    // 首次 hydrate
    if (!didHydrateRef.current) didHydrateRef.current = true;

    setPrices(next.prices);
    setCheckInTime(next.checkInTime);
    setCheckOutTime(next.checkOutTime);

    // ✅ 回填完成，允许同步
    readyToSyncRef.current = true;
  }, [value]);

  // ✅ 写回父层（去重 + 跳过回填那一轮）
  useEffect(() => {
    if (!readyToSyncRef.current) return;

    // ✅ 跳过“props 回填 setState 后紧接着的那次 effect”
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }

    const fn = onChangeRef.current;
    if (typeof fn !== "function") return;

    const payload = { prices, checkInTime, checkOutTime };
    const nextHash = stableJson(payload);

    // ✅ 去重：内容一样就不再写回（避免父层反复 setFormData → value 变动 → 又回填 → 闪）
    if (nextHash && nextHash === lastSentHashRef.current) return;
    lastSentHashRef.current = nextHash;

    fn(payload);
  }, [prices, checkInTime, checkOutTime]);

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

  const predefined = useMemo(() => Array.from({ length: 1000 }, (_, i) => (i + 1) * 50), []);

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

  const DayContent = useCallback((props) => <DayCell {...props} prices={prices} />, [prices]);

  const checkInText = useMemo(() => (range?.from ? ymd(range.from) : ""), [range]);
  const checkOutText = useMemo(() => (range?.to ? ymd(addDays(range.to, 1)) : ""), [range]);

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
