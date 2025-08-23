import { useState, useRef, useEffect } from "react";

export default function PriceInput({ value, onChange, mode = "single", area }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  // 区间模式时临时对象 {min,max}
  const val = typeof value === "object" ? value : { min: "", max: "" };

  const predefinedPrices = [
    50000, 100000, 200000, 300000, 500000,
    800000, 1000000, 1500000, 2000000,
    3000000, 5000000, 10000000, 20000000,
    50000000, 100000000,
  ];

  const handleInputChange = (e, key = "single") => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    if (mode === "range") {
      onChange({ ...val, [key]: raw });
    } else {
      onChange(raw);
    }
  };

  const handleSelect = (price) => {
    onChange(price.toString());
    setShowDropdown(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 单价计算仅在 single 模式显示
  const perSqft =
    mode === "single" && area && value
      ? (parseFloat(value) / parseFloat(area)).toFixed(2)
      : null;

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <label className="block text-sm font-medium text-gray-700">价格</label>

      {mode === "single" ? (
        <>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">RM</span>
            <input
              type="text"
              value={(value ?? "").toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              onChange={(e) => handleInputChange(e)}
              onFocus={() => setShowDropdown(true)}
              className="pl-12 pr-4 py-2 border rounded w-full"
              placeholder="请输入价格"
            />
          </div>

          {perSqft && (
            <p className="text-sm text-gray-500 mt-1">
              每平方英尺: RM {parseFloat(perSqft).toLocaleString()}
            </p>
          )}

          {showDropdown && (
            <ul className="absolute z-10 w-full bg-white border mt-1 max-h-60 overflow-y-auto rounded shadow">
              {predefinedPrices.map((p) => (
                <li
                  key={p}
                  onClick={() => handleSelect(p)}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  RM {p.toLocaleString()}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        // Range 模式：Min / Max 两个输入框
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Min RM</span>
            <input
              type="text"
              value={(val.min ?? "").toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              onChange={(e) => handleInputChange(e, "min")}
              className="pl-16 pr-4 py-2 border rounded w-full"
              placeholder="最低价格"
            />
          </div>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Max RM</span>
            <input
              type="text"
              value={(val.max ?? "").toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              onChange={(e) => handleInputChange(e, "max")}
              className="pl-16 pr-4 py-2 border rounded w-full"
              placeholder="最高价格"
            />
          </div>
        </div>
      )}
    </div>
  );
}
