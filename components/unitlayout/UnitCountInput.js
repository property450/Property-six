// components/unitlayout/UnitCountInput.js
"use client";

function formatNumber(num) {
  if (num === "" || num === undefined || num === null) return "";
  const str = String(num).replace(/,/g, "");
  if (str === "") return "";
  return Number(str).toLocaleString();
}
function parseNumber(str) {
  return String(str || "").replace(/,/g, "");
}

export default function UnitCountInput({
  unitCountRef,
  unitCountLocal,
  setUnitCountLocal,
  unitDropdownOpen,
  setUnitDropdownOpen,
  onCommit,
}) {
  return (
    <div className="mb-3" ref={unitCountRef}>
      <label className="block font-medium mb-1">这个房型有多少个单位？</label>
      <div className="relative">
        <input
          type="text"
          placeholder="例如：120"
          value={formatNumber(unitCountLocal)}
          onChange={(e) => {
            const raw = parseNumber(e.target.value);
            if (!/^\d*$/.test(raw)) return;
            setUnitCountLocal(raw);
            onCommit(raw);
          }}
          onFocus={() => setUnitDropdownOpen(true)}
          onClick={() => setUnitDropdownOpen(true)}
          className="border p-2 rounded w-full"
        />

        {unitDropdownOpen && (
          <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-auto">
            <li className="px-3 py-2 text-gray-500 cursor-default select-none border-b">
              从 1 ~ 1,000 中选择，或直接输入
            </li>
            {Array.from({ length: 1000 }, (_, i) => i + 1).map((num) => (
              <li
                key={num}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                onMouseDown={(e) => {
                  e.preventDefault();
                  const val = String(num);
                  setUnitCountLocal(val);
                  onCommit(val);
                  setUnitDropdownOpen(false);
                }}
              >
                {num.toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
