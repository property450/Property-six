// AdvancedAvailabilityCalendar.js
import { useState } from "react";
import { DayPicker, useDayRender } from "react-day-picker";
import "react-day-picker/dist/style.css";

const formatDate = (date) => {
  if (!date) return "";
  return date.toISOString().split("T")[0]; // yyyy-mm-dd
};

export default function AdvancedAvailabilityCalendar() {
  const [selectedDay, setSelectedDay] = useState(null);
  const [prices, setPrices] = useState({});
  const [price, setPrice] = useState("");

  const savePrice = () => {
    if (!selectedDay) return;
    const key = formatDate(selectedDay);
    setPrices({
      ...prices,
      [key]: price,
    });
    setSelectedDay(null);
    setPrice("");
  };

  // ✅ 关键：保留 useDayRender 的 props
  function CustomDay(props) {
    const { buttonProps, divProps } = useDayRender(
      props.date,
      props.displayMonth,
      props
    );
    const key = formatDate(props.date);
    const dayPrice = prices[key];

    return (
      <div {...divProps} className="rdp-day">
        <button
          {...buttonProps}
          onClick={(e) => {
            buttonProps.onClick?.(e); // 必须保留
            setSelectedDay(props.date);
            setPrice(dayPrice || "");
          }}
          className="w-full h-full flex flex-col items-center justify-center"
        >
          <span>{props.date.getDate()}</span>
          {dayPrice && (
            <span className="text-[10px] text-blue-600">MYR {dayPrice}</span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <DayPicker
        mode="single"
        selected={selectedDay}
        onSelect={setSelectedDay}
        components={{ Day: CustomDay }}
      />

      {selectedDay && (
        <div className="mt-4 border p-3 rounded">
          <div>选择日期: {formatDate(selectedDay)}</div>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="输入价格"
            className="border rounded p-1 w-full mt-2"
          />
          <button
            onClick={savePrice}
            className="bg-blue-500 text-white px-3 py-1 rounded mt-2"
          >
            保存
          </button>
        </div>
      )}
    </div>
  );
}
