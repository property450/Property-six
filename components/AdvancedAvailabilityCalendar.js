// pages/test.js
import { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

export default function Test() {
  const [selected, setSelected] = useState();

  return (
    <div>
      <DayPicker
        mode="single"
        selected={selected}
        onSelect={setSelected}
      />
      <p>你选择的日期：{selected?.toLocaleDateString()}</p>
    </div>
  );
}
