import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function BuildYearSelector({ value, onChange }) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 70 + 5 + 1 }, (_, i) => currentYear + 5 - i);

  const [useCustomYear, setUseCustomYear] = useState(false);
  const [customYear, setCustomYear] = useState('');

  // 同步父组件的值
  React.useEffect(() => {
    if (value && !years.includes(Number(value))) {
      setUseCustomYear(true);
      setCustomYear(value);
    } else {
      setUseCustomYear(false);
      setCustomYear('');
    }
  }, [value, years]);

  const handleSelectChange = (e) => {
    if (e.target.value === 'custom') {
      setUseCustomYear(true);
      onChange('');
    } else {
      setUseCustomYear(false);
      setCustomYear('');
      onChange(e.target.value);
    }
  };

  const handleCustomChange = (e) => {
    const val = e.target.value;
    if (/^\d{0,4}$/.test(val)) {
      setCustomYear(val);
      onChange(val);
      const num = parseInt(val);
      if (val && !(num >= currentYear - 70 && num <= currentYear + 5)) {
        toast.error('请输入有效年份（近70年内）');
      }
    }
  };

  return (
    <div className="mb-4">
      <label className="block font-medium mb-1">建造年份</label>
      <select
        className="w-full border p-2 rounded"
        value={useCustomYear ? 'custom' : value}
        onChange={handleSelectChange}
      >
        <option value="">请选择建造年份</option>
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
        <option value="custom">自定义输入</option>
      </select>
      {useCustomYear && (
        <input
          type="number"
          placeholder="请输入建造年份"
          value={customYear}
          onChange={handleCustomChange}
          className="mt-2 w-full border p-2 rounded"
          maxLength={4}
        />
      )}
    </div>
  );
}
