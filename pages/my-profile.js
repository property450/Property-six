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
  const parts = String(path)
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .filter(Boolean);
  let cur = obj;
  for (const p of parts) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = cur[p];
  }
  return cur;
}

function walkObject(obj, basePath, cb) {
  if (obj === null || obj === undefined) return;
  if (typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => walkObject(v, basePath.concat(String(i)), cb));
    return;
  }
  Object.entries(obj).forEach(([k, v]) => {
    const p = basePath.concat(k);
    cb(p, v);
    if (v && typeof v === "object") walkObject(v, p, cb);
  });
}

function pickAny(obj, candidates) {
  if (!obj || !candidates || !candidates.length) return "";
  for (const c of candidates) {
    const v = c.includes(".") || c.includes("[") ? deepGet(obj, c) : obj?.[c];
    if (isNonEmpty(v)) return v;
  }
  return "";
}

function pickFromLayouts(layouts, keys) {
  if (!Array.isArray(layouts) || !layouts.length) return "";
  for (const layout of layouts) {
    if (!layout || typeof layout !== "object") continue;
    const v = pickAny(layout, keys);
    if (isNonEmpty(v)) return v;
  }
  return "";
}

function normalizeLower(s) {
  return String(s || "").trim().toLowerCase();
}

function yesNoText(v) {
  const s = String(v ?? "").trim().toLowerCase();
  if (!isNonEmpty(v)) return "";
  if (s === "yes" || s === "true" || s === "1" || s === "是") return "是";
  if (s === "no" || s === "false" || s === "0" || s === "否") return "否";
  return String(v).trim();
}

function toNumberMaybe(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return isFinite(v) ? v : null;
  const s = String(v).replace(/,/g, "").trim();
  if (!s) return null;
  const n = Number(s);
  return isFinite(n) ? n : null;
}

function formatRM(n) {
  if (n === null || n === undefined) return "";
  const num = Number(n);
  if (!isFinite(num)) return "";
  return num.toLocaleString("en-MY", { maximumFractionDigits: 0 });
}

function joinText(arr) {
  if (!Array.isArray(arr)) return "";
  const a = arr.filter((x) => isNonEmpty(x)).map((x) => String(x).trim());
  return a.length ? a.join(", ") : "";
}

/* =========================
   Sale Type / Status 判断
========================= */
function isNewProjectStatus(propertyStatus) {
  const s = normalizeLower(propertyStatus);
  return s.includes("new project") || s.includes("under construction");
}

function isCompletedUnitStatus(propertyStatus) {
  const s = normalizeLower(propertyStatus);
  return s.includes("completed unit") || s.includes("developer unit");
}

/* =========================
   预计完成年份（New Project）
========================= */
function findBestExpectedYearQuarter(raw, active) {
  const yearPaths = [];
  const quarterPaths = [];

  const searchTargets = [
    { obj: active?.shared, label: "shared" },
    { obj: active?.layout0, label: "layout0" },
    { obj: Array.isArray(active?.layouts) ? active.layouts : null, label: "layouts" },
    { obj: active?.form, label: "form" },
    { obj: raw, label: "raw" },
  ];

  const addIfYear = (path, v) => {
    const s = String(v ?? "").trim();
    if (!/^(19\d{2}|20\d{2})$/.test(s)) return;
    yearPaths.push({ year: s, path: path.join("."), from: "scan" });
  };

  const addIfQuarter = (path, v) => {
    const s = String(v ?? "").trim().toUpperCase();
    if (!/^Q[1-4]$/.test(s)) return;
    quarterPaths.push({ quarter: s, path: path.join("."), from: "scan" });
  };

  // 优先用“当前表单优先”的 pickProjectActive 找常见键
  const expectedYear = pickProjectActive(raw, active, [
    "expectedCompletionYear",
    "expected_completion_year",
    "expectedYear",
    "expected_year",
    "completionYearExpected",
    "completion_year_expected",
    "buildYear.expected",
    "buildYear.expectedYear",
    "buildYear.year",
  ]);
  const expectedQuarter = pickProjectActive(raw, active, [
    "expectedCompletionQuarter",
    "expected_completion_quarter",
    "expectedQuarter",
    "expected_quarter",
    "completionQuarterExpected",
    "completion_quarter_expected",
    "buildYear.expectedQuarter",
    "buildYear.quarter",
  ]);

  // 如果 pickProjectActive 有就直接用
  if (isNonEmpty(expectedYear)) {
    return {
      year: String(expectedYear).trim(),
      quarter: isNonEmpty(expectedQuarter) ? String(expectedQuarter).trim().toUpperCase() : null,
      yearPath: "pickProjectActive",
      quarterPath: "pickProjectActive",
    };
  }

  // 否则扫描（shared/layouts/form/raw）
  for (const t of searchTargets) {
    if (!t.obj) continue;
    if (Array.isArray(t.obj)) {
      t.obj.forEach((o, idx) => {
        walkObject(o, [t.label, String(idx)], (path, value) => {
          const last = String(path[path.length - 1] || "").toLowerCase();
          const full = path.join(".").toLowerCase();
          if (last.includes("year") || full.includes("completion") || full.includes("expected")) addIfYear(path, value);
          if (last.includes("quarter") || full.includes("quarter") || /^q[1-4]$/.test(String(value || "").toLowerCase()))
            addIfQuarter(path, value);
        });
      });
    } else {
      walkObject(t.obj, [t.label], (path, value) => {
        const last = String(path[path.length - 1] || "").toLowerCase();
        const full = path.join(".").toLowerCase();
        if (last.includes("year") || full.includes("completion") || full.includes("expected")) addIfYear(path, value);
        if (last.includes("quarter") || full.includes("quarter") || /^q[1-4]$/.test(String(value || "").toLowerCase()))
          addIfQuarter(path, value);
      });
    }
  }

  const bestYear = yearPaths.length ? yearPaths[yearPaths.length - 1] : null;
  const bestQuarter = quarterPaths.length ? quarterPaths[quarterPaths.length - 1] : null;

  return {
    year: bestYear ? bestYear.year : "",
    quarter: bestQuarter ? bestQuarter.quarter : null,
    yearPath: bestYear ? bestYear.path : "",
    quarterPath: bestQuarter ? bestQuarter.path : null,
  };
}

