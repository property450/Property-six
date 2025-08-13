// components/RoomCountSelector.js
import { useState } from "react";

export default function QuantitySelector({ value, onChange }) {
  const [isCustom, setIsCustom] = useState(false);

  const options = [1, 2, 3, 4, 5, "自定义输入"];

  const handleSelectChange = (e) => {
    const selected = e.target.value;

    if (selected === "自定义输入") {
      setIsCustom(true);
      onChange(""); // 清空值
    } else {
      setIsCustom(false);
      onChange(selected);
    }
  };

  return (
    <div style={{ width: "200px" }}>
      {isCustom ? (
        <input
          type="number"
          placeholder="请输入你要的数量"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%",
            padding: "5px",
            border: "1px solid #ccc",
            borderRadius: "5px",
          }}
        />
      ) : (
        <select
          value={value || ""}
          onChange={handleSelectChange}
          style={{
            width: "100%",
            padding: "5px",
            border: "1px solid #ccc",
            borderRadius: "5px",
          }}
        >
          <option value="">请选择数量</option>
          {options.map((opt, i) => (
            <option key={i} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
