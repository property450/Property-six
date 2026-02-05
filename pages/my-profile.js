// pages/my-profile.js
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../supabaseClient";
import { useUser } from "@supabase/auth-helpers-react";
import { toast } from "react-hot-toast";

/* =========================
   基础工具
========================= */
function isNonEmpty(v) {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim() !== "";
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v).length > 0;
  return true;
}

function safeJson(v) {
  if (!isNonEmpty(v)) return null;
  if (typeof v === "object") return v;
  if (typeof v !== "string") return null;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

function deepGet(obj, path) {
  if (!obj || !path) return undefined;
  const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean);
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function pickAny(obj, candidates) {
  if (!obj) return "";
  for (const c of candidates) {
    const v = c.includes(".") || c.includes("[") ? deepGet(obj, c) : obj?.[c];
    if (isNonEmpty(v)) return v;
  }
  return "";
}

function normalizeLower(s) {
  return String(s || "").trim().toLowerCase();
}

function yesNoText(v) {
  if (v === true) return "是";
  if (v === false) return "否";
  if (!isNonEmpty(v)) return "";
  const s = String(v).trim().toLowerCase();
  if (["yes", "y", "true", "1", "是"].includes(s)) return "是";
  if (["no", "n", "false", "0", "否"].includes(s)) return "否";
  return String(v);
}

function extractNumeric(v) {
  if (!isNonEmpty(v)) return NaN;
  const n = Number(String(v).replace(/,/g, "").replace(/[^\d.]/g, ""));
  return Number.isNaN(n) ? NaN : n;
}

function money(v) {
  if (!isNonEmpty(v)) return "";
  const n = extractNumeric(v);
  if (Number.isNaN(n)) return "";
  return "RM " + n.toLocaleString("en-MY");
}

/* =========================
   ✅ 智能扫描（关键修复点）
   - 不猜 key 名
   - 直接在当前 active 表单 JSON 里找 range / year / quarter
========================= */
function walkObject(root, visitor, maxDepth = 10) {
  const stack = [{ value: root, path: "", depth: 0 }];
  const seen = new Set();

  while (stack.length) {
    const { value, path, depth } = stack.pop();
    if (value && typeof value === "object") {
      // 防循环引用
      if (seen.has(value)) continue;
      seen.add(value);
    }

    visitor(value, path);

    if (depth >= maxDepth) continue;

    if (Array.isArray(value)) {
      for (let i = value.length - 1; i >= 0; i--) {
        stack.push({ value: value[i], path: `${path}[${i}]`, depth: depth + 1 });
      }
    } else if (value && typeof value === "object") {
      const keys = Object.keys(value);
      for (let i = keys.length - 1; i >= 0; i--) {
        const k = keys[i];
        const nextPath = path ? `${path}.${k}` : k;
        stack.push({ value: value[k], path: nextPath, depth: depth + 1 });
      }
    }
  }
}

function findBestPriceRange(obj) {
  if (!obj || typeof obj !== "object") return null;

  // 找到 “包含 price 字样” 的对象，并且内部有一对 min/max 或 from/to
  const candidates = [];

  walkObject(obj, (v, p) => {
    if (!v || typeof v !== "object") return;
    const pathLower = normalizeLower(p);
    // 只在疑似 price 容器附近找
    if (!pathLower.includes("price") && !pathLower.includes("amount") && !pathLower.includes("rm")) return;

    const keys = Object.keys(v);
    const hasMin = keys.some((k) => ["min", "minimum", "from", "low", "start"].includes(normalizeLower(k)));
    const hasMax = keys.some((k) => ["max", "maximum", "to", "high", "end"].includes(normalizeLower(k)));
    if (!hasMin || !hasMax) return;

    const minKey = keys.find((k) => ["min", "minimum", "from", "low", "start"].includes(normalizeLower(k)));
    const maxKey = keys.find((k) => ["max", "maximum", "to", "high", "end"].includes(normalizeLower(k)));
    const minV = extractNumeric(v[minKey]);
    const maxV = extractNumeric(v[maxKey]);

    if (!Number.isNaN(minV) && !Number.isNaN(maxV) && minV > 0 && maxV > 0) {
      // 优先更接近 price 容器、更浅的 path
      const score = 100 - p.split(".").length;
      candidates.push({ score, min: minV, max: maxV, path: p });
    }
  });

  if (!candidates.length) return null;
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  return { min: best.min, max: best.max };
}

function findBestExpectedYearQuarter(obj) {
  if (!obj || typeof obj !== "object") return null;

  // 找到包含 expected/expect/completion + year 的字段，然后在同一父级里找 quarter
  const candidates = [];

  walkObject(obj, (v, p) => {
    const pathLower = normalizeLower(p);
    if (!pathLower.includes("year")) return;
    if (!pathLower.includes("expect") && !pathLower.includes("completion") && !pathLower.includes("complete")) return;

    if (typeof v === "number" || typeof v === "string") {
      const y = Number(String(v).trim());
      if (y >= 1900 && y <= 2100) {
        // 尝试找 quarter（同父级）
        const parentPath = p.split(".").slice(0, -1).join(".");
        let q = "";
        if (parentPath) {
          const parentObj = deepGet(obj, parentPath);
          if (parentObj && typeof parentObj === "object") {
            for (const k of Object.keys(parentObj)) {
              const kl = normalizeLower(k);
              if (kl.includes("quarter") || kl === "q") {
                const qv = parentObj[k];
                if (isNonEmpty(qv)) q = String(qv).replace(/^q/i, "").trim();
              }
            }
          }
        }
        const score =
          (pathLower.includes("expect") ? 80 : 0) +
          (pathLower.includes("completion") ? 40 : 0) +
          (pathLower.includes("complete") ? 20 : 0) -
          p.split(".").length;
        candidates.push({ score, year: y, quarter: q, path: p });
      }
    }
  });

  if (!candidates.length) return null;
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0];
}

