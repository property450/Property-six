import React from 'react';
import { Input } from '@/components/ui/input';

export default function AmenitiesInput({ value, onChange }) {
  return (
    <div className="mb-4">
      <label className="block font-medium mb-1">设施 / 配套</label>
      <Input
        placeholder="如泳池、电梯等"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
