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

const parseMoneyToNumber = (v) => {
  if (v === undefined || v === null) return 0;
  const raw = String(v)
    .replace(/rm/gi, "")
    .replace(/[^\d.]/g, "")
    .trim();
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
};

// ✅ 从任意字符串里抓「第一段数字」
const extractFirstNumber = (v) => {
  if (v === undefined || v === null) return 0;
  const s = String(v);
  const m = s.match(/[\d,.]+/); // 例如 "1,200 sqft" -> "1,200"
  if (!m) return 0;
  const n = Number(m[0].replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
};

// ✅ 单位换算成 sqft（默认 sqft）
const toSqft = (sizeNum, unitStr) => {
  const u = String(unitStr || "").toLowerCase();
  if (!Number.isFinite(sizeNum) || sizeNum <= 0) return 0;

  // sqm -> sqft
  if (u.includes("sqm") || u.includes("square meter") || u.includes("sq m")) return sizeNum * 10.7639;
  // acre -> sqft
  if (u.includes("acre")) return sizeNum * 43560;

  // sqft default
  return sizeNum;
};

// ✅ 极度兼容：同时解析 buildUp & land，然后按规则选用哪个进 PSF
const getAreaSqft = (areaVal) => {
  if (!areaVal) return { usedSqft: 0, buildUpSqft: 0, landSqft: 0, usedKey: "" };

  // 直接数字/字符串（当成 buildUp）
  if (typeof areaVal === "number") {
    const s = areaVal > 0 ? areaVal : 0;
    return { usedSqft: s, buildUpSqft: s, landSqft: 0, usedKey: "buildUp" };
  }
  if (typeof areaVal === "string") {
    const s = extractFirstNumber(areaVal);
    return { usedSqft: s, buildUpSqft: s, landSqft: 0, usedKey: "buildUp" };
  }

  // 统一入口（你 upload-property.js 的 areaData 就是这种）
  const values = (areaVal.values && typeof areaVal.values === "object") ? areaVal.values : {};
  const units = (areaVal.units && typeof areaVal.units === "object") ? areaVal.units : {};

  // 兼容各种 key 名
  const buildUpKeys = ["buildUp", "builtUp", "built_up", "build_up", "buildUpArea", "builtUpArea", "bua"];
  const landKeys = ["land", "landArea", "land_area", "landSize", "land_size"];

  const pickValueByKeys = (obj, keys) => {
    for (const k of keys) {
      if (obj && Object.prototype.hasOwnProperty.call(obj, k)) return obj[k];
    }
    return undefined;
  };

  const pickUnitByKeys = (obj, keys) => {
    for (const k of keys) {
      if (obj && Object.prototype.hasOwnProperty.call(obj, k)) return obj[k];
    }
    return "";
  };

  // 先从 values/units 取
  const buRaw = pickValueByKeys(values, buildUpKeys);
  const landRaw = pickValueByKeys(values, landKeys);

  const buUnit = pickUnitByKeys(units, buildUpKeys) || units.buildUp || units.builtUp || "";
  const landUnit = pickUnitByKeys(units, landKeys) || units.land || "";

  const buNum = extractFirstNumber(buRaw);
  const landNum = extractFirstNumber(landRaw);

  const buildUpSqft = toSqft(buNum, buUnit);
  const landSqft = toSqft(landNum, landUnit);

  // ✅ 规则：buildUp 有值优先；否则 land
  let usedSqft = 0;
  let usedKey = "";
  if (buildUpSqft > 0) {
    usedSqft = buildUpSqft;
    usedKey = "buildUp";
  } else if (landSqft > 0) {
    usedSqft = landSqft;
    usedKey = "land";
  }

  // 额外兜底：有些 AreaSelector 不是 values/units 结构
  if (!usedSqft) {
    // 例如 { buildUp: { value, unit }, land: { value, unit } }
    const buObj = areaVal.buildUp || areaVal.builtUp || areaVal.buildUpArea;
    const landObj = areaVal.land || areaVal.landArea;

    const bu2 = buObj ? toSqft(extractFirstNumber(buObj.value ?? buObj.size ?? buObj), buObj.unit ?? "") : 0;
    const land2 = landObj ? toSqft(extractFirstNumber(landObj.value ?? landObj.size ?? landObj), landObj.unit ?? "") : 0;

    if (bu2 > 0) {
      usedSqft = bu2;
      usedKey = "buildUp";
    } else if (land2 > 0) {
      usedSqft = land2;
      usedKey = "land";
    }

    return {
      usedSqft,
      buildUpSqft: buildUpSqft || bu2,
      landSqft: landSqft || land2,
      usedKey,
    };
  }

  return { usedSqft, buildUpSqft, landSqft, usedKey };
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

const BED_TYPE_OPTIONS = ["King Size", "Queen Size", "Super Single Size", "Single Size", "上下床", "没有提供床"];

const RENT_INCLUDES_OPTIONS = ["包括电费", "包括水费", "包括沥水机", "包括管理费", "包括电费但冷气/空调费不包"];
const CLEANING_OPTIONS = ["每月一次", "每两星期一次", "每三星期一次", "每个星期一次", "没有清洁服务"];

const CARPARK_OPTIONS = ["1", "2", "3", "4", "5", "公共停车位", "没有车位", "车位另租"];
const CARPARK_RENT_PRICE_PRESETS = ["50", "100", "150", "200"];

const RACE_OPTIONS = ["马来人", "印度人", "华人", "外国人"];
const TENANCY_OPTIONS = ["1个月", "3个月", "6个月", "一年以下", "一年以上"];

// ✅ 白色下拉建议（你要换成你原本那组也可以）
const RENT_SUGGESTIONS = [
  "500","600","700","800","900",
  "1,000","1,200","1,500","1,800","2,000",
  "2,200","2,500","2,800","3,000","3,500",
  "4,000","4,500","5,000","6,000","8,000","10,000",
].map((x) => parseDigits(x));

// ----------------- 默认值 -----------------
const defaultValue = {
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

// ----------------- 多选下拉（点击空白收起） -----------------
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

// ----------------- 床型（保持你现有逻辑，没乱改） -----------------
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

// ----------------- 租金：一个输入框 + 白色下拉建议（恢复你要的） -----------------
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
          onChange={(e) => onChange?.(parseDigits(e.target.value))}
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

  // ✅ PSF：用 buildUp 优先；buildUp 没值时自动用 land
  const areaInfo = useMemo(() => getAreaSqft(data.area), [data.area]);
  const rentNum = useMemo(() => parseMoneyToNumber(data.rent), [data.rent]);

  const psf = useMemo(() => {
    if (!areaInfo.usedSqft || areaInfo.usedSqft <= 0) return 0;
    if (!rentNum || rentNum <= 0) return 0;
    return rentNum / areaInfo.usedSqft;
  }, [rentNum, areaInfo.usedSqft]);

  const availableText = data.availableFrom ? `在 ${data.availableFrom} 就可以开始入住了` : "";
  const showCarparkRentPrice = data.carparkCount === "车位另租";

  return (
    <div className="space-y-4 mt-4 border rounded-lg p-4 bg-white">
      {/* 面积 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">面积</label>
        <AreaSelector value={data.area} onChange={(val) => patch({ area: val })} />
      </div>

      {/* 租金 + PSF */}
      <div>
        <label className="block text-sm font-medium text-gray-700">租金</label>
        <RentInputWithSuggestions value={data.rent} onChange={(rent) => patch({ rent })} />

        {psf > 0 && (
          <p className="text-sm text-gray-600 mt-1">
            ≈ RM {psf.toFixed(2)} / sq ft
          </p>
        )}
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
            <option key={x} value={x}>{x}</option>
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
            <option key={x} value={x}>{x}</option>
          ))}
        </select>
      </div>

      {/* 床型 */}
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
            <option key={x} value={x}>{x}</option>
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
            <option key={x} value={x}>{x}</option>
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
            <option key={x.value} value={x.value}>{x.label}</option>
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
        <select
          className="border rounded w-full p-2"
          value={data.cleaningService}
          onChange={(e) => patch({ cleaningService: e.target.value })}
        >
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