// ✅ Completed Unit / 非 New Project 的“完成年份”智能扫描（只在 active 表单内找）
function findBestCompletedYear(obj) {
  if (!obj || typeof obj !== "object") return null;
  const candidates = [];

  walkObject(obj, (v, p) => {
    const pathLower = normalizeLower(p);
    if (!pathLower.includes("year")) return;
    // 避免把 expected/预计完成 当成 completed
    if (pathLower.includes("expect")) return;

    if (typeof v === "number" || typeof v === "string") {
      const y = Number(String(v).trim());
      if (y >= 1900 && y <= 2100) {
        const score =
          (pathLower.includes("complete") ? 80 : 0) +
          (pathLower.includes("built") ? 60 : 0) +
          (pathLower.includes("finish") ? 60 : 0) -
          p.split(".").length;
        candidates.push({ score, year: y, path: p });
      }
    }
  });

  if (!candidates.length) return null;
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0];
}

// ✅ Affordable Housing 智能扫描（只在 active 表单内找）
function findBestAffordable(obj) {
  if (!obj || typeof obj !== "object") return null;
  const ynCandidates = [];
  const typeCandidates = [];

  walkObject(obj, (v, p) => {
    const pathLower = normalizeLower(p);
    if (!pathLower.includes("affordable")) return;

    // yes/no
    if (typeof v === "boolean" || typeof v === "number" || typeof v === "string") {
      const yn = yesNoText(v);
      if (yn === "是" || yn === "否") {
        const score = 100 - p.split(".").length;
        ynCandidates.push({ score, yn, path: p });
      }
    }

    // type/name
    if (typeof v === "string") {
      if (pathLower.includes("type") || pathLower.includes("name") || pathLower.includes("scheme")) {
        const s = String(v).trim();
        if (s && s.length >= 2 && s.length <= 80) {
          const score = 80 - p.split(".").length;
          typeCandidates.push({ score, type: s, path: p });
        }
      }
    }
  });

  const bestYN = ynCandidates.length ? ynCandidates.sort((a, b) => b.score - a.score)[0] : null;
  const bestType = typeCandidates.length ? typeCandidates.sort((a, b) => b.score - a.score)[0] : null;

  if (!bestYN && !bestType) return null;
  return { yn: bestYN?.yn || "", type: bestType?.type || "" };
}

