// pages/search.js
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '../supabaseClient';
import PriceRangeSelector from '@/components/PriceRangeSelector';
import TypeSelector from '@/components/TypeSelector';

const MapWithMarkers = dynamic(() => import('../components/MapWithMarkersClient'), { ssr: false });

export default function SearchPage() {
  const [address, setAddress] = useState('');
  const [distance, setDistance] = useState(5);
  const [center, setCenter] = useState(null);
  const [properties, setProperties] = useState([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [propertyType, setPropertyType] = useState('');

  const filterProperties = (allProperties, centerPoint) => {
    const lat = centerPoint.lat;
    const lng = centerPoint.lng;

    return allProperties.filter((p) => {
      if (!p.lat || !p.lng) return false;

      const dx = (p.lat - lat) * 111;
      const dy = (p.lng - lng) * 111 * Math.cos((lat * Math.PI) / 180);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > distance) return false;

      if (minPrice && p.price < Number(minPrice)) return false;
      if (maxPrice && p.price > Number(maxPrice)) return false;
      if (propertyType && p.type !== propertyType) return false;

      return true;
    });
  };

  const handleSearch = async () => {
    if (!address) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
      const data = await res.json();
      if (data.length === 0) return alert('地址未找到');

      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      const centerPoint = { lat, lng };
      setCenter(centerPoint);

      const { data: allProperties } = await supabase.from('properties').select('*');
      const filtered = filterProperties(allProperties, centerPoint);
      setProperties(filtered);
    } catch (err) {
      console.error('搜索失败:', err);
    }
  };

  useEffect(() => {
    if (!center) return;
    const update = async () => {
      const { data: allProperties } = await supabase.from('properties').select('*');
      const filtered = filterProperties(allProperties, center);
      setProperties(filtered);
    };
    update();
  }, [distance, minPrice, maxPrice, propertyType]);

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="地址"
          style={{ padding: '6px', width: '200px' }}
        />
        <input
          type="number"
          value={distance}
          onChange={(e) => setDistance(Number(e.target.value))}
          placeholder="距离 (km)"
          style={{ padding: '6px', width: '100px' }}
        />

        <PriceRangeSelector
          minPrice={minPrice}
          setMinPrice={setMinPrice}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
        />

        <div style={{ minWidth: '250px' }}>
          <TypeSelector
            selectedType={propertyType}
            setSelectedType={setPropertyType}
          />
        </div>

        <button onClick={handleSearch} style={{ padding: '6px 12px' }}>
          搜索
        </button>
      </div>

      <MapWithMarkers center={center} radius={distance} properties={properties} />
    </div>
  );
}
