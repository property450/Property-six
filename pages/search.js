// pages/search.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { supabase } from '../supabaseClient';
import FilterPanel from '../components/FilterPanel';
import dynamic from 'next/dynamic';

const MapWithMarkers = dynamic(() => import('../components/MapWithMarkers'), {
  ssr: false,
});

export default function SearchPage() {
  const [filters, setFilters] = useState({
    keyword: '',
    priceRange: [0, 10000000],
    distance: [0, 100],
    type: '',
  });

  const [center, setCenter] = useState(null); // 地图中心点
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    fetchProperties();
  }, [filters]);

  async function fetchProperties() {
    const { keyword, priceRange, distance, type } = filters;

    let query = supabase.from('properties').select('*');

    // 价格范围筛选
    query = query.gte('price', priceRange[0]).lte('price', priceRange[1]);

    // 类型筛选
    if (type) query = query.ilike('type', `%${type}%`);

    // 关键词筛选
    if (keyword) {
      query = query.or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%,location.ilike.%${keyword}%`);
      const geo = await geocodeAddress(keyword);
      if (geo) setCenter(geo);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase Error:', error);
    } else {
      let results = data;

      // 距离筛选（需要中心点）
      if (center && distance[1]) {
        results = results.filter((item) => {
          if (!item.latitude || !item.longitude) return false;
          const d = calcDistance(center.lat, center.lng, item.latitude, item.longitude);
          return d >= distance[0] && d <= distance[1];
        });
      }

      setProperties(results);
    }
  }

  // 地址转经纬度（关键词）
  async function geocodeAddress(address) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
      const json = await res.json();
      if (json.length > 0) {
        return {
          lat: parseFloat(json[0].lat),
          lng: parseFloat(json[0].lon),
        };
      }
    } catch (err) {
      console.error('Geocode failed:', err);
    }
    return null;
  }

  // 计算两点间距离（km）
  function calcDistance(lat1, lng1, lat2, lng2) {
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371; // 地球半径
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  return (
    <>
      <Head><title>搜索房源</title></Head>
      <div className="max-w-5xl mx-auto p-4">
        <FilterPanel filters={filters} setFilters={setFilters} />
        <MapWithMarkers properties={properties} center={center} />
      </div>
    </>
  );
}