/* =========================
   ✅ 只读“当前表单”的数据源（防串台）
========================= */
function isNewProjectStatus(propertyStatus) {
  const s = normalizeLower(propertyStatus);
  return s.includes("new project") || s.includes("under construction");
}
function isCompletedUnitStatus(propertyStatus) {
  const s = normalizeLower(propertyStatus);
  return s.includes("completed unit") || s.includes("developer unit");
}

function resolveActiveSources(raw) {
  const saleTypeRaw = pickAny(raw, ["saleType", "sale_type", "saletype", "listing_mode"]);
  const saleType = normalizeLower(saleTypeRaw);
  const propertyStatus = pickAny(raw, ["propertyStatus", "property_status", "propertystatus"]);

  const typeFormV2 = safeJson(raw.type_form_v2) || safeJson(raw.type_form) || null;
  const singleFormV2 = safeJson(raw.single_form_data_v2) || safeJson(raw.single_form_data) || null;
  const homestayForm = safeJson(raw.homestay_form) || null;
  const hotelForm = safeJson(raw.hotel_resort_form) || null;

  let ul = raw.unit_layouts ?? raw.unitLayouts ?? raw.unitlayouts;
  ul = safeJson(ul) ?? ul;
  const layout0 = Array.isArray(ul) && ul[0] && typeof ul[0] === "object" ? ul[0] : null;

  const isProject = isNewProjectStatus(propertyStatus) || isCompletedUnitStatus(propertyStatus);

  if (isProject) {
    return { mode: "project", saleType: "sale", propertyStatus, shared: typeFormV2, form: null, layout0 };
  }

  // Homestay / Hotel 优先对应 JSON（避免串台）
  if (saleType.includes("homestay")) {
    return { mode: "homestay", saleType: "homestay", propertyStatus, shared: null, form: homestayForm || singleFormV2, layout0: null };
  }
  if (saleType.includes("hotel")) {
    return { mode: "hotel", saleType: "hotel", propertyStatus, shared: null, form: hotelForm || singleFormV2, layout0: null };
  }

  // Rent / Sale 单表单
  if (saleType.includes("rent")) {
    return { mode: "rent", saleType: "rent", propertyStatus, shared: null, form: singleFormV2, layout0: null };
  }

  return { mode: "sale", saleType: "sale", propertyStatus, shared: null, form: singleFormV2, layout0: null };
}

/* =========================
   只从 active 的 shared/layout0/form 里拿值
   （raw 只能用于标题/地址等顶层展示）
========================= */
function pickActive(raw, active, keys) {
  const v0 = pickAny(raw, keys);
  if (isNonEmpty(v0)) return v0;

  const v1 = pickAny(active.shared, keys);
  if (isNonEmpty(v1)) return v1;

  const v2 = pickAny(active.layout0, keys);
  if (isNonEmpty(v2)) return v2;

  const v3 = pickAny(active.form, keys);
  if (isNonEmpty(v3)) return v3;

  return "";
}

// ✅ 某些字段（如 Affordable / 年份）绝对不能从 raw 顶层“捡旧值”
// 这些字段必须优先从当前 active 表单（shared/layout0/form）读取，最后才允许 fallback raw。
function pickActivePreferActive(raw, active, keys) {
  const v1 = pickAny(active.shared, keys);
  if (isNonEmpty(v1)) return v1;

  const v2 = pickAny(active.layout0, keys);
  if (isNonEmpty(v2)) return v2;

  const v3 = pickAny(active.form, keys);
  if (isNonEmpty(v3)) return v3;

  const v0 = pickAny(raw, keys);
  if (isNonEmpty(v0)) return v0;

  return "";
}

