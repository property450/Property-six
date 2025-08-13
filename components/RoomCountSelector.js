// components/RoomCountSelector.js
"use client";

const formatNumber = (num) => {
  if (!num && num !== 0) return "";
  const str = num.toString().replace(/,/g, "");
  if (str === "") return "";
  return Number(str).toLocaleString();
};

const parseNumber = (str) => str.replace(/,/g, "");

export default function RoomCountSelector({ value = {}, onChange }) {
  const fields = [
    {
      key: "bedrooms",
      label: "卧室",
      options: ["Studio", 0, 1, 2, 3, 4, 5, 6],
    },
    {
      key: "bathrooms",
      label: "浴室",
      options: [0, 1, 2, 3, 4, 5, 6],
    },
    {
      key: "kitchens",
      label: "厨房",
      options: [1, 2, 3, 4, 5, 6],
    },
    {
      key: "livingRooms",
      label: "客厅",
      options: [0, 1, 2, 3, 4, 5, 6],
    },
  ];

  const handleChange = (key, val) => {
    const raw = parseNumber(val);

    // 如果输入的是纯数字
    if (/^\d+$/.test(raw)) {
      if (raw.length > 7) return; // 最多 7 位
      onChange({ ...value, [key]: raw });
    } else {
      // 非数字（如 Studio）直接存
      onChange({ ...value, [key]: val });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {fields.map((field) => {
        const currentValue = value[field.key];
        const displayValue =
          typeof currentValue === "number" || /^\d+$/.test(currentValue)
            ? formatNumber(currentValue)
            : currentValue || "";

        return (
          <div key={field.key} className="flex flex-col">
            <label className="text-sm font-medium mb-1">{field.label}</label>
            <input
              list={`${field.key}-list`}
              className="border rounded p-2 w-full"
              placeholder="输入或选择数量"
              value={displayValue}
              onChange={(e) => handleChange(field.key, e.target.value)}
            />
            <datalist id={`${field.key}-list`}>
              {field.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
              <option value="">请输入你要的数字</option>
            </datalist>
          </div>
        );
      })}
    </div>
  );
}
