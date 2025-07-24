import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

export default function SearchSuggestions({ value, onChange }) {
  const [suggestions, setSuggestions] = useState([]);
  const debounceTimer = useRef(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (!value || value.length < 2) {
      setSuggestions([]);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('title')
        .ilike('title', `%${value}%`)
        .limit(5);

      if (!error && data) {
        const titles = data.map((d) => d.title);
        setSuggestions([...new Set(titles)]);
      }
    }, 300);
  }, [value]);

  const handleSelect = (title) => {
    onChange(title);
    setSuggestions([]); // 选中后隐藏建议
  };

  return (
    <div className="relative mb-4">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="请输入关键词"
        className="border p-2 w-full"
      />
      {suggestions.length > 0 && (
        <ul className="absolute bg-white border w-full z-10 max-h-40 overflow-auto shadow">
          {suggestions.map((item, i) => (
            <li
              key={i}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSelect(item)}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
