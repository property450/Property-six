// utils/property/pickers.js

/* =========================
   基础工具
========================= */
export function isNonEmpty(v) {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim() !== "";
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v).length > 0;
  return true;
}

export function safeJson(v) {
  if (!isNonEmpty(v)) return null;
  if (typeof v === "object") return v;
  if (typeof v !== "string") return null;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

export function deepGet(obj, path) {
  if (!obj || !path) return undefined;
  const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean);
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

export function pickAny(obj, candidates) {
  if (!obj) return "";
  for (const c of candidates) {
    const v = c.includes(".") || c.includes("[") ? deepGet(obj, c) : obj?.[c];
    if (isNonEmpty(v)) return v;
  }
  return "";
}

export function normalizeLower(s) {
  return String(s || "").trim().toLowerCase();
}

export function yesNoText(v) {
  if (v === true) return "是";
  if (v === false) return "否";
  if (!isNonEmpty(v)) return "";
  const s = String(v).trim().toLowerCase();
  if (["yes", "y", "true", "1", "是"].includes(s)) return "是";
  if (["no", "n", "false", "0", "否"].includes(s)) return "否";
  return String(v);
}

export function extractNumeric(v) {
  if (!isNonEmpty(v)) return NaN;
  const n = Number(String(v).replace(/,/g, "").replace(/[^\d.]/g, ""));
  return Number.isNaN(n) ? NaN : n;
}

export function money(v) {
  if (!isNonEmpty(v)) return "";
  const n = extractNumeric(v);
  if (Number.isNaN(n)) return "";
  return "RM " + n.toLocaleString("en-MY");
}

/* =========================
   ✅ 智能扫描（关键修复点）
========================= */
export function walkObject(root, visitor, maxDepth = 10) {
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

export function findBestPriceRange(obj) {
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

export function findBestExpectedYearQuarter(obj) {
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

export function findBestCompletedYear(obj) {
  if (!obj || typeof obj !== "object") return null;

  const candidates = [];

  walkObject(obj, (v, p) => {
    if (!(typeof v === "number" || typeof v === "string")) return;

    const s = String(v).trim();
    const y = Number(s);
    if (!(y >= 1900 && y <= 2100)) return;

    const pathLower = normalizeLower(p);

    if (pathLower.includes("expect")) return;

    const score =
      (pathLower.includes("complete") ? 80 : 0) +
      (pathLower.includes("completed") ? 80 : 0) +
      (pathLower.includes("built") ? 60 : 0) +
      (pathLower.includes("year") ? 30 : 0) -
      p.split(".").length;

    if (score < 40) return;

    candidates.push({ score, year: y, path: p });
  });

  if (!candidates.length) return null;
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0];
}

/* =========================
   ✅ Smart finders (STRICT active only)
========================= */
export function findBestActiveValue(active, opts) {
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

      for (const r of pathRejectInclude) {
        if (r && pathLower.includes(normalizeLower(r))) return;
      }

      const isPrimitive = typeof v === "string" || typeof v === "number" || typeof v === "boolean";
      if (!isPrimitive) return;

      const strV = typeof v === "string" ? v.trim() : String(v);
      if (!isNonEmpty(strV)) return;

      let score = 0;
      if (keyExact.length && keyExact.some((k) => keyLower === normalizeLower(k))) {
        score += 120;
      }

      if (keyMustInclude.length) {
        const ok = keyMustInclude.some((k) => keyLower.includes(normalizeLower(k)));
        if (!ok && !keyExact.length) return;
        if (ok) score += 80;
      }

      for (const b of pathBonusInclude) {
        if (b && pathLower.includes(normalizeLower(b))) score += 20;
      }

      score += 10 - Math.min(10, p.split(".").length);
      score += src.weight * 10;

      candidates.push({ score, value: strV });
    });
  }

  if (!candidates.length) return "";
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0].value;
}

export function findBestCategoryStrict(active) {
  return findBestActiveValue(active, {
    keyExact: ["propertyCategory", "property_category"],
    keyMustInclude: ["propertycategory", "property_category", "category"],
    pathBonusInclude: ["property", "type", "selector", "listing", "sale", "rent"],
    pathRejectInclude: ["photo", "image", "gallery", "room", "bed", "bath", "layoutPhoto", "floorplan", "facility"],
  });
}

/* =========================
   ✅ 取值策略（照旧）
========================= */
export function pickPreferActive(raw, active, keys) {
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

export function pickFromActiveOnly(active, keys) {
  const v1 = pickAny(active.shared, keys);
  if (isNonEmpty(v1)) return v1;

  const v2 = pickAny(active.layout0, keys);
  if (isNonEmpty(v2)) return v2;

  const v3 = pickAny(active.form, keys);
  if (isNonEmpty(v3)) return v3;

  return "";
}

export function getAffordableTextStrict(active) {
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
export function shouldShowStoreysByCategory(category) {
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

export function shouldShowPropertySubtypeByCategory(category) {
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

export function formatRange(minV, maxV, formatter) {
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

export function formatCarparks(v) {
  if (!isNonEmpty(v)) return "";
  if (typeof v === "object") {
    const minV = v.min ?? v.from ?? v.minValue;
    const maxV = v.max ?? v.to ?? v.maxValue;
    const r = formatRange(minV, maxV, (n) => String(Math.trunc(n)));
    if (isNonEmpty(r)) return r;
  }
  return String(v);
}

export function getTransitText(raw, active) {
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
   ✅ 价格 & 预计完成（照旧）
========================= */
export function getCardPriceText(raw, active, isNewProjectStatus, isCompletedUnitStatus) {
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

export function getExpectedCompletionText(raw, active) {
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
