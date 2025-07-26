import { useEffect, useState } from 'react';

const typeOptions = {
  Residential: ['Apartment', 'Condo', 'Terrace', 'Bungalow', 'Studio'],
  Commercial: ['Shop Lot', 'Office', 'Retail', 'Hotel'],
  Industrial: ['Factory', 'Warehouse', 'Plant'],
  Land: ['Agricultural', 'Development Land'],
  Others: ['Parking', 'Storage', 'Other'],
};

export default function TypeSelector({ selectedType, setSelectedType }) {
  const [mainType, setMainType] = useState('');
  const [subType, setSubType] = useState('');
  const [customSubType, setCustomSubType] = useState('');

  useEffect(() => {
    if (mainType && (subType || customSubType)) {
      setSelectedType(`${mainType} > ${customSubType || subType}`);
    }
  }, [mainType, subType, customSubType]);

  return (
    <div className="space-y-2">
      <label>房产类型</label>
      <select
        value={mainType}
        onChange={(e) => {
          setMainType(e.target.value);
          setSubType('');
          setCustomSubType('');
        }}
        className="w-full border p-2 rounded"
      >
        <option value="">选择主类型</option>
        {Object.keys(typeOptions).map((main) => (
          <option key={main} value={main}>{main}</option>
        ))}
      </select>

      {mainType && (
        <>
          <select
            value={subType}
            onChange={(e) => {
              setSubType(e.target.value);
              setCustomSubType('');
            }}
            className="w-full border p-2 rounded"
          >
            <option value="">选择子类型</option>
            {typeOptions[mainType].map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="自定义子类型（可选）"
            value={customSubType}
            onChange={(e) => setCustomSubType(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </>
      )}
    </div>
  );
}