/* =========================
   表单一致的显示规则
========================= */
function shouldShowStoreysByCategory(category) {
  const c = normalizeLower(category);
  const need = [
    "bungalow",
    "villa",
    "business property",
    "industrial property",
    "semi-detached",
    "terrace",
    "link house",
  ];
  return need.some((k) => c.includes(k));
}

function shouldShowPropertySubtypeByCategory(category) {
  const c = normalizeLower(category);
  return c.includes("apartment") || c.includes("business property") || c.includes("industrial property");
}

function formatCarparks(v) {
  // v 可能是 number / string / {min,max} / {from,to}
  if (!isNonEmpty(v)) return "";
  if (typeof v === "number") return String(v);
  if (typeof v === "string") return v;

  if (typeof v === "object") {
    const min = pickAny(v, ["min", "minimum", "from", "low", "start"]);
    const max = pickAny(v, ["max", "maximum", "to", "high", "end"]);
    if (isNonEmpty(min) && isNonEmpty(max)) return `${min} ~ ${max}`;
    // 有时候是 {min: '5', max: '4'} 也照显示（你要 4~5 的话，让保存端保证 min<=max）
    const a = isNonEmpty(min) ? String(min) : "";
    const b = isNonEmpty(max) ? String(max) : "";
    if (a && b) return `${a} ~ ${b}`;
  }

  return String(v);
}

function getTransitText(raw, active) {
  const yn = pickActive(raw, active, ["transit", "nearTransit", "walkToTransit", "transit_yesno"]);
  const yesNo = yesNoText(yn);

  // ✅ 如果没选，就 "-"
  if (!isNonEmpty(yn)) return "-";
  if (yesNo === "否") return "否";
  if (yesNo !== "是") return "-";

  const line = pickActive(raw, active, ["transitLine", "transit_line", "line"]);
  const station = pickActive(raw, active, ["transitStation", "transit_station", "station"]);
  const parts = [];
  parts.push("是");
  if (isNonEmpty(line)) parts.push(`线路：${line}`);
  if (isNonEmpty(station)) parts.push(`站点：${station}`);
  return parts.join(" | ");
}

function getCardPriceText(raw, active) {
  // 1) 顶层直接有 min/max
  const minTop = pickAny(raw, ["price_min", "priceMin", "min_price"]);
  const maxTop = pickAny(raw, ["price_max", "priceMax", "max_price"]);

  if (isNonEmpty(minTop) && isNonEmpty(maxTop)) {
    const nMin = extractNumeric(minTop);
    const nMax = extractNumeric(maxTop);
    if (!Number.isNaN(nMin) && !Number.isNaN(nMax) && nMin > 0 && nMax > 0) {
      return `${money(nMin)} ~ ${money(nMax)}`;
    }
  }

  // 2) project 模式：尝试常规 key
  if (active.mode === "project") {
    // ✅ 2.1 shared/layout0 的常规字段
    const min2 = pickActive(raw, active, ["minPrice", "priceMin", "price_min", "min_price"]);
    const max2 = pickActive(raw, active, ["maxPrice", "priceMax", "price_max", "max_price"]);
    const nMin2 = extractNumeric(min2);
    const nMax2 = extractNumeric(max2);
    if (!Number.isNaN(nMin2) && !Number.isNaN(nMax2) && nMin2 > 0 && nMax2 > 0) {
      return `${money(nMin2)} ~ ${money(nMax2)}`;
    }

    // ✅ 3) project：智能扫描 shared/layout0 找 range
    const best1 = findBestPriceRange(active.shared);
    const best2 = findBestPriceRange(active.layout0);
    const best = best1 || best2;
    if (best) {
      return `${money(best.min)} ~ ${money(best.max)}`;
    }
  }

  // 4) 单价
  const single = pickActive(raw, active, ["price", "amount", "price_min", "price_max"]);
  if (isNonEmpty(single)) return money(single);

  return "-";
}

