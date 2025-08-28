// components/AvailabilitySelector.js
import { useState } from "react";

export default function AvailabilitySelector({ value = [], onChange }) {
  const [dates, setDates] = useState(value);

  const handleAddDate = (e) => {
    const newDate = e.target.value;
    if (newDate && !dates.includes(newDate)) {
      const updated = [...dates, newDate];
      setDates(updated);
      onChange(updated);
    }
  };

  const handleRemoveDate = (date) => {
    const updated = dates.filter((d) => d !== date);
    setDates(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">可用日期</label>
      <input
        type="date"
        className="border rounded p-2 w-full"
        onChange={handleAddDate}
      />
      <div className="flex flex-wrap gap-2 mt-2">
        {dates.map((date) => (
          <span
            key={date}
            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2"
          >
            {date}
            <button
              type="button"
              className="text-red-500 hover:text-red-700"
              onClick={() => handleRemoveDate(date)}
            >
              ✕
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
