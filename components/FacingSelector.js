// components/FacingSelector.js
import React from 'react';

export default function FacingSelector({ value = [], onChange }) {
  const options = ["North", "South", "East", "West", "North-East", "North-West", "South-East", "South-West"];

  const handleToggle = (option) => {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
    } else {
      onChange([...value, option]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          type="button"
          key={o}
          onClick={() => handleToggle(o)}
          className={`px-3 py-1 border rounded ${
            value.includes(o) ? "bg-blue-500 text-white" : "bg-white text-gray-700"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

        <option value="">请选择朝向</option>
        <option value="东">东</option>
        <option value="南">南</option>
        <option value="西">西</option>
        <option value="北">北</option>
        <option value="东南">东南</option>
        <option value="东北">东北</option>
        <option value="西南">西南</option>
        <option value="西北">西北</option>
        <option value="其他">其他</option>
      </select>

      {value === '其他' && (
        <input
          type="text"
          className="mt-2 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          placeholder="请输入其他朝向"
          value={customValue}
          onChange={(e) => onCustomChange(e.target.value)}
        />
      )}
    </div>
  );
}
