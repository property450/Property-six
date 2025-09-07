// components/AdvancedAvailabilityCalendar.js
import React, { useState, useCallback } from "react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import "react-day-picker/dist/style.css";

// ✅ 单元格组件：日期 + 价格
const DayCell = React.memo(function DayCell({ date, prices }) {
  const key = date.toDateString();
  const price = prices[key];
  return (
    <div className="flex flex-col items-center w-full h-full py-0.5 leading-tight">
      {/* 日期 */}
      <span className="text-sm">{date.getDate()}</span>
      {/* 价格 */}
      {price && (
        <span className="text-[9px] text-gray-600 leading-none mt-0.5 text-center">
          {price.split(" ")[0]} {/* RM */}
          <br />
          {price.split(" ")[1]} {/* 数字 */}
        </span>
      )}
    </div>
  );
});

export default function AdvancedAvailabilityCalendar() {
  const [range, setRange] = useState({ from: null, to: null }); // ✅ 日期范围
  const [prices, setPrices] = useState({});
  const [tempPrice, setTempPrice] = useState("");

  // ✅ 格式化价格
  const formatPrice = (num) => {
    if (!num) return undefined;
    if (num >= 1000000) {
      return `RM ${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 100000) {
      return `RM ${Math.round(num / 1000)}k`;
    } else {
      return `RM ${num.toLocaleString()}`;
    }
  };

  // ✅ 点击日期（选择范围）
  const handleSelect = useCallback((newRange) => {
    setRange(newRange || { from: null, to: null });
  }, []);

  // ✅ 保存价格（批量应用范围内所有日期）
  const handleSave = useCallback(() => {
    if (!range.from || !range.to) return;

    const num = Number(tempPrice);
    const displayPrice = formatPrice(num);

    if (displayPrice) {
      const updatedPrices = { ...prices };
      let current = new Date(range.from);
      while (current <= range.to) {
        const key = current.toDateString();
        updatedPrices[key] = displayPrice;
        current.setDate(current.getDate() + 1);
      }
      setPrices(updatedPrices);
    }

    setTempPrice("");
    setRange({ from: null, to: null });
  }, [range, tempPrice, prices]);

  // ✅ DayContent 渲染
  const DayContent = useCallback(
    (props) => <DayCell {...props} prices={prices} />,
    [prices]
  );

  return (
    <div>
      {/* ✅ 日历 */}
      <div className="scale-110 origin-top">
        <DayPicker
          mode="range"
          selected={range}
          onSelect={handleSelect}
          components={{ DayContent }}
          className="rdp-custom"
        />
      </div>

      {/* ✅ 样式覆盖 */}
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

      {/* ✅ 输入价格 + Check-in / Check-out */}
      {range.from && range.to && (
        <div className="p-3 border rounded bg-gray-50 space-y-2 mt-3">
          <p>
            Check-in: <strong>{format(range.from, "yyyy-MM-dd")}</strong>
          </p>
          <p>
            Check-out:{" "}
            <strong>
              {format(new Date(range.to.getTime() + 24 * 60 * 60 * 1000), "yyyy-MM-dd")}
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
            保存价格（应用到选中范围）
          </button>
        </div>
      )}
    </div>
  );
}
