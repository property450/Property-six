import { useState, useEffect } from 'react';

const typeOptions = {
  Residential: ['Condominium', 'Landed', 'Service Apartment', 'Flat', 'Others'],
  Commercial: ['Shop', 'Office', 'Retail', 'SOHO', 'Others'],
  Industrial: ['Factory', 'Warehouse', 'Others'],
  Land: ['Agricultural', 'Development', 'Residential Land'],
  Others: ['Parking', 'Storage', 'Custom'],
};

export default function TypeSelector({ selectedType, onChange }) {
  const [mainType, setMainType] = useState('');
  const [subType, setSubType] = useState('');
  const [customSubType, setCustomSubType] = useState('');

  useEffect(() => {
    if (mainType && (subType || customSubType)) {
      const selected = subType === 'Custom' || subType === 'Others'
        ? `${mainType} > ${customSubType}`
        : `${mainType} > ${subType}`;
      onChange(selected);
    }
  }, [mainType, subType, customSubType]);

  const handleMainTypeChange = (e) => {
    setMainType(e.target.value);
    setSubType('');
    setCustomSubType('');
  };

  const handleSubTypeChange = (e) => {
    setSubType(e.target.value);
    if (e.target.value !== 'Custom' && e.target.value !== 'Others') {
      setCustomSubType('');
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Main Type</label>
      <select
        value={mainType}
        onChange={handleMainTypeChange}
        className="w-full p-2 border rounded"
      >
        <option value="">Select Main Type</option>
        {Object.keys(typeOptions).map((type) => (
          <option key={type} value={type}>{type}</option>
        ))}
      </select>

      {mainType && (
        <>
          <label className="block text-sm font-medium">Sub Type</label>
          <select
            value={subType}
            onChange={handleSubTypeChange}
            className="w-full p-2 border rounded"
          >
            <option value="">Select Sub Type</option>
            {typeOptions[mainType].map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
            <option value="Custom">Custom</option>
          </select>
        </>
      )}

      {(subType === 'Custom' || subType === 'Others') && (
        <input
          type="text"
          placeholder="Enter custom sub-type"
          value={customSubType}
          onChange={(e) => setCustomSubType(e.target.value)}
          className="w-full p-2 border rounded"
        />
      )}

      {selectedType && (
        <p className="text-sm text-gray-600">Selected: {selectedType}</p>
      )}
    </div>
  );
}
