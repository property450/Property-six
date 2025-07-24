// pages/search.js
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import PropertyCard from '@/components/PropertyCard';
import FilterPanel from '@/components/FilterPanel';
import { Loader2 } from 'lucide-react';

export default function SearchPage() {
  const [properties, setProperties] = useState([]);
  const [filters, setFilters] = useState({
    keyword: '',
    priceRange: [0, 1000000],
    distance: 5, // km
    centerLat: null,
    centerLng: null,
  });
  const [loading, setLoading] = useState(false);
  const [noResult, setNoResult] = useState(false);

  const fetchProperties = async () => {
    setLoading(true);
    setNoResult(false);

    const { data, error } = await supabase.from('properties').select('*');
    if (error) {
      console.error('Error fetching properties:', error);
      setLoading(false);
      return;
    }

    const keywordLower = filters.keyword.toLowerCase();

    const filtered = data.filter((property) => {
      const matchesKeyword =
        !filters.keyword ||
        property.title?.toLowerCase().includes(keywordLower) ||
        property.description?.toLowerCase().includes(keywordLower) ||
        property.address?.toLowerCase().includes(keywordLower);

      const matchesPrice =
        property.price >= filters.priceRange[0] &&
        property.price <= filters.priceRange[1];

      const matchesDistance = !filters.centerLat || !filters.centerLng
        ? true
        : getDistanceFromLatLonInKm(
            filters.centerLat,
            filters.centerLng,
            property.latitude,
            property.longitude
          ) <= filters.distance;

      return matchesKeyword && matchesPrice && matchesDistance;
    });

    setProperties(filtered);
    setNoResult(filtered.length === 0);
    setLoading(false);
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">🔍 Search Properties</h1>

      <FilterPanel
        filters={filters}
        setFilters={setFilters}
        onSearch={fetchProperties}
      />

      {loading ? (
        <div className="flex justify-center items-center mt-8 text-gray-500">
          <Loader2 className="animate-spin mr-2" />
          Loading properties...
        </div>
      ) : noResult ? (
        <p className="text-center mt-6 text-gray-500">No properties found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}

// ✅ 地理距离函数（单位：公里）
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
