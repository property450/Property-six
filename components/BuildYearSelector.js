import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function BuildYearSelector({ value, onChange }) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 70 + 5 + 1 }, (_, i) => currentYear + 5 - i);

  const [customYear, setCustomYear] = useState('');

  // 只要父组件传入的 value 是数字且4位，就同步给输入框
  useEffect(() => {
    if (value && /^\d{4}$/.test(value)) {
      setCustomYear(value);
    } else {
      setCustomYear('');
    }
  }, [value]);

  const handleSelectChange = (e) => {
    const val = e.target.value;
    if (val === '') {
      setCustomYear('');
      onChange('');
    } else {
      // 选中年份时，输入框显示并同步该值
      setCustomYear(val);
      onChange(val);
    }
  };

  const handleCustomChange = (e) => {
    const val = e.target.value;

    // 只能输入数字且最多4位
    if (/^\d{0,4}$/.test(val)) {
      setCustomYear(val);
      onChange(val);

      // 如果输入4位数字，做有效年份校验
      if (val.length === 4) {
        const num = parseInt(val, 10);
        if (num < currentYear - 70 || num > currentYear + 5) {
          toast.error('请输入有效年份（近70年内）');
        }
      }
    }
    // 不符合规则的输入，直接不更新状态，阻止非法输入
  };

  return (
    <div className="mb-4">
      <label className="block font-medium mb-1">建造年份</label>
      <select
        className="w-full border p-2 rounded"
        value={value || ''}
        onChange={handleSelectChange}
      >
        <option value="">请选择建造年份</option>
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>

      {/* 只要选了年份或者输入框有内容，就显示输入框 */}
      {(value || customYear) && (
        <input
          type="text"
          placeholder="请输入建造年份"
          value={customYear}
          onChange={handleCustomChange}
          className="mt-2 w-full border p-2 rounded"
          maxLength={4}
          inputMode="numeric"
          pattern="[0-9]*"
        />
      )}
    </div>
  );
}
