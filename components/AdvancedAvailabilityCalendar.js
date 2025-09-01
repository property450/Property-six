import { useState, useMemo } from "react";
import { DayPicker, useDayRender } from "react-day-picker";
import "react-day-picker/dist/style.css";

// 日期格式化
const formatDate = (date) => {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};
const formatPrice = (num) =>
  num || num === 0 ? String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "";

function CustomDay(props) {
  const { date, priceMap } = props;
  const { buttonProps } = useDayRender(date, props.displayMonth, props);

  const key = formatDate(date);
  const info = priceMap?.[key];
  const showPrice =
    info?.price !== undefined && info?.price !== null && !isNaN(info.price);

  return (
    <button
      {...buttonProps}
      className="w-full h-full flex flex-col items-center justify-center focus:outline-none"
    >
      <span className="text-sm">{date.getDate()}</span>
      {showPrice && (
        <span className="text-xs text-gray-700">MYR {formatPrice(info.price)}</span>
      )}
    </button>
  );
}

export default function AdvancedAvailabilityCalendar({ value = {}, onChange }) {
  const [selectedDay, setSelectedDay] = useState(null);
  const [price, setPrice] = useState("");

  // 生成价格表
  const priceMap = useMemo(() => {
    const map = {};
    Object.keys(value).forEach((key) => {
      map[key] = value[key];
    });
    return map;
  }, [value]);

  // 保存设置
  const applySettings = () => {
    if (!selectedDay) return;
    const key = formatDate(selectedDay);
    const updated = {
      ...value,
      [key]: {
        price: price !== "" ? parseInt(price.replace(/,/g, ""), 10) : null,
      },
    };
    onChange(updated);
    setSelectedDay(null);
    setPrice("");
  };

  return (
    <div className="flex flex-col gap-4">
      <DayPicker
        mode="single"
        selected={selectedDay}
        onSelect={(day) => {
          if (!day) return;
          setSelectedDay(day);
          const key = formatDate(day);
          setPrice(priceMap[key]?.price ? String(priceMap[key].price) : "");
        }}
        components={{
          Day: (props) => <CustomDay {...props} priceMap={priceMap} />,
        }}
      />

      {selectedDay && (
        <div className="border p-3 rounded">
          <div>选中日期：{formatDate(selectedDay)}</div>
          <input
            type="text"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="输入价格"
            className="border rounded p-1 w-full mt-2"
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
