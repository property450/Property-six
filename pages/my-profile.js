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
========================= */
function walkObject(root, visitor, maxDepth = 10) {
  const stack = [{ value: root, path: "", depth: 0 }];
  const seen = new Set();

  while (stack.length) {
    const { value, path, depth } = stack.pop();
    if (value && typeof value === "object") {
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

  const candidates = [];

  walkObject(obj, (v, p) => {
    if (!v || typeof v !== "object" || Array.isArray(v)) return;

    const pathLower = normalizeLower(p);
    const looksPrice = pathLower.includes("price");

    const minV = v.min ?? v.minPrice ?? v.min_value ?? v.minValue ?? v.from ?? v.start ?? v.low;
    const maxV = v.max ?? v.maxPrice ?? v.max_value ?? v.maxValue ?? v.to ?? v.end ?? v.high;

    const minN = extractNumeric(minV);
    const maxN = extractNumeric(maxV);

    if (!Number.isNaN(minN) && !Number.isNaN(maxN)) {
      candidates.push({
        score: (looksPrice ? 100 : 0) - p.split(".").length,
        path: p,
        min: minN,
        max: maxN,
      });
    }
  });

  if (!candidates.length) return null;
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0];
}

function findBestExpectedYearQuarter(obj) {
  if (!obj || typeof obj !== "object") return null;

  const yearCandidates = [];
  const quarterCandidates = [];

  walkObject(obj, (v, p) => {
    const key = p.split(".").slice(-1)[0] || "";
    const keyLower = normalizeLower(key);
    const pathLower = normalizeLower(p);

    if (typeof v === "number" || typeof v === "string") {
      const s = String(v).trim();
      const y = Number(s);
      if (y >= 1900 && y <= 2100) {
        const score =
          (pathLower.includes("expect") ? 50 : 0) +
          (pathLower.includes("complete") ? 40 : 0) +
          (pathLower.includes("year") ? 30 : 0) +
          (keyLower.includes("year") ? 20 : 0);

        yearCandidates.push({ score, year: y, path: p });
      }

      let q = null;
      if (/^q[1-4]$/i.test(s)) q = Number(s.slice(1));
      else {
        const n = Number(s);
        if (n >= 1 && n <= 4) q = n;
      }
      if (q) {
        const score =
          (pathLower.includes("quarter") ? 50 : 0) +
          (pathLower.includes("qtr") ? 40 : 0) +
          (pathLower.includes("expect") ? 20 : 0) +
          (pathLower.includes("complete") ? 20 : 0) +
          (keyLower.includes("quarter") ? 20 : 0);

        quarterCandidates.push({ score, quarter: q, path: p });
      }
    }
  });

  if (!yearCandidates.length) return null;

  yearCandidates.sort((a, b) => b.score - a.score);
  quarterCandidates.sort((a, b) => b.score - a.score);

  const bestYear = yearCandidates[0];
  const bestQuarter = quarterCandidates.length ? quarterCandidates[0] : null;

  return {
    year: bestYear.year,
    quarter: bestQuarter ? bestQuarter.quarter : null,
    yearPath: bestYear.path,
    quarterPath: bestQuarter ? bestQuarter.path : null,
  };
}

/** ✅ 完成年份：智能扫描（排除 expected 的 year） */
function findBestCompletedYear(obj) {
  if (!obj || typeof obj !== "object") return null;

  const candidates = [];

  walkObject(obj, (v, p) => {
    if (!(typeof v === "number" || typeof v === "string")) return;

    const s = String(v).trim();
    const y = Number(s);
    if (!(y >= 1900 && y <= 2100)) return;

    const pathLower = normalizeLower(p);
    const key = p.split(".").slice(-1)[0] || "";
    const keyLower = normalizeLower(key);

    if (pathLower.includes("expect")) return;

    const score =
      (pathLower.includes("complete") ? 80 : 0) +
      (pathLower.includes("completed") ? 80 : 0) +
      (pathLower.includes("built") ? 60 : 0) +
      (pathLower.includes("year") ? 30 : 0) +
      (keyLower.includes("year") ? 20 : 0) -
      p.split(".").length;

    if (score < 40) return;

    candidates.push({ score, year: y, path: p });
  });

  if (!candidates.length) return null;
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0];
}

