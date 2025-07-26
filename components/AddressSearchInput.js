// components/AddressSearchInput.js
import { useState } from 'react';
import { Input } from '@/components/ui/input';

export default function AddressSearchInput({ onLocationSelect }) {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!address) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          address
        )}&format=json&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        onLocationSelect({ lat, lng, address });
      } else {
        alert('Address not found');
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      alert('Failed to fetch location');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2 items-center">
      <Input
        type="text"
        placeholder="Enter address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        className="flex-1"
      />
      <button
        onClick={handleSearch}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {loading ? 'Searching...' : 'Search'}
      </button>
    </div>
  );
}
