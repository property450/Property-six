// ✅ TypeSelector.js
import { useState, useEffect } from 'react';

const TYPE_OPTIONS = {
  Residential: ['Apartment', 'Condo', 'Terrace', 'Semi-D'],
  Commercial: ['Shoplot', 'Office', 'Retail'],
  Industrial: ['Factory', 'Warehouse'],
  Land: ['Agricultural', 'Development'],
  Others: ['Other']
};

export default function TypeSelector({ selectedType, setSelectedType }) {
  const [mainType, setMainType] = useState('');
  const [subType, setSubType] = useState('');

  useEffect(() => {
    if (mainType && subType) {
      setSelectedType(`${mainType} > ${subType}`);
    }
  }, [mainType, subType]);

  return (
    <div className="flex gap-2">
      <select
        className="border p-1 rounded"
        value={mainType}
        onChange={(e) => {
          setMainType(e.target.value);
          setSubType('');
        }}>
        <option value="">Select Main Type</option>
        {Object.keys(TYPE_OPTIONS).map((type) => (
          <option key={type} value={type}>{type}</option>
        ))}
      </select>
      <select
        className="border p-1 rounded"
        value={subType}
        onChange={(e) => setSubType(e.target.value)}
        disabled={!mainType}>
        <option value="">Select Sub Type</option>
        {mainType && TYPE_OPTIONS[mainType].map((sub) => (
          <option key={sub} value={sub}>{sub}</option>
        ))}
      </select>
    </div>
  );
}