/* =========================
   ✅✅✅ Smart finders (STRICT active only)
   用于解决：Property Category 仍然显示旧 column 的问题
========================= */
function findBestActiveValue(active, opts) {
  const sources = [
    { obj: active?.shared, weight: 3, name: "shared" },
    { obj: active?.layout0, weight: 2, name: "layout0" },
    { obj: active?.form, weight: 1, name: "form" },
  ].filter((x) => x.obj && typeof x.obj === "object");

  const { keyMustInclude = [], keyExact = [], pathBonusInclude = [], pathRejectInclude = [] } = opts || {};

  const candidates = [];

  for (const src of sources) {
    walkObject(src.obj, (v, p) => {
      if (!isNonEmpty(v)) return;

      const lastKey = (p.split(".").slice(-1)[0] || "").replace(/\[\d+\]/g, "");
      const keyLower = normalizeLower(lastKey);
      const pathLower = normalizeLower(p);

      // reject by path
      for (const r of pathRejectInclude) {
        if (r && pathLower.includes(normalizeLower(r))) return;
      }

      // leaf values only
      const isPrimitive = typeof v === "string" || typeof v === "number" || typeof v === "boolean";
      if (!isPrimitive) return;

      const strV = typeof v === "string" ? v.trim() : String(v);
      if (!isNonEmpty(strV)) return;

      // key exact match
      let score = 0;
      if (keyExact.length && keyExact.some((k) => keyLower === normalizeLower(k))) {
        score += 120;
      }

      // key include match
      if (keyMustInclude.length) {
        const ok = keyMustInclude.some((k) => keyLower.includes(normalizeLower(k)));
        if (!ok && !keyExact.length) return;
        if (ok) score += 80;
      }

      // path bonus
      for (const b of pathBonusInclude) {
        if (b && pathLower.includes(normalizeLower(b))) score += 20;
      }

      // prefer shorter paths (less nested)
      score += 10 - Math.min(10, p.split(".").length);

      // source weight
      score += src.weight * 10;

      candidates.push({ score, value: strV, path: p, source: src.name });
    });
  }

  if (!candidates.length) return "";
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0].value;
}

function findBestCategoryStrict(active) {
  // ✅只在 active 的 json 里找，绝不 fallback 到 rawProperty 的 column
  // 常见键：propertyCategory / property_category / category
  // 同时避免抓到照片分类、房间分类等无关字段
  return findBestActiveValue(active, {
    keyExact: ["propertyCategory", "property_category"],
    keyMustInclude: ["propertycategory", "property_category", "category"],
    pathBonusInclude: ["property", "type", "selector", "listing", "sale", "rent"],
    pathRejectInclude: ["photo", "image", "gallery", "room", "bed", "bath", "layoutPhoto", "floorplan", "facility"],
  });
}

/* =========================
   ✅ 当前表单识别
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

  if (saleType === "sale" || saleType === "rent") {
    return { mode: saleType, saleType, propertyStatus, shared: null, form: singleFormV2, layout0: null };
  }

  if (saleType === "homestay") {
    return { mode: "homestay", saleType, propertyStatus, shared: null, form: homestayForm, layout0: null };
  }

  const finalType = normalizeLower(pickAny(raw, ["finalType"]));
  if (saleType === "hotel/resort" || finalType.includes("hotel")) {
    return { mode: "hotel/resort", saleType: "hotel/resort", propertyStatus, shared: null, form: hotelForm, layout0: null };
  }

  return { mode: "unknown", saleType, propertyStatus, shared: null, form: singleFormV2, layout0: null };
}

function pickPreferActive(raw, active, keys) {
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
   ✅✅✅ 严格只读当前 active（用于：Affordable + 其它严格字段）
========================= */
function pickFromActiveOnly(active, keys) {
  const v1 = pickAny(active.shared, keys);
  if (isNonEmpty(v1)) return v1;

  const v2 = pickAny(active.layout0, keys);
  if (isNonEmpty(v2)) return v2;

  const v3 = pickAny(active.form, keys);
  if (isNonEmpty(v3)) return v3;

  return "";
}

function getAffordableTextStrict(active) {
  const affordableRaw = pickFromActiveOnly(active, [
    "affordable",
    "affordable_housing",
    "affordableHousing",
    "isAffordable",
    "affordableHousingYesNo",
  ]);

  const affordableType = pickFromActiveOnly(active, [
    "affordableType",
    "affordable_housing_type",
    "affordableHousingType",
  ]);

  const yn = yesNoText(affordableRaw);

  if (yn === "否") return "否";

  if (yn === "是") {
    if (isNonEmpty(affordableType)) return `是（${affordableType}）`;
    return "是";
  }

  if (isNonEmpty(affordableType)) return `是（${affordableType}）`;

  return "-";
}

/* =========================
   表单一致的显示规则
========================= */
function shouldShowStoreysByCategory(category) {
  const c = normalizeLower(category);
  if (!c) return false;
  return (
    c.includes("bungalow") ||
    c.includes("villa") ||
    c.includes("business") ||
    c.includes("industrial") ||
    c.includes("semi-detached") ||
    c.includes("semi detached") ||
    c.includes("terrace") ||
    c.includes("link house")
  );
}

function shouldShowPropertySubtypeByCategory(category) {
  const c = normalizeLower(category);
  if (!c) return false;
  return (
    c.includes("apartment") ||
    c.includes("condo") ||
    c.includes("service residence") ||
    c.includes("business") ||
    c.includes("industrial")
  );
}

