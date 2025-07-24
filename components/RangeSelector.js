import { useEffect, useState } from 'react';

export default function RangeSelector({
  label,
  min = 0,
  max = 10000000,
  value = [min, max],
  onChange = () => {},
}) {
  const [minVal, setMinVal] = useState(value[0]);
  const [maxVal, setMaxVal] = useState(value[1]);

  useEffect(() => {
    setMinVal(value[0]);
    setMaxVal(value[1]);
  }, [value]);

  const handleMinChange = (e) => {
    const newMin = Number(e.target.value);
    if (!isNaN(newMin)) {
      setMinVal(newMin);
      onChange([newMin, maxVal]);
    }
  };

  const handleMaxChange = (e) => {
    const newMax = Number(e.target.value);
    if (!isNaN(newMax)) {
      setMaxVal(newMax);
      onChange([minVal, newMax]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block font-medium">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          className="border p-2 w-full"
          value={minVal}
          onChange={handleMinChange}
          min={min}
          max={max}
        />
        <span>至</span>
        <input
          type="number"
          className="border p-2 w-full"
          value={maxVal}
          onChange={handleMaxChange}
          min={min}
          max={max}
        />
      </div>
    </div>
  );
}
