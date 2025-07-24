import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

let debounceTimer;

export default function SearchSuggestions({ value, onChange }) {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (debounceTimer) clearTimeout(debounceTimer);

    if (value.length < 2) {
      setSuggestions([]);
      return;
    }

    debounceTimer = setTimeout(async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('title')
        .ilike('title', `%${value}%`)
        .limit(5);

      if (!error && data) {
        const titles = data.map((d) => d.title);
        setSuggestions([...new Set(titles)]);
      }
    }, 300); // 延迟300ms节流
  }, [value]);

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
        <ul className="absolute bg-white border w-full z-10 max-h-40 overflow-auto">
          {suggestions.map((item, i) => (
            <li
              key={i}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => onChange(item)}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
