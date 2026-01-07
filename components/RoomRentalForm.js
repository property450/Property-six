// components/RoomRentalForm.js
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// ✅ 只保留 1 个面积选择器 + 租金输入
import AreaSelector from "@/components/AreaSelector";
import PriceInput from "@/components/PriceInput";

// ----------------- 工具：数字格式化 -----------------
const formatNumber = (num) => {
  if (num === "" || num === undefined || num === null) return "";
  const str = String(num).replace(/,/g, "");
  if (str === "") return "";
  const n = Number(str);
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString();
};
const parseNumber = (str) => String(str || "").replace(/,/g, "");

// ----------------- 选项 -----------------
const ROOM_TYPE_OPTIONS = ["大房", "中房", "单人房"];
const BATHROOM_OPTIONS = ["独立卫生间", "共用卫生间"];
const ROOM_PRIVACY_OPTIONS = ["独立房间", "共用房间"];
const GENDER_OPTIONS = ["男女混住", "只限女生", "只限男生"];
const YESNO_OPTIONS = [
  { value: "allow", label: "允许" },
  { value: "deny", label: "不允许" },
];

const BED_TYPE_OPTIONS = [
  "King Size",
  "Queen Size",
  "Super Single Size",
  "Single Size",
  "上下床",
  "没有提供床",
];

const RENT_INCLUDES_OPTIONS = [
  "包括电费",
  "包括水费",
  "包括沥水机",
  "包括管理费",
  "包括电费但冷气/空调费不包",
];

const CLEANING_OPTIONS = [
  "每月一次",
  "每两星期一次",
  "每三星期一次",
  "每个星期一次",
  "没有清洁服务",
];

const CARPARK_OPTIONS = ["1", "2", "3", "4", "5", "公共停车位", "没有车位", "车位另租"];
const CARPARK_RENT_PRICE_PRESETS = ["50", "100", "150", "200"];

const RACE_OPTIONS = ["马来人", "印度人", "华人", "外国人"];
const TENANCY_OPTIONS = ["1个月", "3个月", "6个月", "一年以下", "一年以上"];

// ----------------- 默认值 -----------------
const defaultValue = {
  // ✅ 面积只保留一个
  area: null,

  // ✅ Rent 模式：租金（不叫价格）
  rent: "",

  roomType: "",
  bathroomType: "",
  bedTypes: [
    // { type: "Queen Size", count: "1" }
  ],
  roomPrivacy: "",
  genderPolicy: "",
  petAllowed: "deny",
  cookingAllowed: "deny",
  rentIncludes: [],
  cleaningService: "",
  carparkCount: "",
  carparkRentPrice: "",
  preferredRaces: [],
  acceptedTenancy: [],
  availableFrom: "",
};

