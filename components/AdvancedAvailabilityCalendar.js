import { useState } from "react";
import { DayPicker, useDayRender } from "react-day-picker";
import "react-day-picker/dist/style.css";

const formatDate = (date) => {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default function AdvancedAvailabilityCalendar({ value = {}, onChange }) {
  const [selectedDay, setSelectedDay] = useState(null);
  const [price, setPrice] = useState("");

  const applySettings = () => {
    if (!selectedDay) return;
    const key = formatDate(selectedDay);
    const updated = {
      ...value,
      [key]: { price: price !== "" ? parseInt(price, 10) : null },
    };
    onChange(updated);
    setSelectedDay(null);
    setPrice("");
  };

  // ✅ 自定义日期格子，必须用 useDayRender
  function CustomDay(props) {
    const { buttonProps, divProps } = useDayRender(
      props.date,
      props.displayMonth,
      props
    );
    const key = formatDate(props.date);
    const info = value[key];

    return (
      <div {...divProps} className="rdp-day">
        <button
          {...buttonProps}
          onClick={(e) => {
            buttonProps.onClick?.(e); // 保留 daypicker 内部逻辑
            setSelectedDay(props.date);
            setPrice(info?.price?.toString() || "");
          }}
          className="w-full h-full flex flex-col items-center justify-center"
        >
          <span>{props.date.getDate()}</span>
          {info?.price != null && (
            <span className="text-[10px] text-gray-600">
              MYR {info.price}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4">
      <DayPicker
        mode="single"
        selected={selectedDay}
        onSelect={setSelectedDay}
        components={{ Day: CustomDay }}
      />

      {selectedDay && (
        <div className="border p-3 rounded-lg">
          <div>选择日期: {formatDate(selectedDay)}</div>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="输入价格"
            className="border rounded p-1 w-full"
          />
          <button
            onClick={applySettings}
            className="bg-blue-500 text-white px-3 py-1 rounded mt-2"
          >
            保存
          </button>
        </div>
      )}
    </div>
  );
}
