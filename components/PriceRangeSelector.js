import { useEffect } from 'react';

export default function PriceRangeSelector({ minPrice, maxPrice, setMinPrice, setMaxPrice }) {
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
        placeholder="最低价格"
        className="p-2 border rounded w-full"
        value={min}
        onChange={(e) => setMinPrice(Number(e.target.value))}
      />
      <input
        type="number"
        placeholder="最高价格"
        className="p-2 border rounded w-full"
        value={max}
        onChange={(e) => setMaxPrice(Number(e.target.value))}
      />
    </div>
  );
}
