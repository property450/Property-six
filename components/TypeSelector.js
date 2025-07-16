// components/TypeSelector.js
import { useState } from 'react';

const typeOptions = {
  Residential: ['Terrace', 'Semi-Detached', 'Bungalow', 'Apartment', 'Condo', 'Studio'],
  Commercial: ['Shop Lot', 'Office', 'Retail Space', 'SoHo'],
  Industrial: ['Factory', 'Warehouse', 'Industrial Land'],
  Land: ['Residential Land', 'Commercial Land', 'Agricultural Land'],
  Others: ['Parking Lot', 'Storage', 'Other']
};

export default function TypeSelector({ value, onChange }) {
  const [mainCategory, setMainCategory] = useState(
    Object.keys(typeOptions).find((cat) =>
      typeOptions[cat].some((sub) => value === `${cat} > ${sub}`)
    ) || ''
  );
  const [subCategory, setSubCategory] = useState(
    value?.split(' > ')[1] || ''
  );

  const handleMainChange = (e) => {
    const newMain = e.target.value;
    setMainCategory(newMain);
    setSubCategory('');
    onChange(newMain); // 暂时设为主类
  };

  const handleSubChange = (e) => {
    const newSub = e.target.value;
    setSubCategory(newSub);
    onChange(`${mainCategory} > ${newSub}`);
  };

  return (
    <div className="space-y-2">
      <label className="block font-semibold">房产类型</label>
      <select
        value={mainCategory}
        onChange={handleMainChange}
        className="border p-2 w-full"
        required
      >
        <option value="">请选择主类别</option>
        {Object.keys(typeOptions).map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>

      {mainCategory && (
        <select
          value={subCategory}
          onChange={handleSubChange}
          className="border p-2 w-full"
          required
        >
          <option value="">请选择子类别</option>
          {typeOptions[mainCategory].map((sub) => (
            <option key={sub} value={sub}>
              {sub}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
