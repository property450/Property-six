// pages/index.js
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import PropertyCard from '../components/PropertyCard';
import FilterPanel from '../components/FilterPanel';

export default function Home() {
  const [properties, setProperties] = useState([]);
  const [filters, setFilters] = useState({
    keyword: '',
    minPrice: '',
    maxPrice: '',
    minDistance: '',
    maxDistance: ''
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    const { data, error } = await supabase.from('properties').select('*');
    if (!error) {
      setProperties(data);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">🏡 Recommended Properties</h1>

      <FilterPanel
        filters={filters}
        setFilters={setFilters}
        setProperties={setProperties}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    </div>
  );
}
