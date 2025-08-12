import React, { useState, useRef, useEffect } from 'react';

export default function BuildYearSelector({ value, onChange }) {
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
    <div className="mb-4 relative" ref={containerRef}>
      <label className="block font-medium mb-1">建造年份</label>
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
  );
}
