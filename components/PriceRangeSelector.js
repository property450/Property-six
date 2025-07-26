// components/PriceRangeSelector.js
import React from 'react';

const priceOptions = [
  '', 10000, 50000, 100000, 200000, 300000, 500000,
  1000000, 3000000, 5000000, 10000000, 20000000, 50000000
];

export default function PriceRangeSelector({ minPrice, maxPrice, setMinPrice, setMaxPrice }) {
  return (
    <div className="flex items-center gap-2">
      <label>💰 Price:</label>
      <select
        value={minPrice}
        onChange={(e) => setMinPrice(Number(e.target.value))}
        className="border p-1 rounded"
      >
        <option value="">Min</option>
        {priceOptions.map((price) => (
          <option key={price} value={price}>
            {price === '' ? '' : price.toLocaleString()}
          </option>
        ))}
      </select>

      <span className="mx-1">-</span>

      <select
        value={maxPrice}
        onChange={(e) => setMaxPrice(Number(e.target.value))}
        className="border p-1 rounded"
      >
        <option value="">Max</option>
        {priceOptions.map((price) => (
          <option key={price} value={price}>
            {price === '' ? '' : price.toLocaleString()}
          </option>
        ))}
      </select>
    </div>
  );
}
