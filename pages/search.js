import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '../supabaseClient';

const MapWithMarkers = dynamic(() => import('../components/MapWithMarkersClient'), {
  ssr: false,
});

export default function SearchPage() {
  const [address, setAddress] = useState('');
  const [distance, setDistance] = useState(5);
  const [center, setCenter] = useState(null);
  const [properties, setProperties] = useState([]);

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

      const within = allProperties.filter((p) => {
        if (!p.lat || !p.lng) return false;
        const dx = (p.lat - lat) * 111;
        const dy = (p.lng - lng) * 111 * Math.cos((lat * Math.PI) / 180);
        return Math.sqrt(dx * dx + dy * dy) <= distance;
      });

      setProperties(within);
    } catch (error) {
      console.error('搜索失败:', error);
      alert('搜索失败，请检查网络或 Supabase 设置');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '10px' }}>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="请输入地址"
          style={{ padding: '6px', marginRight: '10px', width: '300px' }}
        />
        <input
          type="number"
          value={distance}
          onChange={(e) => setDistance(Number(e.target.value))}
          placeholder="距离(km)"
          style={{ padding: '6px', marginRight: '10px', width: '100px' }}
        />
        <button onClick={handleSearch} style={{ padding: '6px 12px' }}>搜索</button>
      </div>
      <MapWithMarkers center={center} radius={distance} properties={properties} />
    </div>
  );
}
