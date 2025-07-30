// components/AddressSearchInput.js
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function AddressSearchInput({ onLocationSelect }) {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!search) return;

    setLoading(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search)}`);
      const data = await response.json();

      if (data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        const address = data[0].display_name;

        if (onLocationSelect) {
          onLocationSelect({ lat, lng, address });
        }
      } else {
        alert('地址未找到');
      }
    } catch (err) {
      console.error(err);
      alert('搜索失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Input
        placeholder="请输入地址"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <Button onClick={handleSearch} disabled={loading}>
        {loading ? '搜索中...' : '搜索'}
      </Button>
    </div>
  );
}

