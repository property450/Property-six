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
   ✅ 只读“当前表单”的数据源（彻底防串台）
========================= */
function isNewProjectStatus(propertyStatus) {
  const s = normalizeLower(propertyStatus);
  return s.includes("new project") || s.includes("under construction");
}
function isCompletedUnitStatus(propertyStatus) {
  const s = normalizeLower(propertyStatus);
  return s.includes("completed unit") || s.includes("developer unit");
}

/**
 * active = 你最后保存的那套表单
 * - Project: shared(type_form_v2) + layout0(unit_layouts[0])
 * - Non-project sale/rent: single_form_data_v2
 * - homestay/hotel: homestay_form / hotel_resort_form
 */
function resolveActiveSources(raw) {
  const saleTypeRaw = pickAny(raw, ["saleType", "sale_type", "saletype", "listing_mode"]);
  const saleType = normalizeLower(saleTypeRaw);
  const propertyStatus = pickAny(raw, ["propertyStatus", "property_status", "propertystatus"]);

  // 读取 JSON（只解析，不 merge）
  const typeFormV2 = safeJson(raw.type_form_v2) || safeJson(raw.type_form) || null;
  const singleFormV2 = safeJson(raw.single_form_data_v2) || safeJson(raw.single_form_data) || null;
  const homestayForm = safeJson(raw.homestay_form) || null;
  const hotelForm = safeJson(raw.hotel_resort_form) || null;

  // unit_layouts[0]
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

  // 你有时 finalType 会写成 "Hotel / Resort"
  const finalType = normalizeLower(pickAny(raw, ["finalType"]));
  if (saleType === "hotel/resort" || finalType.includes("hotel")) {
    return { mode: "hotel/resort", saleType: "hotel/resort", propertyStatus, shared: null, form: hotelForm, layout0: null };
  }

  // fallback（还是只读 single）
  return { mode: "unknown", saleType, propertyStatus, shared: null, form: singleFormV2, layout0: null };
}

function pickActive(raw, active, keys) {
  // ✅ 只按 “raw顶层 -> shared -> layout0 -> form” 取值（不会跨其它表单）
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

/* =========================
   你表单一致的显示规则
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
    // {min,max}
    const minV = v.min ?? v.from ?? v.minValue;
    const maxV = v.max ?? v.to ?? v.maxValue;
    const r = formatRange(minV, maxV, (n) => String(Math.trunc(n)));
    if (isNonEmpty(r)) return r;
  }
  return String(v);
}

function getTransitText(raw, active) {
  const near = pickActive(raw, active, [
    "transit.nearTransit",
    "nearTransit",
    "transitNearTransit",
  ]);

  if (!isNonEmpty(near)) return "-";

  const yn = yesNoText(near);
  if (!isNonEmpty(yn)) return "-";
  if (yn === "否") return "否";

  const lines = pickActive(raw, active, ["transit.selectedLines", "selectedLines"]);
  const stations = pickActive(raw, active, ["transit.selectedStations", "selectedStations"]);

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

function getExpectedCompletionText(raw, active) {
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

  if (!isNonEmpty(year)) return "-";
  if (!isNonEmpty(quarter)) return String(year);

  let q = String(quarter).trim();
  const qLower = q.toLowerCase();
  if (qLower.startsWith("q")) q = q.toUpperCase();
  else q = `Q${q}`;

  return `${year} ${q}`;
}

function getCardPriceText(raw, active) {
  const propertyStatus = active.propertyStatus || pickAny(raw, ["propertyStatus", "property_status", "propertystatus"]);
  const isProject = isNewProjectStatus(propertyStatus) || isCompletedUnitStatus(propertyStatus);

  // 1) 顶层 price_min/price_max
  if (isNonEmpty(raw.price_min) && isNonEmpty(raw.price_max)) {
    const r = formatRange(raw.price_min, raw.price_max, (n) => money(n));
    if (isNonEmpty(r) && r.includes("~")) return r;
  }

  // 2) Project：读 priceData min/max
  if (isProject) {
    const pd = pickActive(raw, active, ["priceData", "pricedata", "price_data"]);
    const pdObj = safeJson(pd) ?? pd;

    if (pdObj && typeof pdObj === "object") {
      const minV = pickAny(pdObj, ["min", "minPrice", "min_value", "minValue", "from"]);
      const maxV = pickAny(pdObj, ["max", "maxPrice", "max_value", "maxValue", "to"]);
      const r = formatRange(minV, maxV, (n) => money(n));
      if (isNonEmpty(r) && r.includes("~")) return r;
      if (isNonEmpty(r)) return r;
    }
  }

  // 3) 单价
  const single = pickActive(raw, active, ["price", "amount", "price_min", "price_max"]);
  if (isNonEmpty(single)) return money(single);

  return "-";
}

/* =========================
   UI 小组件：没选就 "-"
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

  const affordableRaw = pickActive(rawProperty, active, ["affordable", "affordable_housing", "affordableHousing"]);
  const affordableType = pickActive(rawProperty, active, ["affordableType", "affordable_housing_type", "affordableHousingType"]);
  let affordable = yesNoText(affordableRaw);
  if (isNonEmpty(affordableType) && affordable !== "是") affordable = "是";
  const affordableText = affordable === "是" && isNonEmpty(affordableType) ? `是（${affordableType}）` : (isNonEmpty(affordable) ? affordable : "-");

  const transitText = getTransitText(rawProperty, active);

  const priceText = getCardPriceText(rawProperty, active);

  const expectedText = getExpectedCompletionText(rawProperty, active);
  const completedYear = pickActive(rawProperty, active, ["completedYear", "built_year", "completed_year", "completionYear"]);

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
          {showSubtype && <MetaLineDash label="Property Subtype" value={Array.isArray(propSubtypes) ? propSubtypes.join(", ") : propSubtypes} />}

          <MetaLineDash label="你的产业步行能到达公共交通吗？" value={transitText} />

          {/* ✅ New Project：只显示预计完成年份（含季度）；不显示完成年份 */}
          {isNewProjectStatus(propertyStatus) ? (
            <MetaLineDash label="预计完成年份" value={expectedText} />
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
              <SellerPropertyCard
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
