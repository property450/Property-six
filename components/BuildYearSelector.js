import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function BuildYearSelector({ value, onChange }) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 70 + 5 + 1 }, (_, i) => currentYear + 5 - i);

  // 是否使用自定义输入框
  const [useCustomYear, setUseCustomYear] = useState(false);
  // 输入框值（字符串）
  const [customYear, setCustomYear] = useState('');

  // 当父组件的 value 改变，判断是否切换到自定义输入框
  useEffect(() => {
    if (value && !years.includes(Number(value))) {
      setUseCustomYear(true);
      setCustomYear(value);
    } else {
      setUseCustomYear(false);
      setCustomYear('');
    }
  }, [value, years]);

  // 下拉框切换事件
  const handleSelectChange = (e) => {
    const val = e.target.value;
    if (val === 'custom') {
      setUseCustomYear(true);
      setCustomYear('');
      onChange('');
    } else {
      setUseCustomYear(false);
      setCustomYear('');
      onChange(val);
    }
  };

  // 自定义输入框改变事件
  const handleCustomChange = (e) => {
    const val = e.target.value;
    // 限制只允许数字，最多4位
    if (val === '' || /^\d{0,4}$/.test(val)) {
      setCustomYear(val);
      onChange(val);

      if (val.length === 4) {
        const num = parseInt(val, 10);
        if (num < currentYear - 70 || num > currentYear + 5) {
          toast.error('请输入有效年份（近70年内）');
        }
      }
    }
  };

  return (
    <div className="mb-4">
      <label className="block font-medium mb-1">建造年份</label>
      <select
        className="w-full border p-2 rounded"
        value={useCustomYear ? 'custom' : value || ''}
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
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          placeholder="请输入建造年份"
          className="mt-2 w-full border p-2 rounded"
          value={customYear}
          onChange={handleCustomChange}
        />
      )}
    </div>
  );
}
