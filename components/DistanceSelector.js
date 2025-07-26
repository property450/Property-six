// components/DistanceSelector.js
import React from 'react';

const DistanceSelector = ({ distance, setDistance }) => {
  return (
    <div className="mb-4">
      <label className="block mb-1 text-sm font-medium">Search Radius (km)</label>
      <select
        value={distance}
        onChange={(e) => setDistance(Number(e.target.value))}
        className="w-full p-2 border rounded"
      >
        {[1, 3, 5, 10, 20, 30, 50].map((d) => (
          <option key={d} value={d}>
            {d} km
          </option>
        ))}
      </select>
    </div>
  );
};

export default DistanceSelector;