// ----------------- 多选下拉（✅ + 点击空白收起） -----------------
function MultiPick({ label, options, value = [], onChange }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const toggle = (opt) => {
    const exists = value.includes(opt);
    const next = exists ? value.filter((x) => x !== opt) : [...value, opt];
    onChange?.(next);
  };

  return (
    <div className="space-y-1" ref={boxRef}>
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      <div
        className="w-full border rounded p-2 bg-white cursor-pointer"
        onClick={() => setOpen((p) => !p)}
      >
        {value.length === 0 ? (
          <span className="text-gray-400">点击选择（可多选）</span>
        ) : (
          <span className="font-medium">{value.map((v) => `${v} ✅`).join("，")}</span>
        )}
      </div>

      {open && (
        <div className="border rounded bg-white shadow max-h-60 overflow-auto">
          {options.map((opt) => {
            const selected = value.includes(opt);
            return (
              <div
                key={opt}
                className={`px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-gray-100 ${
                  selected ? "bg-gray-50 font-semibold" : ""
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  toggle(opt);
                }}
              >
                <span>{opt}</span>
                {selected && <span className="text-green-600">✅</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ----------------- 床型：多选 + 数量 -----------------
function BedTypePicker({ value = [], onChange }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const hasType = (t) => value.some((x) => x.type === t);
  const isNoBedSelected = hasType("没有提供床");

  const toggleType = (t) => {
    if (t === "没有提供床") {
      const next = isNoBedSelected ? [] : [{ type: "没有提供床", count: "" }];
      onChange?.(next);
      setOpen(false);
      return;
    }

    const base = isNoBedSelected ? value.filter((x) => x.type !== "没有提供床") : value;

    const exists = base.some((x) => x.type === t);
    const next = exists ? base.filter((x) => x.type !== t) : [...base, { type: t, count: "" }];
    onChange?.(next);
  };

  const setCount = (t, count) => {
    const next = value.map((x) => (x.type === t ? { ...x, count } : x));
    onChange?.(next);
  };

  const [openKey, setOpenKey] = useState(null);
  const refs = useRef({});

  useEffect(() => {
    const onDoc = (e) => {
      const anyHit = Object.values(refs.current).some((el) => el && el.contains(e.target));
      if (!anyHit) setOpenKey(null);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const quantityOptions = [0, 1, 2, 3, 4, 5, 6, "custom"];

  const pickCount = (t, opt) => {
    if (opt === "custom") {
      setCount(t, "");
      setOpenKey(null);
      return;
    }
    setCount(t, String(opt));
    setOpenKey(null);
  };

  const displayText =
    value.length === 0 ? "请选择床型（可多选）" : value.map((v) => `${v.type} ✅`).join("，");

  return (
    <div className="space-y-2" ref={boxRef}>
      <label className="block text-sm font-medium text-gray-700">
        请选择床型（可多选 + 数量）
      </label>

      <div
        className="w-full border rounded p-2 bg-white cursor-pointer"
        onClick={() => setOpen((p) => !p)}
      >
        {value.length === 0 ? (
          <span className="text-gray-400">{displayText}</span>
        ) : (
          <span className="font-medium">{displayText}</span>
        )}
      </div>

      {open && (
        <div className="border rounded bg-white shadow max-h-60 overflow-auto">
          {BED_TYPE_OPTIONS.map((t) => {
            const selected = hasType(t);
            const disabled = isNoBedSelected && t !== "没有提供床";
            return (
              <div
                key={t}
                className={`px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-gray-100 ${
                  selected ? "bg-gray-50 font-semibold" : ""
                } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  toggleType(t);
                }}
              >
                <span>{t}</span>
                {selected && <span className="text-green-600">✅</span>}
              </div>
            );
          })}
        </div>
      )}

      {!isNoBedSelected && value.length > 0 && (
        <div className="space-y-3">
          {value.map((item) => {
            const display = /^\d+$/.test(String(item.count || ""))
              ? formatNumber(item.count)
              : item.count || "";

            return (
              <div
                key={item.type}
                ref={(el) => (refs.current[item.type] = el)}
                className="flex items-center gap-3 border p-3 rounded bg-gray-50"
              >
                <span className="font-medium">{item.type}</span>

                <div className="relative w-40">
                  <input
                    type="text"
                    className="w-full border rounded px-2 py-1 bg-white"
                    placeholder="输入或选择数量"
                    value={display}
                    onChange={(e) => {
                      const raw = parseNumber(e.target.value);
                      if (!/^\d*$/.test(raw)) return;
                      if (raw.length > 7) return;
                      setCount(item.type, raw);
                    }}
                    onFocus={() => setOpenKey(item.type)}
                    onClick={() => setOpenKey(item.type)}
                  />

                  {openKey === item.type && (
                    <ul className="absolute z-20 mt-1 w-full bg-white border rounded shadow max-h-60 overflow-auto">
                      {quantityOptions.map((opt) => (
                        <li
                          key={String(opt)}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            pickCount(item.type, opt);
                          }}
                        >
                          {opt === "custom" ? "自定义" : String(opt)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ----------------- 主表单 -----------------
export default function RoomRentalForm({ value, onChange, extraSection = null }) {
  // ✅ 受控：内部只做一层镜像
  const data = useMemo(() => ({ ...defaultValue, ...(value || {}) }), [value]);

  // ✅ 兼容旧字段（如果你之前已经存过 builtUpArea/landArea/price，不让用户数据丢）
  // - area: 优先用 data.area，没有就用 builtUpArea / landArea
  // - rent: 优先用 data.rent，没有就用 price
  const normalizedArea = data.area ?? data.builtUpArea ?? data.landArea ?? null;
  const normalizedRent = data.rent ?? data.price ?? "";

  const patch = (p) => {
    const next = { ...data, ...p };
    onChange?.(next);
  };

  const availableText = data.availableFrom ? `在 ${data.availableFrom} 就可以开始入住了` : "";
  const showCarparkRentPrice = data.carparkCount === "车位另租";

  return (
    <div className="space-y-4 mt-4 border rounded-lg p-4 bg-white">
      {/* ✅ 面积（只要一个） */}
      <div>
        <label className="block text-sm font-medium text-gray-700">面积</label>
        <AreaSelector
          value={normalizedArea}
          onChange={(val) => {
            // ✅ 统一写到 area，旧字段不再用（但上面仍兼容读取）
            patch({ area: val });
          }}
        />
      </div>

      {/* ✅ 租金（不叫价格） */}
      <div>
        <label className="block text-sm font-medium text-gray-700">租金</label>
        <PriceInput
          value={normalizedRent}
          onChange={(val) => {
            // ✅ 统一写到 rent，兼容旧 price
            patch({ rent: val });
          }}
        />
      </div>

      {/* 这是什么房？ */}
      <div>
        <label className="block text-sm font-medium text-gray-700">这是什么房？</label>
        <select
          className="border rounded w-full p-2"
          value={data.roomType}
          onChange={(e) => patch({ roomType: e.target.value })}
        >
          <option value="">请选择</option>
          {ROOM_TYPE_OPTIONS.map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>
      </div>

      {/* 卫生间 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">卫生间</label>
        <select
          className="border rounded w-full p-2"
          value={data.bathroomType}
          onChange={(e) => patch({ bathroomType: e.target.value })}
        >
          <option value="">请选择</option>
          {BATHROOM_OPTIONS.map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>
      </div>

      {/* 床型（多选+数量） */}
      <BedTypePicker value={data.bedTypes} onChange={(bedTypes) => patch({ bedTypes })} />

      {/* 独立/共用 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">是独立房间还是共用房间？</label>
        <select
          className="border rounded w-full p-2"
          value={data.roomPrivacy}
          onChange={(e) => patch({ roomPrivacy: e.target.value })}
        >
          <option value="">请选择</option>
          {ROOM_PRIVACY_OPTIONS.map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>
      </div>

      {/* 男女混住 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">是否男女混住？</label>
        <select
          className="border rounded w-full p-2"
          value={data.genderPolicy}
          onChange={(e) => patch({ genderPolicy: e.target.value })}
        >
          <option value="">请选择</option>
          {GENDER_OPTIONS.map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>
      </div>

      {/* 宠物 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">是否允许宠物？</label>
        <select
          className="border rounded w-full p-2"
          value={data.petAllowed}
          onChange={(e) => patch({ petAllowed: e.target.value })}
        >
          {YESNO_OPTIONS.map((x) => (
            <option key={x.value} value={x.value}>
              {x.label}
            </option>
          ))}
        </select>
      </div>

      {/* 允许烹饪 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">是否允许烹饪？</label>
        <select
          className="border rounded w-full p-2"
          value={data.cookingAllowed}
          onChange={(e) => patch({ cookingAllowed: e.target.value })}
        >
          {YESNO_OPTIONS.map((x) => (
            <option key={x.value} value={x.value}>
              {x.label}
            </option>
          ))}
        </select>
      </div>

      {/* 租金包括（多选） */}
      <MultiPick
        label="租金包括"
        options={RENT_INCLUDES_OPTIONS}
        value={data.rentIncludes}
        onChange={(rentIncludes) => patch({ rentIncludes })}
      />

      {/* 清洁服务 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">清洁服务</label>
        <select
          className="border rounded w-full p-2"
          value={data.cleaningService}
          onChange={(e) => patch({ cleaningService: e.target.value })}
        >
          <option value="">请选择</option>
          {CLEANING_OPTIONS.map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>
      </div>

      {/* 车位 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">包括几个车位？</label>
        <select
          className="border rounded w-full p-2"
          value={data.carparkCount}
          onChange={(e) => {
            const v = e.target.value;
            patch({
              carparkCount: v,
              carparkRentPrice: v === "车位另租" ? data.carparkRentPrice : "",
            });
          }}
        >
          <option value="">请选择</option>
          {CARPARK_OPTIONS.map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>
      </div>

      {/* 车位另租价格 */}
      {showCarparkRentPrice && (
        <div>
          <label className="block text-sm font-medium text-gray-700">一个车位大概多少钱？</label>

          <select
            className="border rounded w-full p-2 mb-2"
            value={data.carparkRentPrice || ""}
            onChange={(e) => patch({ carparkRentPrice: e.target.value })}
          >
            <option value="">请选择</option>
            {CARPARK_RENT_PRICE_PRESETS.map((x) => (
              <option key={x} value={x}>
                {formatNumber(x)}
              </option>
            ))}
          </select>

          <input
            type="text"
            className="border rounded w-full p-2"
            placeholder="也可以手动输入（会自动加千分位）"
            value={formatNumber(data.carparkRentPrice)}
            onChange={(e) => {
              const raw = parseNumber(e.target.value);
              if (!/^\d*$/.test(raw)) return;
              if (raw.length > 9) return;
              patch({ carparkRentPrice: raw });
            }}
          />
        </div>
      )}

      {/* 偏向种族（多选） */}
      <MultiPick
        label="偏向的种族"
        options={RACE_OPTIONS}
        value={data.preferredRaces}
        onChange={(preferredRaces) => patch({ preferredRaces })}
      />

      {/* 你要放在这里的四个输入框（额外空间/家私/设施/步行到交通） */}
      {extraSection}

      {/* 接受租期（多选） */}
      <MultiPick
        label="接受的租期"
        options={TENANCY_OPTIONS}
        value={data.acceptedTenancy}
        onChange={(acceptedTenancy) => patch({ acceptedTenancy })}
      />

      {/* 入住日期 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">几时开始可以入住？</label>
        <input
          type="date"
          className="border rounded w-full p-2"
          value={data.availableFrom}
          onChange={(e) => patch({ availableFrom: e.target.value })}
        />
        {availableText && <p className="text-sm text-gray-600 mt-1">{availableText}</p>}
      </div>
    </div>
  );
}
