"use client";
import { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

// 格式化价格：带千分位，支持 K / M 简写
function formatPrice(value) {
  if (value >= 1000000) {
    return `RM ${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `RM ${(value / 1000).toFixed(1)}k`;
  }
  return `RM ${value.toLocaleString()}`;
}

export default function AdvancedAvailabilityCalendar() {
  const [prices, setPrices] = useState({});
  const [range, setRange] = useState(null); // { from, to }
  const [step, setStep] = useState(0); // 0=无选择, 1=已点一次, 2=已点两次
  const [showPanel, setShowPanel] = useState(false);
  const [inputPrice, setInputPrice] = useState("");
  const [checkIn, setCheckIn] = useState("14:00");
  const [checkOut, setCheckOut] = useState("12:00");

  // 点击日期逻辑
  const handleDayClick = (day) => {
    if (step === 0) {
      // 第一次点击
      setRange({ from: day, to: day });
      setStep(1);
      setShowPanel(true);
    } else if (step === 1) {
      // 第二次点击，扩展区间
      if (day < range.from) {
        setRange({ from: day, to: range.from });
      } else {
        setRange({ from: range.from, to: day });
      }
      setStep(2);
    } else {
      // 第三次点击，重置
      setRange({ from: day, to: day });
      setStep(1);
      setShowPanel(true);
    }
  };

  // 批量保存价格
  const handleSave = () => {
    if (!range || !inputPrice) return;

    const newPrices = { ...prices };
    let current = new Date(range.from);
    const end = new Date(range.to);

    while (current <= end) {
      const key = current.toDateString();
      newPrices[key] = Number(inputPrice);
      current.setDate(current.getDate() + 1);
    }

    setPrices(newPrices);
    setShowPanel(false);
    setInputPrice("");
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* 日历 */}
      <DayPicker
        mode="range"
        selected={range}
        onDayClick={handleDayClick}
        modifiersStyles={{
          selected: { backgroundColor: "#4f46e5", color: "white" },
        }}
        renderDay={(day) => {
          const key = day.toDateString();
          const price = prices[key];
          return (
            <div className="flex flex-col items-center">
              <span>{day.getDate()}</span>
              {price && (
                <span className="text-[10px] text-green-600 leading-none">
                  {formatPrice(price)}
                </span>
              )}
            </div>
          );
        }}
      />

      {/* 输入面板 */}
      {showPanel && range && (
        <div className="border p-4 rounded-md shadow-md w-72 space-y-3 bg-white">
          <p className="text-sm font-medium">
            {range.from.toDateString()}
            {range.to &&
              range.to.getTime() !== range.from.getTime() &&
              ` → ${range.to.toDateString()}`}
          </p>

          <input
            type="number"
            placeholder="输入价格"
            value={inputPrice}
            onChange={(e) => setInputPrice(e.target.value)}
            className="border p-1 rounded w-full text-sm"
          />

          {/* Check-in / Check-out */}
          <div className="flex justify-between space-x-2">
            <div>
              <label className="block text-xs">Check-in</label>
              <input
                type="time"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="border p-1 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs">Check-out</label>
              <input
                type="time"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="border p-1 rounded text-sm"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full bg-indigo-600 text-white p-2 rounded text-sm"
          >
            保存价格
          </button>
        </div>
      )}
    </div>
  );
}
