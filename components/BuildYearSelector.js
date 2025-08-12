import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function BuildYearSelector({ value, onChange }) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 70 + 5 + 1 }, (_, i) => currentYear + 5 - i);

  const [inputVal, setInputVal] = useState(value || '');

  // 同步父组件value到本地状态
  useEffect(() => {
    setInputVal(value || '');
  }, [value]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    // 限制只能输入数字，最多4位
    if (val === '' || /^\d{0,4}$/.test(val)) {
      setInputVal(val);
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
      <input
        type="text"
        list="years-list"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={4}
        placeholder="请选择或输入建造年份"
        className="w-full border p-2 rounded"
        value={inputVal}
        onChange={handleInputChange}
      />
      <datalist id="years-list">
        {years.map((year) => (
          <option key={year} value={year} />
        ))}
      </datalist>
    </div>
  );
}
