export default function RangeSelector({ label, min, max, value, onChange }) {
  return (
    <div className="space-y-2">
      <label className="block font-medium">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          className="border p-2 w-full"
          value={value[0]}
          onChange={(e) => onChange([Number(e.target.value), value[1]])}
          min={min}
          max={max}
        />
        <span>至</span>
        <input
          type="number"
          className="border p-2 w-full"
          value={value[1]}
          onChange={(e) => onChange([value[0], Number(e.target.value)])}
          min={min}
          max={max}
        />
      </div>
    </div>
  );
}
