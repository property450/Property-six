// components/PriceRangeSelector.js
export default function PriceRangeSelector({ minPrice, maxPrice, setMinPrice, setMaxPrice }) {
  const priceOptions = [
    10000, 50000, 100000, 200000, 500000, 1000000, 2000000, 5000000, 10000000, 20000000, 50000000,
  ];

  return (
    <div className="mb-4">
      <label className="block font-semibold mb-1">价格范围 (RM)</label>
      <div className="flex items-center">
        <select
          value={minPrice}
          onChange={(e) => setMinPrice(Number(e.target.value))}
          className="border p-1 rounded"
        >
          <option value="">Min</option>
          {priceOptions.map((price) => (
            <option key={price} value={price}>
              {price.toLocaleString()}
            </option>
          ))}
        </select>

        <span className="mx-2">-</span>

        <select
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="border p-1 rounded"
        >
          <option value="">Max</option>
          {priceOptions.map((price) => (
            <option key={price} value={price}>
              {price.toLocaleString()}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