function findBestCompletedYear(raw, active) {
  // Completed Unit / Developer Unit 的“完成年份”可能在 shared / single_form / layouts 内不同字段
  const candidates = [
    // 最常见
    "completedYear",
    "completed_year",
    "completionYear",
    "built_year",
    "builtYear",
    // 可能包在 buildYear 结构里
    "buildYear.completed",
    "buildYear.completedYear",
    "buildYear.year",
    // v2 结构/旧结构可能用的名字
    "completedUnitYear",
    "completed_unit_year",
    "completed_unit_completed_year",
    "completedUnit.completedYear",
    "completedUnit.year",
  ];

  // 先用“当前表单优先”的策略找
  const direct = pickProjectActive(raw, active, candidates);
  if (isNonEmpty(direct)) return { year: String(direct).trim(), path: "pickProjectActive" };

  // 最后 fallback：在 raw 整体扫描（只取像年份的）
  const yearCandidates = [];
  walkObject(raw, [], (path, value) => {
    const last = String(path[path.length - 1] || "").toLowerCase();
    const full = path.join(".");
    if (!/year/.test(last) && !/year/.test(full.toLowerCase())) return;
    const s = String(value ?? "").trim();
    if (!/^(19\d{2}|20\d{2})$/.test(s)) return;
    yearCandidates.push({ year: s, path: full });
  });

  // 取最新（最后出现的）更符合“后来保存覆盖”的直觉
  const best = yearCandidates.length ? yearCandidates[yearCandidates.length - 1] : null;
  return { year: best ? best.year : "", path: best ? best.path : "" };
}

/* =========================
   当前表单数据源选择（最关键）
========================= */
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
    return {
      mode: "project",
      saleType: "sale",
      propertyStatus,
      shared: typeFormV2,
      form: singleFormV2,
      layout0,
      layouts: Array.isArray(ul) ? ul : null,
    };
  }

  if (saleType === "sale" || saleType === "rent") {
    return { mode: saleType, saleType, propertyStatus, shared: null, form: singleFormV2, layout0: null, layouts: null };
  }

  if (saleType === "homestay") {
    return { mode: "homestay", saleType, propertyStatus, shared: null, form: homestayForm, layout0: null, layouts: null };
  }

  if (saleType === "hotel/resort" || saleType === "hotel" || saleType === "resort") {
    return { mode: "hotel/resort", saleType: "hotel/resort", propertyStatus, shared: null, form: hotelForm, layout0: null, layouts: null };
  }

  return { mode: "unknown", saleType, propertyStatus, shared: null, form: singleFormV2, layout0: null, layouts: null };
}

