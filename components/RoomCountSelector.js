export default function RoomCountSelector({ label, value, onChange }) {
  const options = [0, 1, 2, 3, 4, 5, 6];

  return (
    <div className="space-y-2">
      <label>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border p-2 rounded"
      >
        <option value="">选择数量</option>
        {options.map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
        <option value="custom">自定义</option>
      </select>
      {value === 'custom' && (
        <input
          type="number"
          placeholder="请输入数量"
          onChange={(e) => onChange(e.target.value)}
          className="w-full border p-2 rounded"
        />
      )}
    </div>
  );
}