function getExpectedCompletionText(raw, active) {
  // 先用常规 key
  const year = pickActive(raw, active, [
    "expectedCompletedYear",
    "expectedCompletionYear",
    "expected_year",
    "expectedYear",
    "completionExpectedYear",
  ]);
  const quarter = pickActive(raw, active, [
    "expectedCompletedQuarter",
    "expectedCompletionQuarter",
    "expected_quarter",
    "expectedQuarter",
    "completionExpectedQuarter",
  ]);

  if (isNonEmpty(year)) {
    if (!isNonEmpty(quarter)) return String(year);
    let q = String(quarter).trim();
    if (/^q[1-4]$/i.test(q)) q = q.toUpperCase();
    else q = `Q${q}`;
    return `${year} ${q}`;
  }

  // ✅ 智能扫描：shared/layout0 里找 year + quarter
  const best1 = findBestExpectedYearQuarter(active.shared);
  const best2 = findBestExpectedYearQuarter(active.layout0);
  const best = best1 || best2;

  if (!best || !best.year) return "-";
  if (!best.quarter) return String(best.year);
  return `${best.year} Q${best.quarter}`;
}

/* =========================
   UI：没选就 "-"
========================= */
function MetaLineDash({ label, value }) {
  const show = isNonEmpty(value) ? String(value) : "-";
  return (
    <div className="text-sm text-gray-700 leading-6">
      <span className="text-gray-500">{label}：</span>
      <span className="text-gray-900">{show}</span>
    </div>
  );
}