function formatRange(minV, maxV, formatter) {
  const minN = extractNumeric(minV);
  const maxN = extractNumeric(maxV);
  if (!Number.isNaN(minN) && !Number.isNaN(maxN)) {
    const a = Math.min(minN, maxN);
    const b = Math.max(minN, maxN);
    if (a === b) return formatter ? formatter(a) : String(a);
    return formatter ? `${formatter(a)} ~ ${formatter(b)}` : `${a} ~ ${b}`;
  }
  if (!Number.isNaN(minN)) return formatter ? formatter(minN) : String(minN);
  if (!Number.isNaN(maxN)) return formatter ? formatter(maxN) : String(maxN);
  return "";
}

function formatCarparks(v) {
  if (!isNonEmpty(v)) return "";
  if (typeof v === "object") {
    const minV = v.min ?? v.from ?? v.minValue;
    const maxV = v.max ?? v.to ?? v.maxValue;
    const r = formatRange(minV, maxV, (n) => String(Math.trunc(n)));
    if (isNonEmpty(r)) return r;
  }
  return String(v);
}

function getTransitText(raw, active) {
  const near = pickPreferActive(raw, active, ["transit.nearTransit", "nearTransit", "transitNearTransit"]);
  if (!isNonEmpty(near)) return "-";

  const yn = yesNoText(near);
  if (!isNonEmpty(yn)) return "-";
  if (yn === "否") return "否";

  const lines = pickPreferActive(raw, active, ["transit.selectedLines", "selectedLines"]);
  const stations = pickPreferActive(raw, active, ["transit.selectedStations", "selectedStations"]);

  let extra = "";
  if (Array.isArray(lines) && lines.length) extra += `｜线路：${lines.join(", ")}`;

  if (stations && typeof stations === "object") {
    const parts = [];
    for (const k of Object.keys(stations)) {
      const arr = stations[k];
      if (Array.isArray(arr) && arr.length) {
        parts.push(`${k}: ${arr.map((x) => x?.label || x?.value).filter(Boolean).join(", ")}`);
      }
    }
    if (parts.length) extra += `｜站点：${parts.join("；")}`;
  }

  return `是${extra}`;
}

/* =========================
   ✅ 价格 & 预计完成
========================= */
function getCardPriceText(raw, active) {
  const propertyStatus = active.propertyStatus || pickAny(raw, ["propertyStatus", "property_status", "propertystatus"]);
  const isProject = isNewProjectStatus(propertyStatus) || isCompletedUnitStatus(propertyStatus);

  if (isProject) {
    const pd = pickPreferActive(raw, active, ["priceData", "pricedata", "price_data"]);
    const pdObj = safeJson(pd) ?? pd;

    if (pdObj && typeof pdObj === "object") {
      const minV = pickAny(pdObj, ["min", "minPrice", "min_value", "minValue", "from"]);
      const maxV = pickAny(pdObj, ["max", "maxPrice", "max_value", "maxValue", "to"]);
      const r = formatRange(minV, maxV, (n) => money(n));
      if (isNonEmpty(r) && r.includes("~")) return r;
    }

    const best1 = findBestPriceRange(active.shared);
    const best2 = findBestPriceRange(active.layout0);
    const best3 = findBestPriceRange(active.form);
    const best = best1 || best2 || best3;
    if (best) {
      return `${money(best.min)} ~ ${money(best.max)}`;
    }
  }

  if (isNonEmpty(raw.price_min) && isNonEmpty(raw.price_max)) {
    const r = formatRange(raw.price_min, raw.price_max, (n) => money(n));
    if (isNonEmpty(r) && r.includes("~")) return r;
  }

  const single = pickPreferActive(raw, active, ["price", "amount", "price_min", "price_max"]);
  if (isNonEmpty(single)) return money(single);

  return "-";
}

