// AdvancedAvailabilityCalendar.js
import { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

const formatDate = (date) => {
  if (!date) return "";
  return date.toISOString().split("T")[0]; // yyyy-mm-dd
};

export default function AdvancedAvailabilityCalendar() {
  const [selectedDay, setSelectedDay] = useState(null);

  return (
    <div className="p-4">
      <DayPicker
        mode="single"
        selected={selectedDay}
        onSelect={(day) => {
          console.log("✅ 点击到日期:", day);
          setSelectedDay(day);
        }}
      />

      {selectedDay && (
        <div className="mt-4 p-2 border rounded">
          你选择的日期是: <b>{formatDate(selectedDay)}</b>
        </div>
      )}
    </div>
  );
}
