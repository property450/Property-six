import { useState, useEffect } from 'react';

const typeOptions = {
  Residential: {
    'Bungalow / Villa': [
      'Bungalow',
      'Link Bungalow',
      'Twin Villa',
      'Zero-Lot Bungalow',
      'Bungalow land',
    ],
    'Apartment / Condo / Service Residence': [
      'Apartment',
      'Condominium',
      'Flat',
      'Service Residence',
    ],
    'Semi-Detached House': ['Cluster House', 'Semi-Detached House'],
    'Terrace / Link House': [
      '1-storey Terraced House',
      '1.5-storey Terraced House',
      '2-storey Terraced House',
      '2.5-storey Terraced House',
      '3-storey Terraced House',
      '3.5-storey Terraced House',
      '4-storey Terraced House',
      '4.5-storey Terraced House',
      'Terraced House',
      'Townhouse',
    ],
    'Residential Land': null,
  },
  Commercial: {
    'Commercial Property': [
      'Commercial Land',
      'Hotel / Resort',
      'Office',
      'Retail Office',
      'Retail Space',
      'Shop',
      'Shop / Office',
      'Sofo',
      'Soho',
      'Sovo',
      'Commercial Bungalow',
      'Commercial Semi-Detached House',
    ],
    'Industrial Property': [
      'Factory',
      'Cluster Factory',
      'Semi-D Factory',
      'Detached Factory',
      'Terrace Factory',
      'Industrial Land',
      'Warehouse',
    ],
    'Agricultural Land': null,
  },
};

export default function TypeSelector({ value, onChange }) {
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [finalType, setFinalType] = useState('');

  // 初始化时设置
  useEffect(() => {
    if (value) setFinalType(value);
  }, [value]);

  useEffect(() => {
    if (!typeOptions[category]?.[subCategory]) {
      const result = subCategory || category;
      setFinalType(result);
      onChange(result);
    }
  }, [category, subCategory]);

  const handleFinalTypeSelect = (type) => {
    setFinalType(type);
    onChange(type);
  };

  return (
    <div className="space-y-2">
      <label className="block font-medium">房产类型</label>

      {/* 第一层：Residential / Commercial */}
      <select
        className="w-full border rounded p-2"
        value={category}
        onChange={(e) => {
          setCategory(e.target.value);
          setSubCategory('');
          setFinalType('');
          onChange('');
        }}
      >
        <option value="">请选择大类</option>
        {Object.keys(typeOptions).map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>

      {/* 第二层：子类 */}
      {category && (
        <select
          className="w-full border rounded p-2"
          value={subCategory}
          onChange={(e) => {
            setSubCategory(e.target.value);
            setFinalType('');
            onChange('');
          }}
        >
          <option value="">请选择子类</option>
          {Object.keys(typeOptions[category]).map((sub) => (
            <option key={sub} value={sub}>
              {sub}
            </option>
          ))}
        </select>
      )}

      {/* 第三层：最终细项 */}
      {category && subCategory && typeOptions[category][subCategory] && (
        <select
          className="w-full border rounded p-2"
          value={finalType}
          onChange={(e) => handleFinalTypeSelect(e.target.value)}
        >
          <option value="">请选择具体类型</option>
          {typeOptions[category][subCategory].map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
