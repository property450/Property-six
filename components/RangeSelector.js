export default function RangeSelector({
  label,
  min = 0,
  max = 10000000,
  value = [min, max],
  onChange = () => {},
}) {
  const [minVal, maxVal] = Array.isArray(value) ? value : [min, max];

  const handleMinChange = (e) => {
    const newMin = Number(e.target.value);
    if (!isNaN(newMin)) {
      onChange([newMin, maxVal]);
    }
  };

  const handleMaxChange = (e) => {
    const newMax = Number(e.target.value);
    if (!isNaN(newMax)) {
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
