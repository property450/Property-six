// components/DistanceSelector.js
import React from "react";

export default function DistanceSelector({ distance, setDistance }) {
  return (
    <div className="mb-4">
      <label htmlFor="distance" className="block text-sm font-medium text-gray-700">
        Search Radius (km)
      </label>
      <select
        id="distance"
        value={distance}
        onChange={(e) => setDistance(Number(e.target.value))}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
      >
        {[1, 2, 3, 5, 10, 15, 20, 30, 50].map((d) => (
          <option key={d} value={d}>
            {d} km
          </option>
        ))}
      </select>
    </div>
  );
}
