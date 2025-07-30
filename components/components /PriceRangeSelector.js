import { useEffect } from 'react';

export default function PriceRangeSelector({ minPrice, maxPrice, setMinPrice, setMaxPrice }) {

  return (
    <div className="flex gap-2">
      <input
        type="number"
        placeholder="最低价格"
        className="p-2 border rounded w-full"
        value={minPrice}
        onChange={(e) => setMinPrice(Number(e.target.value))}
      />
      <input
        type="number"
        placeholder="最高价格"
        className="p-2 border rounded w-full"
        value={maxPrice}
        onChange={(e) => setMaxPrice(Number(e.target.value))}
      />
    </div>
  );
}
