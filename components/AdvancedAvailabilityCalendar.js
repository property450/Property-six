// components/AdvancedAvailabilityCalendar.js
import React, { useState, useCallback } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

// ✅ 单元格组件（价格拆成 RM 和数值两行）
const DayCell = React.memo(function DayCell({ date, prices }) {
  const key = date.toDateString();
  const price = prices[key];

  // 拆分：比如 "RM 1.2M" → ["RM", "1.2M"]
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
        <span className="text-[9px] text-gray-700 leading-none">
          {amount}
        </span>
      )}
    </div>
  );
});

export default function AdvancedAvailabilityCalendar() {
  const [selectedDay, setSelectedDay] = useState(null);
  const [prices, setPrices] = useState({});
  const [tempPrice, setTempPrice] = useState("");

  // ✅ 点击日期
  const handleDayClick = useCallback(
    (day) => {
      const key = day.toDateString();
      setSelectedDay(day);
      setTempPrice(prices[key]?.replace("MYR ", "") || "");
    },
    [prices]
  );

  // ✅ 保存价格
const handleSave = useCallback(() => {
  if (selectedDay) {
    const key = selectedDay.toDateString();
    const num = Number(tempPrice);

    let displayPrice = undefined;
    if (num) {
      if (num >= 1000000) {
        // ✅ 超过 1M，显示为 M，保留 1 位小数
        displayPrice = `RM ${(num / 1000000).toFixed(1)}M`;
      } else if (num >= 100000) {
        // ✅ 超过 100k，显示为 k
        displayPrice = `RM ${Math.round(num / 1000)}k`;
      } else {
        // ✅ 正常显示千分位
        displayPrice = `RM ${num.toLocaleString()}`;
      }
    }

    setPrices((prev) => ({
      ...prev,
      [key]: displayPrice,
    }));

    setSelectedDay(null);
    setTempPrice("");
  }
}, [selectedDay, tempPrice]);

  // ✅ DayContent 渲染价格
  const DayContent = useCallback(
    (props) => <DayCell {...props} prices={prices} />,
    [prices]
  );

  return (
    <div>
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
  /* ✅ PC 默认：固定宽度，高度 */
  .rdp-custom .rdp-day {
    width: 120px !important;
    height: 55px !important;
    padding: 0 !important;
  }
  .rdp-custom .rdp-head_cell {
    width: 120px !important;
  }

  /* ✅ 移动端（小于768px）：自适应，保证7列刚好填满 */
  @media (max-width: 768px) {
    .rdp-custom .rdp-day {
      width: calc(100% / 7) !important;
      height: 50px !important; /* 稍微低一点 */
    }
    .rdp-custom .rdp-head_cell {
      width: calc(100% / 7) !important;
    }
  }
`}</style>

      {/* ✅ 输入价格框 */}
      {selectedDay && (
        <div className="p-3 border rounded bg-gray-50 space-y-2">
          <p>
            你选择的是：{" "}
            <strong>{selectedDay.toLocaleDateString()}</strong>
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
