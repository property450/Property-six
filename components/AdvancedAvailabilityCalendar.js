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
  const price = prices[toKey(date)]; // e.g. "RM 1.2M" / "RM 120k" / "RM 12,345"
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
  // 价格 Map：key = date.toDateString()，value = "RM ..."（已按 k/M/千分位格式化）
  const [prices, setPrices] = useState({});

  // 选择区间：始终保持 {from, to} 都有；单日时 from===to
  const [range, setRange] = useState(null); // {from, to} or null
  const [selecting, setSelecting] = useState(false); // 第一次点击后进入“等待第二次点击”状态

  // 输入框：内部保存纯数字字符串，显示时加千分位
  const [tempPriceRaw, setTempPriceRaw] = useState("");

  // 预设价格下拉
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  useEffect(() => {
    const onDocClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // 预设价格（50 ~ 50,000，步长 50）
  const predefined = useMemo(
    () => Array.from({ length: 1000 }, (_, i) => (i + 1) * 50),
    []
  );

  /** 点击日期：一次=单日（to=from），二次=区间（from..to），第三次再开始新的单日选择 */
  const handleDayClick = useCallback(
    (day) => {
      if (!selecting) {
        // 第一次点击：锁定单日，回填该日已有价格到输入框
        const key = toKey(day);
        const existing = prices[key];
        setRange({ from: day, to: day });
        setSelecting(true);
        setTempPriceRaw(displayToNumber(existing).toString() || "");
      } else {
        // 第二次点击：确定区间（from <= to）
        setRange((r) => {
          const from = r && r.from ? r.from : day;
          const to = day < from ? from : day;
          return { from: day < from ? day : from, to };
        });
        setSelecting(false);
      }
    },
    [selecting, prices]
  );

  /** 保存：按区间批量写入价格（toDisplayPrice 规则），并清理状态 */
  const handleSave = useCallback(() => {
    if (!range?.from || !range?.to) return;
    const num = Number(digitsOnly(tempPriceRaw));
    const display = toDisplayPrice(num);

    const next = { ...prices };
    const cursor = new Date(range.from);
    while (cursor <= range.to) {
      next[toKey(cursor)] = display;
      cursor.setDate(cursor.getDate() + 1);
    }
    setPrices(next);
    setRange(null);
    setSelecting(false);
    setTempPriceRaw("");
    setShowDropdown(false);
  }, [range, tempPriceRaw, prices]);

  /** DayPicker 单元格渲染 */
  const DayContent = useCallback(
    (props) => <DayCell {...props} prices={prices} />,
    [prices]
  );

  // 面板中显示的 Check-in / Check-out（checkout = to + 1 天）
  const checkInText = useMemo(() => (range?.from ? ymd(range.from) : ""), [range]);
  const checkOutText = useMemo(
    () => (range?.to ? ymd(addDays(range.to, 1)) : ""),
    [range]
  );

  return (
    <div>
      {/* ✅ 日历 */}
      <div className="scale-110 origin-top">
        <DayPicker
          mode="range"
          selected={range || undefined}
          onDayClick={handleDayClick}
          components={{ DayContent }}
          className="rdp-custom"
        />
      </div>

      {/* ✅ 覆盖样式：更“长方形”、且移动端自适应 */}
      <style jsx global>{`
        /* 桌面：固定 120 × 55 */
        .rdp-custom .rdp-day {
          width: 120px !important;
          height: 55px !important;
          padding: 0 !important;
        }
        .rdp-custom .rdp-head_cell {
          width: 120px !important;
        }
        /* 移动：7 列等分 */
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

      {/* ✅ 输入面板：有选择范围时出现（单日或多日都可以） */}
      {range?.from && range?.to && (
        <div className="p-3 border rounded bg-gray-50 space-y-3 mt-3" ref={dropdownRef}>
          {/* Check-in / Check-out（checkout 自动 +1 天） */}
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

          {/* 价格输入：左侧固定 RM、自动千分位、支持预设下拉 */}
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-600 select-none pointer-events-none">
              RM
            </span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="输入价格"
              value={withCommas(digitsOnly(tempPriceRaw))}
              onChange={(e) => setTempPriceRaw(digitsOnly(e.target.value))}
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

          {/* 操作 */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              保存价格（应用到整个区间）
            </button>
            <button
              onClick={() => {
                setRange(null);
                setSelecting(false);
                setTempPriceRaw("");
                setShowDropdown(false);
              }}
              className="px-4 py-2 rounded border"
            >
              取消选择
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
