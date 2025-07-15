// components/RangeSelector.js
export default function RangeSelector({ label, min, max, value, onChange }) {
  const [minVal, maxVal] = value;

  const handleMinChange = (e) => {
    onChange([Number(e.target.value), maxVal]);
  };

  const handleMaxChange = (e) => {
    onChange([minVal, Number(e.target.value)]);
  };

  return (
    <div className="mb-4">
      <label className="block font-semibold mb-1">{label}</label>
      <div className="flex space-x-2">
        <input
          type="number"
          value={minVal}
          onChange={handleMinChange}
          className="border p-2 w-full"
          placeholder="最小值"
          min={min}
        />
        <span className="flex items-center">至</span>
        <input
          type="number"
          value={maxVal}
          onChange={handleMaxChange}
          className="border p-2 w-full"
          placeholder="最大值"
          max={max}
        />
      </div>
    </div>
  );
}