function getExpectedCompletionText(raw, active) {
  const year = pickPreferActive(raw, active, [
    "expectedCompletedYear",
    "expectedCompletionYear",
    "expected_year",
    "expectedYear",
    "completionExpectedYear",
  ]);
  const quarter = pickPreferActive(raw, active, [
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

  const best1 = findBestExpectedYearQuarter(active.shared);
  const best2 = findBestExpectedYearQuarter(active.layout0);
  const best3 = findBestExpectedYearQuarter(active.form);
  const best = best1 || best2 || best3;

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

  const bedrooms = pickPreferActive(rawProperty, active, ["bedrooms", "bedroom_count", "room_count"]);
  const bathrooms = pickPreferActive(rawProperty, active, ["bathrooms", "bathroom_count"]);
  const carparksRaw = pickPreferActive(rawProperty, active, ["carparks", "carpark", "carparkCount", "carpark_count"]);
  const carparks = isNonEmpty(carparksRaw) ? formatCarparks(carparksRaw) : "-";

  const usage = pickPreferActive(rawProperty, active, ["usage", "property_usage"]);
  const propertyTitle = pickPreferActive(rawProperty, active, ["propertyTitle", "property_title"]);
  const propertyStatus =
    active.propertyStatus || pickAny(rawProperty, ["propertyStatus", "property_status", "propertystatus"]);
  const tenure = pickPreferActive(rawProperty, active, ["tenure", "tenure_type"]);

  // ✅✅✅ 关键修复：Property Category 只从“当前 active 表单 json”智能扫描，绝不读 rawProperty column
  const category = findBestCategoryStrict(active);

  const subType = pickPreferActive(rawProperty, active, ["subType", "sub_type", "property_sub_type"]);
  const storeys = pickPreferActive(rawProperty, active, ["storeys", "storey", "floorCount"]);
  const propSubtypes = pickPreferActive(rawProperty, active, [
    "propertySubtypes",
    "property_subtypes",
    "propertySubtype",
    "subtypes",
    "subtype",
  ]);

  // ✅✅✅ Affordable Housing：严格只读当前 active 表单
  const affordableText = getAffordableTextStrict(active);

  const transitText = getTransitText(rawProperty, active);
  const priceText = getCardPriceText(rawProperty, active);

  const expectedText = getExpectedCompletionText(rawProperty, active);

  // ✅ 完成年份：优先 active + 扫描兜底
  let completedYear = pickPreferActive(rawProperty, active, [
    "completedYear",
    "built_year",
    "completed_year",
    "completionYear",
    "buildYear",
    "build_year",
  ]);
  if (!isNonEmpty(completedYear)) {
    const bestC1 = findBestCompletedYear(active.shared);
    const bestC2 = findBestCompletedYear(active.layout0);
    const bestC3 = findBestCompletedYear(active.form);
    const bestC = bestC1 || bestC2 || bestC3;
    if (bestC && bestC.year) completedYear = String(bestC.year);
  }

  const showStoreys = shouldShowStoreysByCategory(category);
  const showSubtype = shouldShowPropertySubtypeByCategory(category);

  const isNewProject = isNewProjectStatus(propertyStatus);
  const isCompletedUnit = isCompletedUnitStatus(propertyStatus);

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
          <MetaLineDash label="Sale / Rent" value={active.saleType ? String(active.saleType).toUpperCase() : "-"} />
          <MetaLineDash label="Property Usage" value={usage} />
          <MetaLineDash label="Property Title" value={propertyTitle} />
          <MetaLineDash label="Property Status / Sale Type" value={propertyStatus} />
          <MetaLineDash label="Affordable Housing" value={affordableText} />
          <MetaLineDash label="Tenure Type" value={tenure} />

          <MetaLineDash label="Property Category" value={isNonEmpty(category) ? category : "-"} />
          <MetaLineDash label="Sub Type" value={isNonEmpty(subType) ? subType : "-"} />

          {showStoreys && <MetaLineDash label="Storeys" value={isNonEmpty(storeys) ? storeys : "-"} />}
          {showSubtype && (
            <MetaLineDash
              label="Property Subtype"
              value={
                Array.isArray(propSubtypes)
                  ? (propSubtypes.length ? propSubtypes.join(", ") : "-")
                  : (isNonEmpty(propSubtypes) ? propSubtypes : "-")
          }
            />
          )}

          <MetaLineDash label="你的产业步行能到达公共交通吗？" value={transitText} />

          {isNewProject ? (
            <MetaLineDash label="预计完成年份" value={expectedText} />
          ) : isCompletedUnit ? (
            <MetaLineDash label="完成年份" value={isNonEmpty(completedYear) ? completedYear : "-"} />
          ) : (
            <>
              <MetaLineDash label="完成年份" value={isNonEmpty(completedYear) ? completedYear : "-"} />
              <MetaLineDash label="预计完成年份" value={expectedText} />
            </>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <button
          onClick={() => onView(rawProperty)}
          className="h-11 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
        >
          查看
        </button>
        <button
          onClick={() => onEdit(rawProperty)}
          className="h-11 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
        >
          编辑
        </button>
        <button
          onClick={() => onDelete(rawProperty)}
          className="h-11 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
        >
          删除
        </button>
      </div>
    </div>
  );
}

/* =========================
   Page
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
      list = [...list].sort(
        (a, b) => new Date(b?.updated_at || b?.created_at || 0) - new Date(a?.updated_at || a?.created_at || 0)
      );
    } else if (sortKey === "oldest") {
      list = [...list].sort(
        (a, b) => new Date(a?.updated_at || a?.created_at || 0) - new Date(b?.updated_at || b?.created_at || 0)
      );
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
