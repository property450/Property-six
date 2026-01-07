// components/RoomRentalForm.js
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AreaSelector from "@/components/AreaSelector";

// ----------------- 工具：数字格式化 -----------------
const formatNumber = (num) => {
  if (num === "" || num === undefined || num === null) return "";
  const str = String(num).replace(/,/g, "");
  if (str === "") return "";
  const n = Number(str);
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString();
};

const parseDigits = (str) => String(str || "").replace(/[^\d]/g, "");

// ✅ 价格/租金 -> number
const parseMoneyToNumber = (v) => {
  if (v === undefined || v === null) return 0;
  const raw = String(v)
    .replace(/rm/gi, "")
    .replace(/[^\d.]/g, "")
    .trim();
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
};

// ✅ 从 AreaSelector 的 value 取 sqft（重点：Land 也能算 PSF）
// 兼容你 upload-property.js 里 areaData 结构：
// { types:["buildUp","land"], units:{buildUp:"Square Feet (sqft)"}, values:{buildUp:"", land:""} }
const getAreaSqft = (areaVal) => {
  if (!areaVal) return 0;

  // 直接是数字/字符串
  if (typeof areaVal === "number") return areaVal > 0 ? areaVal : 0;
  if (typeof areaVal === "string") {
    const n = Number(areaVal.replace(/,/g, "").trim());
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  if (areaVal && typeof areaVal === "object") {
    const values = areaVal.values || {};
    const units = areaVal.units || {};
    const types = Array.isArray(areaVal.types) ? areaVal.types : [];

    // 可能出现：types 永远同时有 buildUp+land，但 buildUp 没填、land 有填
    // ✅ 修复策略：优先使用“被勾选且有值”的那一个
    const buRaw = String(values.buildUp || values.builtUp || "").replace(/,/g, "").trim();
    const landRaw = String(values.land || "").replace(/,/g, "").trim();

    const buNum = Number(buRaw);
    const landNum = Number(landRaw);

    const hasBuildUp = types.includes("buildUp") || types.includes("builtUp");
    const hasLand = types.includes("land");

    // ✅ 决定使用哪个 key
    let key = null;

    // 只勾 buildUp
    if (hasBuildUp && !hasLand) key = "buildUp";
    // 只勾 land
    else if (hasLand && !hasBuildUp) key = "land";
    // 两个都勾：优先 buildUp（但必须有值），否则用 land（只要有值）
    else if (hasBuildUp && hasLand) {
      if (Number.isFinite(buNum) && buNum > 0) key = "buildUp";
      else if (Number.isFinite(landNum) && landNum > 0) key = "land";
      else key = "buildUp"; // 两个都没填时无所谓
    } else {
      // types 异常/为空：按有值优先
      if (Number.isFinite(buNum) && buNum > 0) key = "buildUp";
      else if (Number.isFinite(landNum) && landNum > 0) key = "land";
    }

    if (!key) return 0;

    const sizeRaw = String(values[key] || "").replace(/,/g, "").trim();
    const sizeNum = Number(sizeRaw);
    if (!Number.isFinite(sizeNum) || sizeNum <= 0) return 0;

    const unitStr = String(units[key] || "").toLowerCase();

    // sqm -> sqft
    if (unitStr.includes("sqm") || unitStr.includes("square meter") || unitStr.includes("sq m")) {
      return sizeNum * 10.7639;
    }
    // acre -> sqft
    if (unitStr.includes("acre")) {
      return sizeNum * 43560;
    }
    // sqft 默认
    return sizeNum;
  }

  return 0;
};

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

const CLEANING_OPTIONS = ["每月一次", "每两星期一次", "每三星期一次", "每个星期一次", "没有清洁服务"];

const CARPARK_OPTIONS = ["1", "2", "3", "4", "5", "公共停车位", "没有车位", "车位另租"];
const CARPARK_RENT_PRICE_PRESETS = ["50", "100", "150", "200"];

const RACE_OPTIONS = ["马来人", "印度人", "华人", "外国人"];
const TENANCY_OPTIONS = ["1个月", "3个月", "6个月", "一年以下", "一年以上"];

// ✅ 你原本那种“白色下拉建议”——我用常见租金档位（你不喜欢我可以换）
const RENT_SUGGESTIONS = [
  "500", "600", "700", "800", "900",
  "1,000", "1,200", "1,500", "1,800", "2,000",
  "2,200", "2,500", "2,800", "3,000", "3,500",
  "4,000", "4,500", "5,000", "6,000", "8,000", "10,000",
].map((x) => parseDigits(x));

// ----------------- 默认值 -----------------
const defaultValue = {
  // ✅ 加回你需要的字段
  area: null,
  rent: "",

  roomType: "",
  bathroomType: "",
  bedTypes: [],
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

      <div className="w-full border rounded p-2 bg-white cursor-pointer" onClick={() => setOpen((p) => !p)}>
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

  const displayText =
    value.length === 0 ? "请选择床型（可多选）" : value.map((v) => `${v.type} ✅`).join("，");

  return (
    <div className="space-y-2" ref={boxRef}>
      <label className="block text-sm font-medium text-gray-700">请选择床型（可多选 + 数量）</label>

      <div className="w-full border rounded p-2 bg-white cursor-pointer" onClick={() => setOpen((p) => !p)}>
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
    </div>
  );
}

// ----------------- 租金：一个输入框 + 白色下拉建议（恢复你原本设计） -----------------
function RentInputWithSuggestions({ value, onChange }) {
  const wrapRef = useRef(null);
  const [open, setOpen] = useState(false);

  const digits = parseDigits(value);
  const display = digits ? formatNumber(digits) : "";

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">RM</span>
        <input
          type="text"
          inputMode="numeric"
          className="border rounded w-full p-2 bg-white"
          placeholder="例如 2,500"
          value={display}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onChange={(e) => {
            const raw = parseDigits(e.target.value);
            onChange?.(raw);
          }}
        />
      </div>

      {open && (
        <ul className="absolute z-20 mt-1 w-full bg-white border rounded shadow max-h-60 overflow-auto">
          {RENT_SUGGESTIONS.map((s) => (
            <li
              key={s}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange?.(s);
                setOpen(false);
              }}
            >
              {formatNumber(s)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ----------------- 主表单 -----------------
export default function RoomRentalForm({ value, onChange, extraSection = null }) {
  const data = useMemo(() => ({ ...defaultValue, ...(value || {}) }), [value]);

  const patch = (p) => {
    const next = { ...data, ...p };
    onChange?.(next);
  };

  // ✅ PSF
  const areaSqft = useMemo(() => getAreaSqft(data.area), [data.area]);
  const rentNum = useMemo(() => parseMoneyToNumber(data.rent), [data.rent]);
  const psf = useMemo(() => {
    if (!areaSqft || areaSqft <= 0) return 0;
    if (!rentNum || rentNum <= 0) return 0;
    return rentNum / areaSqft;
  }, [rentNum, areaSqft]);

  const availableText = data.availableFrom ? `在 ${data.availableFrom} 就可以开始入住了` : "";
  const showCarparkRentPrice = data.carparkCount === "车位另租";

  return (
    <div className="space-y-4 mt-4 border rounded-lg p-4 bg-white">
      {/* ✅ 面积（加回） */}
      <div>
        <label className="block text-sm font-medium text-gray-700">面积</label>
        <AreaSelector value={data.area} onChange={(val) => patch({ area: val })} />
      </div>

      {/* ✅ 租金（加回你原本那种白色下拉建议） + PSF */}
      <div>
        <label className="block text-sm font-medium text-gray-700">租金</label>
        <RentInputWithSuggestions value={data.rent} onChange={(rent) => patch({ rent })} />
        {psf > 0 && <p className="text-sm text-gray-600 mt-1">≈ RM {psf.toFixed(2)} / sq ft</p>}
      </div>

      {/* 这是什么房？ */}
      <div>
        <label className="block text-sm font-medium text-gray-700">这是什么房？</label>
        <select className="border rounded w-full p-2" value={data.roomType} onChange={(e) => patch({ roomType: e.target.value })}>
          <option value="">请选择</option>
          {ROOM_TYPE_OPTIONS.map((x) => (
            <option key={x} value={x}>{x}</option>
          ))}
        </select>
      </div>

      {/* 卫生间 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">卫生间</label>
        <select className="border rounded w-full p-2" value={data.bathroomType} onChange={(e) => patch({ bathroomType: e.target.value })}>
          <option value="">请选择</option>
          {BATHROOM_OPTIONS.map((x) => (
            <option key={x} value={x}>{x}</option>
          ))}
        </select>
      </div>

      {/* 床型 */}
      <BedTypePicker value={data.bedTypes} onChange={(bedTypes) => patch({ bedTypes })} />

      {/* 独立/共用 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">是独立房间还是共用房间？</label>
        <select className="border rounded w-full p-2" value={data.roomPrivacy} onChange={(e) => patch({ roomPrivacy: e.target.value })}>
          <option value="">请选择</option>
          {ROOM_PRIVACY_OPTIONS.map((x) => (
            <option key={x} value={x}>{x}</option>
          ))}
        </select>
      </div>

      {/* 男女混住 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">是否男女混住？</label>
        <select className="border rounded w-full p-2" value={data.genderPolicy} onChange={(e) => patch({ genderPolicy: e.target.value })}>
          <option value="">请选择</option>
          {GENDER_OPTIONS.map((x) => (
            <option key={x} value={x}>{x}</option>
          ))}
        </select>
      </div>

      {/* 宠物 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">是否允许宠物？</label>
        <select className="border rounded w-full p-2" value={data.petAllowed} onChange={(e) => patch({ petAllowed: e.target.value })}>
          {YESNO_OPTIONS.map((x) => (
            <option key={x.value} value={x.value}>{x.label}</option>
          ))}
        </select>
      </div>

      {/* 允许烹饪 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">是否允许烹饪？</label>
        <select className="border rounded w-full p-2" value={data.cookingAllowed} onChange={(e) => patch({ cookingAllowed: e.target.value })}>
          {YESNO_OPTIONS.map((x) => (
            <option key={x.value} value={x.value}>{x.label}</option>
          ))}
        </select>
      </div>

      <MultiPick
        label="租金包括"
        options={RENT_INCLUDES_OPTIONS}
        value={data.rentIncludes}
        onChange={(rentIncludes) => patch({ rentIncludes })}
      />

      {/* 清洁服务 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">清洁服务</label>
        <select className="border rounded w-full p-2" value={data.cleaningService} onChange={(e) => patch({ cleaningService: e.target.value })}>
          <option value="">请选择</option>
          {CLEANING_OPTIONS.map((x) => (
            <option key={x} value={x}>{x}</option>
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
            <option key={x} value={x}>{x}</option>
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
              <option key={x} value={x}>{formatNumber(x)}</option>
            ))}
          </select>

          <input
            type="text"
            inputMode="numeric"
            className="border rounded w-full p-2"
            placeholder="也可以手动输入（会自动加千分位）"
            value={formatNumber(parseDigits(data.carparkRentPrice))}
            onChange={(e) => {
              const raw = parseDigits(e.target.value);
              if (raw.length > 9) return;
              patch({ carparkRentPrice: raw });
            }}
          />
        </div>
      )}

      <MultiPick
        label="偏向的种族"
        options={RACE_OPTIONS}
        value={data.preferredRaces}
        onChange={(preferredRaces) => patch({ preferredRaces })}
      />

      {/* 你要放在这里的四个输入框 */}
      {extraSection}

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
