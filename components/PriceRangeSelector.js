export default function PriceRangeSelector({ minPrice, setMinPrice, maxPrice, setMaxPrice }) {
  const priceOptions = [0, 50000, 100000, 200000, 500000, 1000000, 3000000, 5000000, 10000000, 50000000];

  return (
    <div className="flex items-center space-x-2">
      <select value={minPrice} onChange={(e) => setMinPrice(Number(e.target.value))} className="border p-1 rounded">
        <option value="">Min</option>
        {priceOptions.map((price) => (
          <option key={price} value={price}>
            RM {price.toLocaleString()}
          </option>
        ))}
      </select>
      <span className="mx-1">-</span>
      <select value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="border p-1 rounded">
        <option value="">Max</option>
        {priceOptions.map((price) => (
          <option key={price} value={price}>
            RM {price.toLocaleString()}
          </option>
        ))}
      </select>
    </div>
  );
}
