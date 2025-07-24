import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import PropertyCard from '@/components/PropertyCard';
import FilterPanel from '@/components/FilterPanel';

export default function SearchPage() {
  const [properties, setProperties] = useState([]);
  const [filters, setFilters] = useState({
    keyword: '',
    priceRange: [0, 1000000],
    distance: 5,
  });

  // 搜索逻辑
  const fetchProperties = async () => {
    let { data, error } = await supabase.from('properties').select('*');

    if (error) {
      console.error('Error fetching properties:', error);
      return;
    }

    const keywordLower = filters.keyword.toLowerCase();

    const filtered = data.filter((property) => {
      const matchesKeyword = !filters.keyword || (
        property.title?.toLowerCase().includes(keywordLower) ||
        property.description?.toLowerCase().includes(keywordLower) ||
        property.address?.toLowerCase().includes(keywordLower)
      );

      const matchesPrice =
        property.price >= filters.priceRange[0] &&
        property.price <= filters.priceRange[1];

      // 此处可加 distance 筛选逻辑（如果需要地理坐标）

      return matchesKeyword && matchesPrice;
    });

    setProperties(filtered);
  };

  // 页面加载时先拉一次
  useEffect(() => {
    fetchProperties();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Search Properties</h1>

      <FilterPanel
        filters={filters}
        setFilters={setFilters}
        onSearch={fetchProperties}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    </div>
  );
}
