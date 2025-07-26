// components/RoomCountSelector.js
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';

export default function RoomCountSelector({ label, value, onChange }) {
  const predefinedOptions = ['1', '2', '3', '4+', '5+', '10+'];
  const [custom, setCustom] = useState('');

  const handleCustomInput = (e) => {
    const val = e.target.value;
    setCustom(val);
    const parsed = parseInt(val);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  const handleOptionClick = (option) => {
    const parsed = parseInt(option);
    onChange(!isNaN(parsed) ? parsed : parseInt(option.replace('+', '')));
    setCustom('');
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {predefinedOptions.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => handleOptionClick(option)}
            className={`px-3 py-1 rounded border ${
              value === parseInt(option) || value === parseInt(option.replace('+', ''))
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-800'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      <Input
        type="number"
        placeholder="Custom input"
        value={custom}
        onChange={handleCustomInput}
        className="w-full"
        min={0}
      />
    </div>
  );
}
