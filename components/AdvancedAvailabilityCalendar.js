// components/AdvancedAvailabilityCalendar.js
import React, { useState, useCallback } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

// ✅ 单元格组件（修复价格太靠下问题）
const DayCell = React.memo(function DayCell({ date, prices }) {
  const key = date.toDateString();
  const price = prices[key];
  return (
    <div className="flex flex-col items-center w-full h-full py-0.5 leading-tight">
      {/* 日期（小一点，避免挤压价格） */}
      <span className="text-sm">{date.getDate()}</span>
      {/* 价格（更小，贴近日期，不会掉到底部） */}
      {price && (
        <span className="text-[9px] text-gray-600 mt-0.5">
          {price}
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
      setPrices((prev) => ({
        ...prev,
        [key]: tempPrice ? `RM ${Number(tempPrice).toLocaleString()}` : undefined,
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
        .rdp-custom .rdp-day {
          width: 120px !important;   /* 默认大约40px，可以加宽 */
          height: 80px !important;  /* 默认大约40px，可以略高 */
          padding: 0 !important;
        }
        .rdp-custom .rdp-head_cell {
          width: 60px !important;
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