/* =========================
   Card（卖家后台卡片）
========================= */
function SellerPropertyCard({ rawProperty, onView, onEdit, onDelete }) {
  const active = useMemo(() => resolveActiveSources(rawProperty), [rawProperty]);

  const title = pickAny(rawProperty, ["title"]) || "（未命名房源）";
  const address = pickAny(rawProperty, ["address"]) || "-";

  const bedrooms = pickActive(rawProperty, active, ["bedrooms", "bedroom_count", "room_count"]);
  const bathrooms = pickActive(rawProperty, active, ["bathrooms", "bathroom_count"]);
  const carparksRaw = pickActive(rawProperty, active, ["carparks", "carpark", "carparkCount", "carpark_count"]);
  const carparks = isNonEmpty(carparksRaw) ? formatCarparks(carparksRaw) : "-";

  const usage = pickActive(rawProperty, active, ["usage", "property_usage"]);
  const propertyTitle = pickActive(rawProperty, active, ["propertyTitle", "property_title"]);
  const propertyStatus = active.propertyStatus || pickAny(rawProperty, ["propertyStatus", "property_status", "propertystatus"]);
  const tenure = pickActive(rawProperty, active, ["tenure", "tenure_type"]);

  const category = pickActive(rawProperty, active, ["propertyCategory", "property_category", "category"]);
  const subType = pickActive(rawProperty, active, ["subType", "sub_type", "property_sub_type"]);
  const storeys = pickActive(rawProperty, active, ["storeys", "storey", "floorCount"]);
  const propSubtypes = pickActive(rawProperty, active, ["propertySubtypes", "property_subtypes", "propertySubtype", "subtypes", "subtype"]);

  // ✅ Affordable 必须从当前 active 表单读，避免显示上一套表单的旧值
  let affordableRaw = pickActivePreferActive(rawProperty, active, ["affordable", "affordable_housing", "affordableHousing"]);
  let affordableType = pickActivePreferActive(rawProperty, active, ["affordableType", "affordable_housing_type", "affordableHousingType"]);

  // 若常规 key 找不到，就在 active 表单里智能扫描一次（不动 raw 顶层）
  if (!isNonEmpty(affordableRaw) && !isNonEmpty(affordableType)) {
    const best = findBestAffordable(active.shared) || findBestAffordable(active.layout0) || findBestAffordable(active.form);
    if (best) {
      if (!isNonEmpty(affordableRaw)) affordableRaw = best.yn;
      if (!isNonEmpty(affordableType)) affordableType = best.type;
    }
  }

  let affordable = yesNoText(affordableRaw);
  if (isNonEmpty(affordableType) && affordable !== "是") affordable = "是";
  const affordableText =
    affordable === "是" && isNonEmpty(affordableType)
      ? `是（${affordableType}）`
      : (isNonEmpty(affordable) ? affordable : "-");

  const transitText = getTransitText(rawProperty, active);

  const priceText = getCardPriceText(rawProperty, active);

  const expectedText = getExpectedCompletionText(rawProperty, active);

  // ✅ 完成年份必须从当前 active 表单读，避免显示旧值；读不到再智能扫描 active
  let completedYear = pickActivePreferActive(rawProperty, active, ["completedYear", "built_year", "completed_year", "completionYear"]);
  if (!isNonEmpty(completedYear)) {
    const bestCY = findBestCompletedYear(active.shared) || findBestCompletedYear(active.layout0) || findBestCompletedYear(active.form);
    if (bestCY?.year) completedYear = bestCY.year;
  }

  const showStoreys = shouldShowStoreysByCategory(category);
  const showSubtype = shouldShowPropertySubtypeByCategory(category);

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="min-w-0">
        <div className="text-lg font-semibold text-gray-900 truncate">{title}</div>
        <div className="text-sm text-gray-600 mt-1 truncate">{address}</div>

        <div className="text-base font-semibold text-blue-700 mt-2">{priceText}</div>

        <div className="text-sm text-gray-700 mt-2 flex flex-wrap gap-x-4 gap-y-1">
          <span>🛏 {isNonEmpty(bedrooms) ? String(bedrooms) : "-"}</span>
          <span>🛁 {isNonEmpty(bathrooms) ? String(bathrooms) : "-"}</span>
          <span>🚗 {carparks}</span>
        </div>

        <div className="mt-3 space-y-1">
          <MetaLineDash label="Sale / Rent" value={active.saleType ? active.saleType.toUpperCase() : "-"} />
          <MetaLineDash label="Property Usage" value={usage} />
          <MetaLineDash label="Property Title" value={propertyTitle} />
          <MetaLineDash label="Property Status / Sale Type" value={propertyStatus} />
          <MetaLineDash label="Affordable Housing" value={affordableText} />
          <MetaLineDash label="Tenure Type" value={tenure} />

          <MetaLineDash label="Property Category" value={category} />
          <MetaLineDash label="Sub Type" value={subType} />

          {showStoreys && <MetaLineDash label="Storeys" value={storeys} />}
          {showSubtype && (
            <MetaLineDash
              label="Property Subtype"
              value={Array.isArray(propSubtypes) ? propSubtypes.join(", ") : propSubtypes}
            />
          )}

          <MetaLineDash label="你的产业步行能到达公共交通吗？" value={transitText} />

          {/* ✅ 年份显示规则：
              - New Project / Under Construction：只显示“预计完成年份（含季度）”
              - Completed Unit / Developer Unit：只显示“完成年份”
              - 其他 Sale 类型：显示“完成年份”，不显示预计完成年份（避免串台）
          */}
          {isNewProjectStatus(propertyStatus) ? (
            <MetaLineDash label="预计完成年份" value={expectedText} />
          ) : isCompletedUnitStatus(propertyStatus) ? (
            <MetaLineDash label="完成年份" value={isNonEmpty(completedYear) ? completedYear : "-"} />
          ) : (
            <MetaLineDash label="完成年份" value={isNonEmpty(completedYear) ? completedYear : "-"} />
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <button onClick={() => onView(rawProperty)} className="h-11 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700">
          查看
        </button>
        <button onClick={() => onEdit(rawProperty)} className="h-11 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700">
          编辑
        </button>
        <button onClick={() => onDelete(rawProperty)} className="h-11 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700">
          删除
        </button>
      </div>
    </div>
  );
}

/* =========================
   Page（统计 + 搜索 + 排序）
========================= */
export default function MyProfilePage() {
  const router = useRouter();
  const user = useUser();

  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [sortKey, setSortKey] = useState("latest");

  const fetchMyProperties = async () => {
    if (!user?.id) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("fetchMyProperties error:", error);
      toast.error(error.message || "加载失败");
      setLoading(false);
      return;
    }

    setProperties(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchMyProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const stats = useMemo(() => {
    const total = properties.length;
    const published = total;
    const draft = 0;
    const latestTime = properties
      .map((p) => p?.updated_at || p?.created_at)
      .filter(Boolean)
      .sort()
      .slice(-1)[0];

    return { total, published, draft, latestTime };
  }, [properties]);

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    let list = properties;

    if (k) {
      list = list.filter((p) => {
        const t = pickAny(p, ["title"]);
        const a = pickAny(p, ["address"]);
        return String(t || "").toLowerCase().includes(k) || String(a || "").toLowerCase().includes(k);
      });
    }

    const getPriceNum = (p) => {
      const n = extractNumeric(p?.price_max ?? p?.price ?? p?.price_min);
      return Number.isNaN(n) ? 0 : n;
    };

    if (sortKey === "latest") {
      list = [...list].sort((a, b) => new Date(b?.updated_at || b?.created_at || 0) - new Date(a?.updated_at || a?.created_at || 0));
    } else if (sortKey === "oldest") {
      list = [...list].sort((a, b) => new Date(a?.updated_at || a?.created_at || 0) - new Date(b?.updated_at || b?.created_at || 0));
    } else if (sortKey === "priceHigh") {
      list = [...list].sort((a, b) => getPriceNum(b) - getPriceNum(a));
    } else if (sortKey === "priceLow") {
      list = [...list].sort((a, b) => getPriceNum(a) - getPriceNum(b));
    }

    return list;
  }, [properties, keyword, sortKey]);

  const onView = (p) => router.push(`/property/${p.id}`);
  const onEdit = (p) => router.push(`/upload-property?edit=1&id=${p.id}`);

  const onDelete = async (p) => {
    if (!confirm("确定要删除这个房源吗？")) return;

    const { error } = await supabase.from("properties").delete().eq("id", p.id);
    if (error) {
      console.error("delete error:", error);
      toast.error(error.message || "删除失败");
      return;
    }

    toast.success("已删除");
    fetchMyProperties();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="text-2xl font-bold text-gray-900">我的房源（卖家后台）</div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-sm text-gray-500">房源总数</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-sm text-gray-500">已发布</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.published}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-sm text-gray-500">草稿</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.draft}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-sm text-gray-500">最近更新时间</div>
          <div className="text-sm text-gray-900 mt-2">{stats.latestTime ? String(stats.latestTime) : "-"}</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
        <div className="md:col-span-3">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="输入标题或地点..."
            className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div className="md:col-span-1">
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="latest">最新优先</option>
            <option value="oldest">最旧优先</option>
            <option value="priceHigh">价格：高到低</option>
            <option value="priceLow">价格：低到高</option>
          </select>
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="text-gray-600">加载中...</div>
        ) : filtered.length === 0 ? (
          <div className="text-gray-600">没有符合条件的房源。</div>
        ) : (
          <div className="space-y-4">
            {filtered.map((p) => (
              <SellerPropertyCard key={p.id} rawProperty={p} onView={onView} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
