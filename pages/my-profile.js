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
  for (const c of candidates) {
    const v = c.includes(".") || c.includes("[") ? deepGet(obj, c) : obj?.[c];
    if (isNonEmpty(v)) return v;
  }
  return "";
}

function toText(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "是" : "否";
  if (Array.isArray(v)) return v.filter(isNonEmpty).map(String).join(", ");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
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

function extractNumeric(x) {
  if (!isNonEmpty(x)) return NaN;
  const n = Number(String(x).replace(/,/g, "").replace(/[^\d.]/g, ""));
  return Number.isNaN(n) ? NaN : n;
}

function money(v) {
  if (!isNonEmpty(v)) return "";
  const n = extractNumeric(v);
  if (Number.isNaN(n)) return "";
  return "RM " + n.toLocaleString("en-MY");
}

/* ✅ 永远显示：没值就 "-"（你要求：没选就显示 -） */
function MetaLineDash({ label, value }) {
  const show = isNonEmpty(value) ? toText(value) : "-";
  return (
    <div className="text-sm text-gray-700 leading-6">
      <span className="text-gray-500">{label}：</span>
      <span className="text-gray-900">{show}</span>
    </div>
  );
}

/* =========================
   ✅ 关键：只解析 JSON，不做“跨表单补值”
   （避免你截图那种：Category=Land 但 SubType=Apartment 的污染）
========================= */
function buildParsed(raw) {
  const p = raw || {};
  const parsed = { ...p };

  parsed.__json = {
    type_form_v2: safeJson(p.type_form_v2),
    type_form: safeJson(p.type_form),
    single_form_data_v2: safeJson(p.single_form_data_v2),
    single_form_data: safeJson(p.single_form_data),
    homestay_form: safeJson(p.homestay_form),
    hotel_resort_form: safeJson(p.hotel_resort_form),
  };

  // unit_layouts（New Project / Completed Unit 常用）
  let ul = p.unit_layouts ?? p.unitLayouts ?? p.unitlayouts;
  ul = safeJson(ul) ?? ul;
  parsed.__unitLayouts = Array.isArray(ul) ? ul : [];
  parsed.__layout0 = parsed.__unitLayouts[0] && typeof parsed.__unitLayouts[0] === "object" ? parsed.__unitLayouts[0] : null;

  return parsed;
}

/* =========================
   模式识别 + “只读当前表单”
========================= */
function norm(s) {
  return String(s || "").trim().toLowerCase();
}

function isNewProjectStatus(propertyStatus) {
  const s = norm(propertyStatus);
  return s.includes("new project") || s.includes("under construction");
}
function isCompletedUnitStatus(propertyStatus) {
  const s = norm(propertyStatus);
  return s.includes("completed unit") || s.includes("developer unit");
}

function getModeSources(p) {
  // saleType 尽量从顶层拿（你保存时会写）
  const saleTypeRaw = pickAny(p, ["saleType", "sale_type", "saletype", "listing_mode"]);
  const saleType = norm(saleTypeRaw);

  // propertyStatus 也优先顶层
  const propertyStatusRaw = pickAny(p, ["propertyStatus", "property_status", "propertystatus"]);
  const propertyStatus = String(propertyStatusRaw || "").trim();

  const isProject = isNewProjectStatus(propertyStatus) || isCompletedUnitStatus(propertyStatus);

  // ✅ Project：只读 type_form_v2（shared） + unit_layouts[0]（layout）
  if (isProject) {
    const shared = p.__json?.type_form_v2 || p.__json?.type_form || null;
    const layout0 = p.__layout0 || null;
    return { saleType: "sale", propertyStatus, isProject: true, shared, layout0, form: null };
  }

  // ✅ 非 Project Sale/Rent：只读 single_form_data_v2（或 single_form_data）
  if (saleType === "sale" || saleType === "rent") {
    const form = p.__json?.single_form_data_v2 || p.__json?.single_form_data || null;
    return { saleType, propertyStatus, isProject: false, shared: null, layout0: null, form };
  }

  // ✅ Homestay / Hotel
  if (saleType === "homestay") {
    const form = p.__json?.homestay_form || null;
    return { saleType, propertyStatus, isProject: false, shared: null, layout0: null, form };
  }
  if (saleType === "hotel/resort") {
    const form = p.__json?.hotel_resort_form || null;
    return { saleType, propertyStatus, isProject: false, shared: null, layout0: null, form };
  }

  return { saleType, propertyStatus, isProject: false, shared: null, layout0: null, form: null };
}

/* =========================
   从当前 sources 取值（不会跨表单）
========================= */
function pickFromSources(src, keys) {
  // 优先：顶层字段（你有些东西会直接写 column）
  // 再：project shared / layout0 / form
  const { raw, shared, layout0, form } = src;

  const v1 = pickAny(raw, keys);
  if (isNonEmpty(v1)) return v1;

  const v2 = pickAny(shared, keys);
  if (isNonEmpty(v2)) return v2;

  const v3 = pickAny(layout0, keys);
  if (isNonEmpty(v3)) return v3;

  const v4 = pickAny(form, keys);
  if (isNonEmpty(v4)) return v4;

  return "";
}

/* =========================
   Storeys / Property Subtype 是否显示（跟你表单一致）
========================= */
function normalizeCat(category) {
  return norm(category);
}

// 你的 NEED_STOREYS_CATEGORY：Bungalow/Villa, Business, Industrial, Semi-D, Terrace/Link
function shouldShowStoreysByCategory(category) {
  const c = normalizeCat(category);
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

// 你 Property Subtype 只在 Apartment/Business/Industrial 这类出现
function shouldShowPropertySubtypeByCategory(category) {
  const c = normalizeCat(category);
  if (!c) return false;
  return (
    c.includes("apartment") ||
    c.includes("condo") ||
    c.includes("service residence") ||
    c.includes("business") ||
    c.includes("industrial")
  );
}

/* =========================
   交通：没选就 "-"
========================= */
function getTransitTextFromSources(src) {
  const near = pickFromSources(src, [
    "transit.nearTransit",
    "nearTransit",
    "transitNearTransit",
  ]);

  if (!isNonEmpty(near)) return "-";

  const yn = yesNoText(near);
  if (!isNonEmpty(yn)) return "-";
  if (yn === "否") return "否";

  const lines = pickFromSources(src, ["transit.selectedLines", "selectedLines"]);
  const stations = pickFromSources(src, ["transit.selectedStations", "selectedStations"]);

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
   ✅ 预计完成年份 + 季度（New Project）
========================= */
function getExpectedCompletionTextFromSources(src) {
  const year = pickFromSources(src, [
    "expectedCompletedYear",
    "expected_year",
    "expectedYear",
    "expectedCompletionYear",
    "completionExpectedYear",
  ]);

  const quarter = pickFromSources(src, [
    "expectedCompletedQuarter",
    "expected_quarter",
    "expectedQuarter",
    "expectedCompletionQuarter",
    "completionExpectedQuarter",
  ]);

  if (!isNonEmpty(year)) return "-";

  if (!isNonEmpty(quarter)) return String(year);

  let q = String(quarter).trim();
  if (norm(q).startsWith("q")) q = q.toUpperCase();
  else q = `Q${q}`;

  return `${year} ${q}`;
}

/* =========================
   ✅ 价格：Project 优先范围（price_min/max 或 priceData min/max）
========================= */
function getCardPriceTextFromSources(mode, src) {
  const rp = src.raw || {};

  // Project：必须优先 range
  if (mode.isProject) {
    const hasMin = isNonEmpty(rp.price_min);
    const hasMax = isNonEmpty(rp.price_max);

    const minNum = hasMin ? extractNumeric(rp.price_min) : NaN;
    const maxNum = hasMax ? extractNumeric(rp.price_max) : NaN;

    // 1) 顶层 price_min/price_max
    if (hasMin && hasMax && !Number.isNaN(minNum) && !Number.isNaN(maxNum) && minNum !== maxNum) {
      return `${money(rp.price_min)} ~ ${money(rp.price_max)}`;
    }

    // 2) shared/layout0 的 priceData
    const pd = pickAny(src.shared, ["priceData", "pricedata", "price_data"]) || pickAny(src.layout0, ["priceData", "pricedata", "price_data"]);
    const pdObj = safeJson(pd) ?? pd;

    if (pdObj && typeof pdObj === "object") {
      const minV = pickAny(pdObj, ["min", "minPrice", "min_value", "minValue", "from"]);
      const maxV = pickAny(pdObj, ["max", "maxPrice", "max_value", "maxValue", "to"]);
      const minP = extractNumeric(minV);
      const maxP = extractNumeric(maxV);
      if (!Number.isNaN(minP) && !Number.isNaN(maxP) && minP !== maxP) {
        return `${money(minP)} ~ ${money(maxP)}`;
      }
      if (!Number.isNaN(minP)) return money(minP);
      if (!Number.isNaN(maxP)) return money(maxP);
    }

    // 3) 最后才回落单价（避免你一直被单价覆盖）
    const singleTop = isNonEmpty(rp.price) ? money(rp.price) : "";
    if (isNonEmpty(singleTop)) return singleTop;

    const singleShared = pickAny(src.shared, ["price", "amount"]);
    if (isNonEmpty(singleShared)) return money(singleShared);

    const singleLayout = pickAny(src.layout0, ["price", "amount"]);
    if (isNonEmpty(singleLayout)) return money(singleLayout);

    return "";
  }

  // 非 Project：range（有就显示），否则单价
  const hasMin = isNonEmpty(rp.price_min);
  const hasMax = isNonEmpty(rp.price_max);
  const minNum = hasMin ? extractNumeric(rp.price_min) : NaN;
  const maxNum = hasMax ? extractNumeric(rp.price_max) : NaN;
  if (hasMin && hasMax && !Number.isNaN(minNum) && !Number.isNaN(maxNum) && minNum !== maxNum) {
    return `${money(rp.price_min)} ~ ${money(rp.price_max)}`;
  }

  const single = pickFromSources(src, ["price", "amount", "price_min", "price_max"]);
  return isNonEmpty(single) ? money(single) : "";
}

/* =========================
   Card（卖家后台卡片）
========================= */
function SellerPropertyCard({ rawProperty, onView, onEdit, onDelete }) {
  const p = useMemo(() => buildParsed(rawProperty), [rawProperty]);
  const mode = useMemo(() => getModeSources(p), [p]);

  const src = useMemo(
    () => ({
      raw: rawProperty,
      shared: mode.shared,
      layout0: mode.layout0,
      form: mode.form,
    }),
    [rawProperty, mode.shared, mode.layout0, mode.form]
  );

  // 基础展示（顶层）
  const title = pickAny(rawProperty, ["title"]);
  const address = pickAny(rawProperty, ["address"]);

  // 你这里 “Studio” 通常存在 bedrooms 字段里
  const bedrooms = pickFromSources(src, ["bedrooms", "bedroom_count", "room_count"]);
  const bathrooms = pickFromSources(src, ["bathrooms", "bathroom_count"]);
  const carparks = pickFromSources(src, ["carparks", "carpark", "carparkCount", "carpark_count"]);

  // Sale/Rent/Homestay/Hotel（严格用 mode.saleType）
  const showSale = mode.saleType === "sale";
  const showRent = mode.saleType === "rent";
  const showHomestay = mode.saleType === "homestay";
  const showHotel = mode.saleType === "hotel/resort";

  // 业务字段（只读当前表单 sources）
  const usage = pickFromSources(src, ["usage", "property_usage"]);
  const propertyTitle = pickFromSources(src, ["propertyTitle", "property_title"]);
  const tenure = pickFromSources(src, ["tenure", "tenure_type"]);

  // propertyStatus（顶层优先）
  const propertyStatus = pickAny(rawProperty, ["propertyStatus", "property_status", "propertystatus"]) || mode.propertyStatus;

  // category/subType（严格从当前 sources 拿，避免污染）
  const category = pickFromSources(src, ["propertyCategory", "property_category", "category"]);
  const subType = pickFromSources(src, ["subType", "sub_type", "property_sub_type"]);

  const storeysValue = pickFromSources(src, ["storeys", "storey", "floorCount", "storeysCount"]);
  const subtypesMulti = pickFromSources(src, ["propertySubtypes", "property_subtypes", "propertySubtype", "subtype", "subtypes"]);

  // 是否需要显示（跟表单一致）
  const showStoreys = shouldShowStoreysByCategory(category);
  const showPropSubtype = shouldShowPropertySubtypeByCategory(category);

  // Affordable
  const affordableRaw = pickFromSources(src, ["affordable", "affordable_housing", "affordableHousing"]);
  const affordableType = pickFromSources(src, ["affordableType", "affordable_housing_type", "affordableHousingType"]);
  let affordable = yesNoText(affordableRaw);
  if (affordableType && affordable !== "是") affordable = "是";
  const affordableText = affordable === "是" && isNonEmpty(affordableType) ? `是（${affordableType}）` : (affordable || "-");

  // 交通
  const transitText = getTransitTextFromSources(src);

  // 年份：Project New 只显示预计完成年份+季度
  const expectedYQ = getExpectedCompletionTextFromSources(src);
  const completedYear = pickFromSources(src, ["completedYear", "built_year", "completed_year", "completionYear"]);

  // ✅ 价格（Project 优先范围）
  const cardPriceText = getCardPriceTextFromSources(mode, src);

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="min-w-0">
        <div className="text-lg font-semibold text-gray-900 truncate">{title || "（未命名房源）"}</div>
        <div className="text-sm text-gray-600 mt-1 truncate">{isNonEmpty(address) ? address : "-"}</div>

        {/* ✅ 价格 */}
        <div className="text-base font-semibold text-blue-700 mt-2">{isNonEmpty(cardPriceText) ? cardPriceText : "-"}</div>

        <div className="text-sm text-gray-700 mt-2 flex flex-wrap gap-x-4 gap-y-1">
          <span>🛏 {isNonEmpty(bedrooms) ? toText(bedrooms) : "-"}</span>
          <span>🛁 {isNonEmpty(bathrooms) ? toText(bathrooms) : "-"}</span>
          <span>🚗 {isNonEmpty(carparks) ? toText(carparks) : "-"}</span>
        </div>

        <div className="mt-3 space-y-1">
          {/* SALE */}
          {showSale && (
            <>
              <MetaLineDash label="Sale / Rent" value="Sale" />
              <MetaLineDash label="Property Usage" value={usage} />
              <MetaLineDash label="Property Title" value={propertyTitle} />
              <MetaLineDash label="Property Status / Sale Type" value={propertyStatus} />
              <MetaLineDash label="Affordable Housing" value={affordableText} />
              <MetaLineDash label="Tenure Type" value={tenure} />

              <MetaLineDash label="Property Category" value={category} />
              <MetaLineDash label="Sub Type" value={subType} />

              {/* ✅ 只有“表单应该出现”的才显示这行 */}
              {showStoreys && <MetaLineDash label="Storeys" value={storeysValue} />}
              {showPropSubtype && <MetaLineDash label="Property Subtype" value={subtypesMulti} />}

              <MetaLineDash label="你的产业步行能到达公共交通吗？" value={transitText} />

              {/* ✅ New Project：只显示预计完成年份（含季度）；不要完成年份 */}
              {isNewProjectStatus(propertyStatus) ? (
                <MetaLineDash label="预计完成年份" value={expectedYQ} />
              ) : (
                <>
                  <MetaLineDash label="完成年份" value={completedYear} />
                  <MetaLineDash label="预计完成年份" value={expectedYQ} />
                </>
              )}
            </>
          )}

          {/* RENT（整间/房间） */}
          {showRent && (
            <>
              <MetaLineDash label="Sale / Rent" value="Rent" />
              <MetaLineDash label="Property Category" value={category} />
              {showStoreys && <MetaLineDash label="Storeys" value={storeysValue} />}
              {showPropSubtype && <MetaLineDash label="Property Subtype" value={subtypesMulti} />}
              <MetaLineDash label="你的产业步行能到达公共交通吗？" value={transitText} />
            </>
          )}

          {/* HOMESTAY */}
          {showHomestay && (
            <>
              <MetaLineDash label="Sale / Rent" value="Homestay" />
              <MetaLineDash label="Property Category" value={category} />
              <MetaLineDash label="你的产业步行能到达公共交通吗？" value={transitText} />
            </>
          )}

          {/* HOTEL / RESORT */}
          {showHotel && (
            <>
              <MetaLineDash label="Sale / Rent" value="Hotel/Resort" />
              <MetaLineDash label="Property Category" value={category} />
              <MetaLineDash label="你的产业步行能到达公共交通吗？" value={transitText} />
            </>
          )}
        </div>
      </div>

      {/* 你要的 123 按钮 */}
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
              <SellerPropertyCard key={p.id} rawProperty={p} onView={onView} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
