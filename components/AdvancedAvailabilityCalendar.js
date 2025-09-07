// components/AdvancedAvailabilityCalendar.js
import React, { useState, useCallback } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

// ✅ 自定义单元格（显示日期 + 价格）
const DayCell = React.memo(function DayCell({ date, prices }) {
  const key = date.toDateString();
  const price = prices[key];
  return (
    <div className="flex flex-col items-center w-full h-full py-0.5 leading-tight">
      <span className="text-sm">{date.getDate()}</span>
      {price && (
        <span className="text-[9px] text-gray-600 mt-0.5 whitespace-pre-line">
          {price}
        </span>
      )}
    </div>
  );
});

export default function AdvancedAvailabilityCalendar() {
  const [range, setRange] = useState(null); // ✅ 保存起点和终点
  const [prices, setPrices] = useState({});
  const [tempPrice, setTempPrice] = useState("");

  // ✅ 保存价格到选中的范围
  const handleSave = useCallback(() => {
    if (!range?.from) return;
    const start = range.from;
    const end = range.to || range.from;

    const num = Number(tempPrice);
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

    const newPrices = { ...prices };
    let cursor = new Date(start);
    while (cursor <= end) {
      newPrices[cursor.toDateString()] = displayPrice;
      cursor.setDate(cursor.getDate() + 1);
    }

    setPrices(newPrices);
    setRange(null);
    setTempPrice("");
  }, [range, tempPrice, prices]);

  const DayContent = useCallback(
    (props) => <DayCell {...props} prices={prices} />,
    [prices]
  );

  return (
    <div>
      {/* ✅ 日历 */}
      <div className="scale-110 origin-top">
        <DayPicker
          mode="range" // ✅ 支持起点+终点 → 自动高亮区间
          selected={range}
          onSelect={setRange}
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

      {/* ✅ 输入价格框 */}
      {range?.from && (
        <div className="p-3 border rounded bg-gray-50 space-y-2 mt-3">
          <p>
            Check-in: <strong>{range.from.toLocaleDateString()}</strong>
          </p>
          <p>
            Check-out:{" "}
            <strong>
              {range.to
                ? new Date(range.to.getTime() + 86400000).toLocaleDateString()
                : new Date(range.from.getTime() + 86400000).toLocaleDateString()}
            </strong>
          </p>

          <input
            type="number"
            value={tempPrice}
            placeholder="输入价格"
            onChange={(e) => setTempPrice(e.target.value)}
            className="border px-2 py-1 rounded w-full"
          />
          <button
            onClick={handleSave}
            className="bg-blue-500 text-white px-3 py-1 rounded"
          >
            保存价格
          </button>
        </div>
      )}
    </div>
  );
}
