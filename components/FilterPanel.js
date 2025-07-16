// components/FilterPanel.js
import RangeSelector from './RangeSelector';
import SearchSuggestions from './SearchSuggestions';
import TypeSelector from './TypeSelector';

export default function FilterPanel({ filters = {}, setFilters }) {
  return (
    <div className="p-4 border rounded mb-6 space-y-4 bg-gray-50">
      <SearchSuggestions
        value={filters.keyword || ''}
        onChange={(val) => setFilters((f) => ({ ...f, keyword: val }))}
      />

      <TypeSelector
        value={filters.type || ''}
        onChange={(val) => setFilters((f) => ({ ...f, type: val }))}
      />

      <RangeSelector
        label="价格范围 (RM)"
        min={0}
        max={10000000}
        value={filters.priceRange || [0, 10000000]}
        onChange={(val) => setFilters((f) => ({ ...f, priceRange: val }))}
      />

      <RangeSelector
        label="距离 (KM)"
        min={0}
        max={100}
        value={filters.distance || [0, 100]}
        onChange={(val) => setFilters((f) => ({ ...f, distance: val }))}
      />

      <div className="flex justify-end">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={() => window.location.reload()}
        >
          重置筛选
        </button>
      </div>
    </div>
  );
}
