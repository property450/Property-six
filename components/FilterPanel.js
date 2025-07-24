// components/FilterPanel.js
import SearchSuggestions from './SearchSuggestions';

export default function FilterPanel({ filters, setFilters }) {
  const handleChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="bg-white p-4 shadow rounded space-y-4"
    >
      {/* 🔍 自动补全关键词搜索框 */}
      <div>
        <label className="block mb-1 font-semibold">关键词搜索</label>
        <SearchSuggestions
          value={filters.keyword || ''}
          onChange={(val) => handleChange('keyword', val)}
        />
      </div>

      {/* 💰 价格筛选 */}
      <div>
        <label className="block mb-1 font-semibold">价格范围 (RM)</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={filters.minPrice || ''}
            onChange={(e) => handleChange('minPrice', parseInt(e.target.value) || '')}
            className="border p-2 w-full"
            placeholder="最低价格"
          />
          <input
            type="number"
            value={filters.maxPrice || ''}
            onChange={(e) => handleChange('maxPrice', parseInt(e.target.value) || '')}
            className="border p-2 w-full"
            placeholder="最高价格"
          />
        </div>
      </div>

      {/* 📍 距离筛选 */}
      <div>
        <label className="block mb-1 font-semibold">距离范围 (km)</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={filters.minDistance || ''}
            onChange={(e) => handleChange('minDistance', parseInt(e.target.value) || '')}
            className="border p-2 w-full"
            placeholder="最小距离"
          />
          <input
            type="number"
            value={filters.maxDistance || ''}
            onChange={(e) => handleChange('maxDistance', parseInt(e.target.value) || '')}
            className="border p-2 w-full"
            placeholder="最大距离"
          />
        </div>
      </div>
    </form>
  );
}