function pickActive(raw, active, keys) {
  const v0 = pickAny(raw, keys);
  if (isNonEmpty(v0)) return v0;

  const v1 = pickAny(active.shared, keys);
  if (isNonEmpty(v1)) return v1;

  const v2 = pickAny(active.layout0, keys);
  if (isNonEmpty(v2)) return v2;

  const v2b = pickFromLayouts(active.layouts, keys);
  if (isNonEmpty(v2b)) return v2b;

  const v3 = pickAny(active.form, keys);
  if (isNonEmpty(v3)) return v3;

  return "";
}

function pickProjectActive(raw, active, keys) {
  const v1 = pickAny(active.shared, keys);
  if (isNonEmpty(v1)) return v1;

  const v2 = pickAny(active.layout0, keys);
  if (isNonEmpty(v2)) return v2;

  const v2b = pickFromLayouts(active.layouts, keys);
  if (isNonEmpty(v2b)) return v2b;

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
  const NEED_STOREYS_CATEGORY = [
    "bungalow / villa",
    "business property",
    "industrial property",
    "semi-detached house",
    "terrace / link house",
  ];
  return NEED_STOREYS_CATEGORY.includes(c);
}

function shouldShowPropertySubtypeByCategory(category) {
  const c = normalizeLower(category);
  return c === "apartment / condo / service residence" || c === "business property" || c === "industrial property";
}

/* =========================
   公共交通显示：没选 = "-"
========================= */
function getTransitText(raw, active) {
  const transit = pickActive(raw, active, ["transit", "publicTransit", "walkToTransit", "walk_to_transit"]);
  const yn = yesNoText(transit);
  if (!isNonEmpty(yn)) return "-";
  if (yn !== "是") return "否";

  const line = pickActive(raw, active, ["transitLine", "transit_line", "line"]);
  const station = pickActive(raw, active, ["transitStation", "transit_station", "station"]);
  const parts = [];
  if (isNonEmpty(line)) parts.push(`线路：${line}`);
  if (isNonEmpty(station)) parts.push(`站点：${station}`);
  return parts.length ? `是｜${parts.join("｜")}` : "是";
}

/* =========================
   价格显示（保持你原本的逻辑）
========================= */
function getCardPriceText(raw, active) {
  const price = pickActive(raw, active, ["price", "Price", "salePrice", "rentPrice", "rent_price"]);
  const priceData = safeJson(pickActive(raw, active, ["priceData", "price_data", "pricedata"]));

  const minPrice =
    toNumberMaybe(pickActive(raw, active, ["minPrice", "min_price"])) ??
    (priceData ? toNumberMaybe(priceData.min) ?? toNumberMaybe(priceData.minPrice) : null);

  const maxPrice =
    toNumberMaybe(pickActive(raw, active, ["maxPrice", "max_price"])) ??
    (priceData ? toNumberMaybe(priceData.max) ?? toNumberMaybe(priceData.maxPrice) : null);

  // 如果有 min/max：范围
  if (minPrice !== null && maxPrice !== null) {
    return `RM ${formatRM(minPrice)} ~ RM ${formatRM(maxPrice)}`;
  }

  // 如果只存了一个 price
  const single = toNumberMaybe(price);
  if (single !== null) return `RM ${formatRM(single)}`;

  // 兜底：如果是对象
  if (priceData && (toNumberMaybe(priceData.min) !== null || toNumberMaybe(priceData.max) !== null)) {
    const a = toNumberMaybe(priceData.min);
    const b = toNumberMaybe(priceData.max);
    if (a !== null && b !== null) return `RM ${formatRM(a)} ~ RM ${formatRM(b)}`;
    if (a !== null) return `RM ${formatRM(a)}`;
    if (b !== null) return `RM ${formatRM(b)}`;
  }

  return "-";
}

/* =========================
   预计完成年份显示（New Project）
========================= */
function getExpectedCompletionText(raw, active) {
  const { year, quarter } = findBestExpectedYearQuarter(raw, active);
  if (!isNonEmpty(year)) return "-";
  return quarter ? `${year} ${quarter}` : `${year}`;
}

/* =========================
   UI 组件
========================= */
function MetaLineDash({ label, value }) {
  const v = isNonEmpty(value) ? value : "-";
  return (
    <div className="text-sm text-gray-800">
      <span className="text-gray-700">{label}：</span>
      <span>{v}</span>
    </div>
  );
}

function IconLine({ bedrooms, bathrooms, carparkText }) {
  return (
    <div className="flex items-center gap-4 text-sm text-gray-800 mt-2">
      <div className="flex items-center gap-1">
        <span>↔</span>
        <span>{isNonEmpty(bedrooms) ? bedrooms : "-"}</span>
      </div>
      <div className="flex items-center gap-1">
        <span>🛁</span>
        <span>{isNonEmpty(bathrooms) ? bathrooms : "-"}</span>
      </div>
      <div className="flex items-center gap-1">
        <span>🚗</span>
        <span>{isNonEmpty(carparkText) ? carparkText : "-"}</span>
      </div>
    </div>
  );
}

