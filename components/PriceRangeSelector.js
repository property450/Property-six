// ✅ PriceRangeSelector.js
import { useState, useEffect } from 'react';

export default function PriceRangeSelector({ minPrice, maxPrice, setMinPrice, setMaxPrice }) {
  const [min, setMin] = useState(minPrice || '');
  const [max, setMax] = useState(maxPrice || '');

  useEffect(() => {
    setMinPrice(Number(min));
  }, [min]);

  useEffect(() => {
    setMaxPrice(Number(max));
  }, [max]);

  return (
    <div className="flex gap-2">
      <input
        type="number"
        placeholder="Min Price"
        className="border rounded p-1"
        value={min}
        onChange={(e) => setMin(e.target.value)}
      />
      <input
        type="number"
        placeholder="Max Price"
        className="border rounded p-1"
        value={max}
        onChange={(e) => setMax(e.target.value)}
      />
    </div>
  );
}
