// components/PriceInput.js
import { useState, useRef, useEffect } from "react";

export default function PriceInput({ value, onChange, area, type }) {
  const wrapperRef = useRef(null);

  const predefinedPrices = [
    50000, 100000, 200000, 300000, 500000,
    800000, 1000000, 1500000, 2000000,
    3000000, 5000000, 10000000, 20000000,
    50000000, 100000000,
  ];

  // 判断是否为“项目/新楼盘”模式（TypeSelector 把整个 form 对象传回时使用 propertyStatus）
  let propertyStatus = "";
  if (typeof type === "object" && type !== null) {
    propertyStatus = type.propertyStatus || type.finalType || "";
  } else if (typeof type === "string") {
    propertyStatus = type;
  }
  // ✅ 新的判断逻辑：只要包含 "New Project" 或 "Developer Unit" 就切换区间模式
const isRange = !!(
  propertyStatus &&
  (
    propertyStatus.includes("New Project") ||
    propertyStatus.includes("Developer Unit")
  )
);
  // 本地状态（单价 / min / max）
  const [single, setSingle] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");

  // 下拉开关（分开管理，点击外部时一并关闭）
  const [showDropdownSingle, setShowDropdownSingle] = useState(false);
  const [showDropdownMin, setShowDropdownMin] = useState(false);
  const [showDropdownMax, setShowDropdownMax] = useState(false);

  // 同步外部 value 到本地（支持三种情况：单字符串、"min-max" 字符串、或外部传 object）
  useEffect(() => {
    if (isRange) {
      if (typeof value === "string" && value.includes("-")) {
        const [vmin, vmax] = value.split("-");
        setMin(vmin ?? "");
        setMax(vmax ?? "");
      } else if (value && typeof value === "object") {
        setMin(value.min ?? "");
        setMax(value.max ?? "");
      } else {
        setMin("");
        setMax("");
      }
    } else {
      if (typeof value === "string" && !value.includes("-")) {
        setSingle(String(value).replace(/,/g, ""));
      } else if (typeof value === "number") {
        setSingle(String(value));
      } else {
        setSingle("");
      }
    }
  }, [value, isRange]);

  // 点击外部关闭下拉
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdownSingle(false);
        setShowDropdownMin(false);
        setShowDropdownMax(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 格式化显示千分位
  const formatDisplay = (val) => {
    if (val === "" || val === null || val === undefined) return "";
    const n = Number(String(val).replace(/,/g, ""));
    if (Number.isNaN(n)) return "";
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // 单价模式 handlers
  const handleSingleChange = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    setSingle(raw);
    onChange(raw); // 把纯数字字符串回传给父组件（与原来行为保持一致）
  };
  const handleSelectSingle = (p) => {
    setSingle(String(p));
    onChange(String(p));
    setShowDropdownSingle(false);
  };

  // 区间模式 handlers（回传格式： "min-max" 字符串）
  const handleMinChange = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    setMin(raw);
    onChange(`${raw}-${max}`); // 每次变化都把组合字符串回传
  };
  const handleMaxChange = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    setMax(raw);
    onChange(`${min}-${raw}`);
  };
  const handleSelectMin = (p) => {
    setMin(String(p));
    onChange(`${p}-${max}`);
    setShowDropdownMin(false);
  };
  const handleSelectMax = (p) => {
    setMax(String(p));
    onChange(`${min}-${p}`);
    setShowDropdownMax(false);
  };

  // 每平方英尺价格（仅单价模式显示）
  const perSqft =
    !isRange && area && single
      ? (Number(String(single).replace(/,/g, "")) / Number(area || 0)).toFixed(2)
      : null;

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <label className="block text-sm font-medium text-gray-700">
  {isRange ? "价格范围" : "价格"}
</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">RM</span>
            <input
              type="text"
              value={formatDisplay(single)}
              onChange={handleSingleChange}
              onFocus={() => setShowDropdownSingle(true)}
              className="pl-12 pr-4 py-2 border rounded w-full"
              placeholder="请输入价格"
            />
          </div>

          {perSqft && (
            <p className="text-sm text-gray-500 mt-1">
              每平方英尺: RM {Number(perSqft).toLocaleString()}
            </p>
          )}

          {showDropdownSingle && (
            <ul className="absolute z-10 w-full bg-white border mt-1 max-h-60 overflow-y-auto rounded shadow">
              {predefinedPrices.map((price) => (
                <li
                  key={price}
                  onClick={() => handleSelectSingle(price)}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  RM {price.toLocaleString()}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">RM</span>
              <input
                type="text"
                value={formatDisplay(min)}
                onChange={handleMinChange}
                onFocus={() => setShowDropdownMin(true)}
                className="pl-12 pr-4 py-2 border rounded w-full"
                placeholder="Min Price"
              />
              {showDropdownMin && (
                <ul className="absolute z-10 w-full bg-white border mt-1 max-h-60 overflow-y-auto rounded shadow">
                  {predefinedPrices.map((price) => (
                    <li
                      key={`min-${price}`}
                      onClick={() => handleSelectMin(price)}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      RM {price.toLocaleString()}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">RM</span>
              <input
                type="text"
                value={formatDisplay(max)}
                onChange={handleMaxChange}
                onFocus={() => setShowDropdownMax(true)}
                className="pl-12 pr-4 py-2 border rounded w-full"
                placeholder="Max Price"
              />
              {showDropdownMax && (
                <ul className="absolute z-10 w-full bg-white border mt-1 max-h-60 overflow-y-auto rounded shadow">
                  {predefinedPrices.map((price) => (
                    <li
                      key={`max-${price}`}
                      onClick={() => handleSelectMax(price)}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      RM {price.toLocaleString()}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
