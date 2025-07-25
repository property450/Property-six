// components/PriceRangeSelector.js
import { useState } from 'react';

export default function PriceRangeSelector({ minPrice, maxPrice, setMinPrice, setMaxPrice }) {
  const priceOptions = [
    10000, 50000, 100000, 200000, 500000,
    1000000, 2000000, 5000000, 10000000, 20000000,
    50000000,
  ];

  const formatPrice = (price) => {
    if (price >= 10000000) return (price / 10000000) + '千万';
    if (price >= 10000) return (price / 10000) + '万';
    return price;
  };

  return (
    <div className="mb-4">
      <label className="block mb-1 font-semibold">价格范围：</label>
      <div className="flex gap-2 items-center">
        <select value={minPrice} onChange={(e) => setMinPrice(Number(e.target.value))} className="border p-1 rounded">
          <option value="">最低</option>
          {priceOptions.map((price) => (
            <option key={price} value={price}>
              {formatPrice(price)}
            </option>
          ))}
        </select>
        <span className="mx-1">-</span>
        <select value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="border p-1 rounded">
          <option value="">最高</option>
          {priceOptions.map((price) => (
            <option key={price} value={price}>
              {formatPrice(price)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
