// components/TypeSelector.js
import { useState } from 'react';

const typeHierarchy = {
  Residential: ['Apartment', 'Condo', 'Terrace', 'Semi-D', 'Bungalow', 'Flat'],
  Commercial: ['Shop', 'Office', 'Retail', 'Mall'],
  Industrial: ['Factory', 'Warehouse', 'Industrial Land'],
  Land: ['Residential Land', 'Commercial Land', 'Agricultural Land'],
  Others: ['Hotel', 'Resort', 'Mixed-use', 'Other'],
};

export default function TypeSelector({ selectedType, setSelectedType }) {
  const [mainType, setMainType] = useState('');
  const [subType, setSubType] = useState('');

  const handleMainTypeChange = (e) => {
    const newMain = e.target.value;
    setMainType(newMain);
    setSubType('');
    setSelectedType(newMain);
  };

  const handleSubTypeChange = (e) => {
    const newSub = e.target.value;
    setSubType(newSub);
    setSelectedType(`${mainType} > ${newSub}`);
  };

  return (
    <div className="mb-4">
      <label className="block mb-1 font-semibold">类型选择：</label>
      <div className="flex gap-2">
        <select value={mainType} onChange={handleMainTypeChange} className="border p-1 rounded w-full">
          <option value="">请选择主类型</option>
          {Object.keys(typeHierarchy).map((main) => (
            <option key={main} value={main}>
              {main}
            </option>
          ))}
        </select>

        {mainType && (
          <select value={subType} onChange={handleSubTypeChange} className="border p-1 rounded w-full">
            <option value="">请选择子类型</option>
            {typeHierarchy[mainType].map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
