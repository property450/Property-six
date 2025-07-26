import React from 'react';
import { Input } from '@/components/ui/input';

export default function DistanceSelector({ distance, setDistance }) {
  return (
    <div className="mb-4">
      <label className="block mb-1 font-medium text-sm">Search Radius (km)</label>
      <Input
        type="number"
        value={distance}
        min={1}
        max={100}
        step={1}
        onChange={(e) => setDistance(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}