/* =========================
   卡片（卖家后台显示）
========================= */
function PropertyCard({ rawProperty, onView, onEdit, onDelete }) {
  const router = useRouter();

  const active = useMemo(() => resolveActiveSources(rawProperty), [rawProperty]);

  const title = pickAny(rawProperty, ["title", "property_title", "projectName", "name"]) || "-";
  const address = pickAny(rawProperty, ["address", "location", "shortAddress", "short_address"]) || "-";

  const saleTypeRaw = pickAny(rawProperty, ["saleType", "sale_type", "saletype", "listing_mode"]);
  const saleType = isNonEmpty(saleTypeRaw) ? String(saleTypeRaw).toUpperCase() : "-";

  const propertyUsage = pickActive(rawProperty, active, ["usage", "propertyUsage", "property_usage"]) || "-";
  const propertyTitle = pickActive(rawProperty, active, ["propertyTitle", "property_title", "titleType", "title_type"]) || "-";
  const propertyStatus = pickAny(rawProperty, ["propertyStatus", "property_status", "propertystatus"]) || "-";

  const tenure = pickActive(rawProperty, active, ["tenure", "tenureType", "tenure_type"]) || "-";

  const category = pickActive(rawProperty, active, ["category", "propertyCategory", "property_category"]) || "-";
  const subType = pickActive(rawProperty, active, ["subType", "sub_type", "propertySubType", "property_sub_type"]) || "-";

  const storeys = pickActive(rawProperty, active, ["storeys", "Storeys", "floors", "floorCount", "floor_count"]) || "-";
  const propSubtypesRaw = pickActive(rawProperty, active, ["propertySubtypes", "property_subtypes", "propertySubtype", "subtypes", "subtype"]);

  const affordableRaw = (active.mode === "project")
    ? pickProjectActive(rawProperty, active, ["affordable", "affordable_housing", "affordableHousing"])
    : pickActive(rawProperty, active, ["affordable", "affordable_housing", "affordableHousing"]);
  const affordableType = (active.mode === "project")
    ? pickProjectActive(rawProperty, active, ["affordableType", "affordable_housing_type", "affordableHousingType"])
    : pickActive(rawProperty, active, ["affordableType", "affordable_housing_type", "affordableHousingType"]);
  let affordable = yesNoText(affordableRaw);
  if (isNonEmpty(affordableType) && affordable !== "是") affordable = "是";
  const affordableText =
    affordable === "是" && isNonEmpty(affordableType)
      ? `是（${affordableType}）`
      : (isNonEmpty(affordable) ? affordable : "-");

  const transitText = getTransitText(rawProperty, active);

  const priceText = getCardPriceText(rawProperty, active);

  const expectedText = getExpectedCompletionText(rawProperty, active);
  const completedYear = isCompletedUnitStatus(propertyStatus)
    ? (findBestCompletedYear(rawProperty, active).year || "")
    : pickActive(rawProperty, active, ["completedYear", "built_year", "completed_year", "completionYear"]);

  const showStoreys = shouldShowStoreysByCategory(category);
  const showSubtype = shouldShowPropertySubtypeByCategory(category);

  // bedrooms/bathrooms/carpark
  const bedrooms =
    pickActive(rawProperty, active, ["bedrooms", "bedroom", "rooms", "roomCount", "room_count"]) || "-";
  const bathrooms =
    pickActive(rawProperty, active, ["bathrooms", "bathroom", "baths", "bathCount", "bath_count"]) || "-";

  // carpark 可能是单值或范围对象
  const carparkVal = pickActive(rawProperty, active, ["carpark", "carparks", "carparkCount", "carpark_count"]);
  const carparkRange = safeJson(pickActive(rawProperty, active, ["carparkRange", "carpark_range"]));
  let carparkText = "";

  const rangeObj = carparkRange && typeof carparkRange === "object" ? carparkRange : (typeof carparkVal === "object" ? carparkVal : null);
  if (rangeObj && (isNonEmpty(rangeObj.min) || isNonEmpty(rangeObj.max))) {
    const min = isNonEmpty(rangeObj.min) ? String(rangeObj.min).trim() : "";
    const max = isNonEmpty(rangeObj.max) ? String(rangeObj.max).trim() : "";
    if (min && max) carparkText = `${min} ~ ${max}`;
    else if (min) carparkText = min;
    else if (max) carparkText = max;
  } else if (isNonEmpty(carparkVal) && typeof carparkVal !== "object") {
    carparkText = String(carparkVal).trim();
  } else {
    carparkText = "-";
  }

  // propertySubtypes 可能是数组
  const propSubtypes = Array.isArray(propSubtypesRaw)
    ? joinText(propSubtypesRaw)
    : (isNonEmpty(propSubtypesRaw) ? String(propSubtypesRaw) : "-");

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="min-w-0">
        <div className="text-lg font-semibold text-gray-900 truncate">{title}</div>
        <div className="text-sm text-gray-600 mt-1 truncate">{address}</div>

        <div className="text-base font-semibold text-blue-700 mt-2">{priceText}</div>

        <IconLine bedrooms={bedrooms} bathrooms={bathrooms} carparkText={carparkText} />

        <div className="mt-3 space-y-1">
          <MetaLineDash label="Sale / Rent" value={saleType} />

          <MetaLineDash label="Property Usage" value={propertyUsage} />
          <MetaLineDash label="Property Title" value={propertyTitle} />
          <MetaLineDash label="Property Status / Sale Type" value={propertyStatus} />

          <MetaLineDash label="Affordable Housing" value={affordableText} />
          <MetaLineDash label="Tenure Type" value={tenure} />

          <MetaLineDash label="Property Category" value={category} />
          <MetaLineDash label="Sub Type" value={subType} />

          {showStoreys ? <MetaLineDash label="Storeys" value={storeys} /> : null}

          {showSubtype ? (
            <MetaLineDash
              label="Property Subtype"
              value={isNonEmpty(propSubtypes) ? propSubtypes : "-"}
            />
          ) : null}

          <MetaLineDash label="你的产业步行能到达公共交通吗？" value={transitText} />

          {isNewProjectStatus(propertyStatus) ? (
            <MetaLineDash label="预计完成年份" value={expectedText} />
          ) : isCompletedUnitStatus(propertyStatus) ? (
            <MetaLineDash label="完成年份" value={isNonEmpty(completedYear) ? completedYear : "-"} />
          ) : (
            <MetaLineDash label="完成年份" value={isNonEmpty(completedYear) ? completedYear : "-"} />
          )}
        </div>

        <div className="mt-4 flex gap-3">
          <button
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
            onClick={() => onView?.(rawProperty)}
          >
            查看
          </button>
          <button
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
            onClick={() => onEdit?.(rawProperty)}
          >
            编辑
          </button>
          <button
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg"
            onClick={() => onDelete?.(rawProperty)}
          >
            删除
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================
   页面
========================= */
export default function MyProfilePage() {
  const user = useUser();
  const router = useRouter();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");

  async function fetchMyProperties() {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false, nullsFirst: false });

    if (error) {
      console.error(error);
      toast.error("加载失败");
    } else {
      setProperties(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!user) return;
    fetchMyProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const filtered = useMemo(() => {
    if (!keyword.trim()) return properties;
    const k = keyword.trim().toLowerCase();
    return properties.filter((p) => {
      const t = String(p?.title || p?.property_title || p?.name || "").toLowerCase();
      const a = String(p?.address || p?.location || "").toLowerCase();
      return t.includes(k) || a.includes(k);
    });
  }, [properties, keyword]);

  const onView = (p) => {
    const id = p?.id;
    if (!id) return;
    router.push(`/property/${id}`);
  };

  const onEdit = (p) => {
    const id = p?.id;
    if (!id) return;
    router.push(`/upload-property?edit=1&id=${id}`);
  };

  const onDelete = async (p) => {
    const id = p?.id;
    if (!id) return;
    const ok = confirm("确定要删除这个房源吗？");
    if (!ok) return;

    const { error } = await supabase.from("properties").delete().eq("id", id);
    if (error) {
      console.error(error);
      toast.error("删除失败");
      return;
    }
    toast.success("已删除");
    fetchMyProperties();
  };

  if (!user) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="text-gray-900 font-semibold text-lg">请先登录</div>
          <button
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
            onClick={() => router.push("/login")}
          >
            去登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="text-2xl font-bold text-gray-900">我的房源</div>
      </div>

      <div className="mt-4">
        <input
          className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="输入标题或地点..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="text-gray-600">加载中...</div>
        ) : filtered.length === 0 ? (
          <div className="text-gray-600">没有符合条件的房源。</div>
        ) : (
          <div className="space-y-4">
            {filtered.map((p) => (
              <PropertyCard
                key={p.id}
                rawProperty={p}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
