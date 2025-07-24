import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import PropertyCard from '../components/PropertyCard';
import FilterPanel from '../components/FilterPanel';

export default function SearchPage() {
  const [properties, setProperties] = useState([]);
  const [filters, setFilters] = useState({
    keyword: '',
    minPrice: '',
    maxPrice: '',
    minDistance: '',
    maxDistance: ''
  });
  const [center, setCenter] = useState([3.139, 101.6869]); // 默认吉隆坡

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProperties();
    }, 300); // 延迟300毫秒执行，避免输入框卡顿

    return () => clearTimeout(timer); // 清除旧的 timer
  }, [filters]);

  const fetchProperties = async () => {
    let query = supabase.from('properties').select('*');

    // 关键词筛选
    if (filters.keyword) {
      query = query.ilike('address', `%${filters.keyword}%`);
    }

    // 价格筛选
    if (filters.minPrice) {
      query = query.gte('price', filters.minPrice);
    }
    if (filters.maxPrice) {
      query = query.lte('price', filters.maxPrice);
    }

    const { data, error } = await query;

    if (error) {
      console.error('加载房源失败:', error);
    } else {
      // 距离筛选
      const filtered = data.filter(property => {
        if (filters.minDistance || filters.maxDistance) {
          const distance = calculateDistance(
            center[0], center[1],
            property.latitude, property.longitude
          );
          if (
            (filters.minDistance && distance < filters.minDistance) ||
            (filters.maxDistance && distance > filters.maxDistance)
          ) {
            return false;
          }
        }
        return true;
      });

      setProperties(filtered);
    }
  };

  // 计算距离的函数（单位：公里）
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // 地球半径
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">搜索结果</h1>

      <FilterPanel filters={filters} setFilters={setFilters} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {properties.map(property => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    </div>
  );
}
