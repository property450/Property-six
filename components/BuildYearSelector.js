// components/BuildYearSelector.js
import React, { useState, useRef, useEffect } from 'react';

export default function BuildYearSelector({ value, onChange, quarter, onQuarterChange, showQuarter }) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 70 + 5 + 1 }, (_, i) => currentYear + 5 - i);

  const [inputVal, setInputVal] = useState(value || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    setInputVal(value || '');
  }, [value]);

  // 点击页面外关闭下拉
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    if (val === '' || /^\d{0,4}$/.test(val)) {
      setInputVal(val);
      onChange(val);
    }
  };

  const handleOptionClick = (year) => {
    setInputVal(String(year));
    onChange(String(year));
    setShowDropdown(false);
  };

  return (
    <div className="mb-4 relative">
      <label className="block font-medium mb-1">预计交付时间</label>
      <div className="flex gap-2 items-end">
        {/* 年份输入框 */}
        <div className="flex-1 relative" ref={containerRef}>
          <input
            type="text"
            maxLength={4}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="请选择或输入建造年份"
            className="w-full border p-2 rounded"
            value={inputVal}
            onChange={handleInputChange}
            onFocus={() => setShowDropdown(true)}
          />
          {showDropdown && (
            <ul className="absolute z-10 w-full max-h-40 overflow-auto border bg-white rounded mt-1 shadow-lg">
              {years.map((year) => (
                <li
                  key={year}
                  className="p-2 cursor-pointer hover:bg-blue-500 hover:text-white"
                  onClick={() => handleOptionClick(year)}
                >
                  {year}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 季度下拉框 */}
        {showQuarter && (
          <div className="w-1/3">
            <select
              className="w-full border p-2 rounded"
              value={quarter}
              onChange={(e) => onQuarterChange(e.target.value)}
            >
              <option value="">选择季度</option>
              <option value="Q1">Q1</option>
              <option value="Q2">Q2</option>
              <option value="Q3">Q3</option>
              <option value="Q4">Q4</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
