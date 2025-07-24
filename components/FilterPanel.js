import { useState } from 'react';
import SearchSuggestions from './SearchSuggestions';

export default function FilterPanel({
  onSearch,
  defaultPriceRange = [0, 1000000],
  defaultDistance = 5,
}) {
  const [keyword, setKeyword] = useState('');
  const [priceRange, setPriceRange] = useState(defaultPriceRange);
  const [distance, setDistance] = useState(defaultDistance);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch({ keyword, priceRange, distance });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 shadow rounded space-y-4">
      {/* 🔍 自动补全关键词搜索框 */}
      <div>
        <label className="block mb-1 font-semibold">关键词搜索</label>
        <SearchSuggestions value={keyword} onChange={setKeyword} />
      </div>

      {/* 💰 价格筛选 */}
      <div>
        <label className="block mb-1 font-semibold">价格范围 (RM)</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={priceRange[0]}
            onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
            className="border p-2 w-full"
            placeholder="最低价格"
          />
          <input
            type="number"
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
            className="border p-2 w-full"
            placeholder="最高价格"
          />
        </div>
      </div>

      {/* 📍 距离筛选 */}
      <div>
        <label className="block mb-1 font-semibold">距离 (km)</label>
        <input
          type="number"
          value={distance}
          onChange={(e) => setDistance(parseInt(e.target.value))}
          className="border p-2 w-full"
        />
      </div>

      {/* 🔘 提交按钮 */}
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
      >
        搜索
      </button>
    </form>
  );
}
