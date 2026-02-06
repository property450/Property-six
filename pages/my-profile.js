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
  if (typeof v === "number") return !Number.isNaN(v);
  if (typeof v === "object") return Object.keys(v).length > 0;
  return true;
}

function normalizeLower(v) {
  return (v ?? "").toString().trim().toLowerCase();
}

function pickAny(obj, keys) {
  if (!obj) return "";
  for (const k of keys) {
    const v = obj?.[k];
    if (isNonEmpty(v)) return v;
  }
  return "";
}

function safeArray(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  return [v];
}

function formatNumber(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "";
  return num.toLocaleString("en-MY");
}

function formatRM(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "";
  return `RM ${formatNumber(num)}`;
}

function isObject(v) {
  return v && typeof v === "object" && !Array.isArray(v);
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

function isAuctionStatus(propertyStatus) {
  const s = normalizeLower(propertyStatus);
  return s.includes("auction");
}

function resolveActiveSources(raw) {
  const saleTypeRaw = pickAny(raw, ["saleType", "sale_type", "saletype", "listing_mode"]);
  const saleType = normalizeLower(saleTypeRaw);
  const propertyStatus = pickAny(raw, ["propertyStatus", "property_status", "propertyStatusSale", "saleTypeStatus", "sale_type_status", "sale_type"]);

  const shared = isObject(raw?.shared) ? raw.shared : isObject(raw?.sharedData) ? raw.sharedData : {};
  const unitLayouts = safeArray(raw?.unitlayouts || raw?.unitLayouts || raw?.unit_layouts);
  const layout0 = unitLayouts?.[0] && isObject(unitLayouts?.[0]) ? unitLayouts?.[0] : {};

  const singleFormData = isObject(raw?.singleformdata) ? raw.singleformdata : isObject(raw?.singleFormData) ? raw.singleFormData : {};
  const form = singleFormData;

  return {
    saleType: saleTypeRaw || "",
    propertyStatus: propertyStatus || "",
    shared,
    layout0,
    form,
  };
}

function pickActive(raw, active, keys) {
  // ✅ 优先读“当前表单(active)”，最后才 fallback 到 raw（避免显示旧数据/其它表单数据）
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
  return (
    c.includes("bungalow") ||
    c.includes("villa") ||
    c.includes("business") ||
    c.includes("industrial") ||
    c.includes("semi") ||
    c.includes("terrace") ||
    c.includes("link house") ||
    c.includes("linked house")
  );
}
function shouldShowPropertySubtypeByCategory(category) {
  const c = normalizeLower(category);
  // 你原本逻辑：Apartment/Business/Industrial 才显示 property subtype
  return c.includes("apartment") || c.includes("condo") || c.includes("service residence") || c.includes("business") || c.includes("industrial");
}

function normalizeBedroomText(v) {
  if (!isNonEmpty(v)) return "-";
  const s = v.toString().trim();
  const low = s.toLowerCase();
  if (low === "studio") return "Studio";
  return s;
}

/* =========================
   ✅ 价格显示（跟表单一致）
========================= */
function getCardPriceText(raw, active) {
  const price = pickActive(raw, active, ["price", "Price"]);
  const priceData = pickActive(raw, active, ["priceData", "pricedata", "price_data"]);

  // priceData 可能是对象（range）
  if (isObject(priceData)) {
    const min = priceData.min ?? priceData.minPrice ?? priceData.minimum ?? priceData.from;
    const max = priceData.max ?? priceData.maxPrice ?? priceData.maximum ?? priceData.to;
    if (isNonEmpty(min) && isNonEmpty(max)) return `${formatRM(min)} ~ ${formatRM(max)}`;
    if (isNonEmpty(min)) return `${formatRM(min)}`;
  }

  // price 也可能是对象
  if (isObject(price)) {
    const min = price.min ?? price.minPrice ?? price.minimum ?? price.from;
    const max = price.max ?? price.maxPrice ?? price.maximum ?? price.to;
    if (isNonEmpty(min) && isNonEmpty(max)) return `${formatRM(min)} ~ ${formatRM(max)}`;
    if (isNonEmpty(min)) return `${formatRM(min)}`;
  }

  // 普通数字 / 字符串数字
  if (isNonEmpty(price)) {
    const n = Number(price);
    if (Number.isFinite(n)) return formatRM(n);
    return `RM ${price}`;
  }

  return "RM -";
}

/* =========================
   ✅ 公共交通显示（没选就 -）
========================= */
function getTransitText(raw, active) {
  const transit = pickActive(raw, active, ["transit", "Transit", "walkToTransit", "walk_to_transit", "transitYesNo", "transitYN"]);
  const line = pickActive(raw, active, ["transitLine", "transit_line", "line"]);
  const station = pickActive(raw, active, ["transitStation", "transit_station", "station"]);

  // 未选 -> "-"
  if (!isNonEmpty(transit)) return "-";

  const t = transit.toString().trim();
  // 如果明确是 no/否 -> "否"
  const low = t.toLowerCase();
  if (low === "no" || t === "否") return "否";

  // yes/是
  const parts = ["是"];
  if (isNonEmpty(line)) parts.push(`线路：${line}`);
  if (isNonEmpty(station)) parts.push(`站点：${station}`);
  return parts.join(" | ");
}

/* =========================
   ✅ 预计完成年份 + 季度（New Project）
========================= */
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

  if (!isNonEmpty(year) && !isNonEmpty(quarter)) return "-";
  if (isNonEmpty(year) && isNonEmpty(quarter)) return `${year}（${quarter}）`;
  if (isNonEmpty(year)) return `${year}`;
  return `${quarter}`;
}

function getAuctionDateText(raw, active) {
  const v = pickActive(raw, active, ["auctionDate", "auction_date", "auction_datetime", "auctionAt", "auction_at"]);
  if (!isNonEmpty(v)) return "-";

  // 支持：ISO string / yyyy-mm-dd / timestamp number
  try {
    if (typeof v === "number") {
      const d = new Date(v);
      if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    }
    if (typeof v === "string") {
      const s = v.trim();
      // 已经是 yyyy-mm-dd
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
      const d = new Date(s);
      if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
      return s;
    }
  } catch (e) {}
  return String(v);
}

/* =========================
   UI 小组件
========================= */
function MetaLineDash({ label, value }) {
  const v = isNonEmpty(value) ? value : "-";
  return (
    <div className="text-sm text-gray-700">
      <span className="text-gray-500">{label}：</span>
      <span>{v}</span>
    </div>
  );
}

/* =========================
   Card
========================= */
function PropertyCard({ rawProperty, onView, onEdit, onDelete }) {
  const active = useMemo(() => resolveActiveSources(rawProperty), [rawProperty]);

  const title = pickAny(rawProperty, ["title", "propertyTitleText", "name"]) || pickActive(rawProperty, active, ["projectName", "project_name"]) || "—";
  const address = pickAny(rawProperty, ["address", "location", "full_address", "fullAddress"]) || "-";

  const saleType = pickAny(rawProperty, ["saleType", "sale_type", "saletype", "listing_mode"]);
  const propertyStatus = pickAny(rawProperty, ["propertyStatus", "property_status", "sale_type", "saleTypeStatus", "sale_type_status"]) || "-";

  const bedrooms = pickActive(rawProperty, active, ["bedrooms", "bedroom", "room", "rooms", "bedroomCount", "bedroomsCount"]);
  const bathrooms = pickActive(rawProperty, active, ["bathrooms", "bathroom", "bath", "baths", "bathroomCount", "bathroomsCount"]);
  const carparks = pickActive(rawProperty, active, ["carparks", "carpark", "car_park", "carparkCount", "carparksCount", "parking"]);
  const carparksRange = pickActive(rawProperty, active, ["carparkRange", "carpark_range", "carparkCountRange", "carparkCount_range"]);

  const usage = pickActive(rawProperty, active, ["usage", "propertyUsage", "property_usage"]);
  const propertyTitle = pickActive(rawProperty, active, ["propertyTitle", "property_title", "titleType", "title_type"]);
  const tenure = pickActive(rawProperty, active, ["tenure", "tenureType", "tenure_type"]);

  const category = pickActive(rawProperty, active, ["category", "propertyCategory", "property_category"]);
  const subType = pickActive(rawProperty, active, ["subType", "sub_type", "propertySubType", "property_sub_type"]);
  const storeys = pickActive(rawProperty, active, ["storeys", "storey", "floors", "floorCount", "storeysCount"]);
  const propertySubtype = pickActive(rawProperty, active, ["propertySubtype", "property_subtype", "subtypes", "propertySubtypes"]);

  const affordable = pickActive(rawProperty, active, ["affordableHousing", "affordable_housing", "affordable", "isAffordable"]);
  const affordableType = pickActive(rawProperty, active, ["affordableHousingType", "affordable_housing_type", "affordableType"]);

  const affordableText =
    affordable === "是" && isNonEmpty(affordableType)
      ? `是（${affordableType}）`
      : (isNonEmpty(affordable) ? affordable : "-");

  const transitText = getTransitText(rawProperty, active);

  const priceText = getCardPriceText(rawProperty, active);

  const expectedText = getExpectedCompletionText(rawProperty, active);
  const auctionDateText = getAuctionDateText(rawProperty, active);
  const completedYear = pickActive(rawProperty, active, ["completedYear", "built_year", "completed_year", "completionYear"]);

  const showStoreys = shouldShowStoreysByCategory(category);
  const showSubtype = shouldShowPropertySubtypeByCategory(category);

  // carpark range 显示（你要 4 ~ 5）
  let carparkText = "-";
  if (isObject(carparksRange)) {
    const min = carparksRange.min ?? carparksRange.minimum ?? carparksRange.from;
    const max = carparksRange.max ?? carparksRange.maximum ?? carparksRange.to;
    if (isNonEmpty(min) && isNonEmpty(max)) carparkText = `${min} ~ ${max}`;
    else if (isNonEmpty(min)) carparkText = `${min}`;
  } else if (isNonEmpty(carparksRange)) {
    // 可能是 {min,max} 的字符串/JSON
    try {
      const parsed = typeof carparksRange === "string" ? JSON.parse(carparksRange) : carparksRange;
      if (isObject(parsed)) {
        const min = parsed.min ?? parsed.minimum ?? parsed.from;
        const max = parsed.max ?? parsed.maximum ?? parsed.to;
        if (isNonEmpty(min) && isNonEmpty(max)) carparkText = `${min} ~ ${max}`;
        else if (isNonEmpty(min)) carparkText = `${min}`;
      } else {
        carparkText = String(carparksRange);
      }
    } catch (e) {
      carparkText = String(carparksRange);
    }
  } else if (isNonEmpty(carparks)) {
    carparkText = String(carparks);
  }

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="min-w-0">
        <div className="text-lg font-semibold text-gray-900 truncate">{title}</div>
        <div className="text-sm text-gray-600 mt-1 truncate">{address}</div>

        <div className="text-base font-semibold text-blue-700 mt-2">{priceText}</div>

        <div className="text-sm text-gray-700 mt-2 flex flex-wrap gap-x-4 gap-y-1">
          <span>🛏 {normalizeBedroomText(bedrooms)}</span>
          <span>🛁 {isNonEmpty(bathrooms) ? bathrooms : "-"}</span>
          <span>🚗 {carparkText}</span>
        </div>

        <div className="mt-3 space-y-2">
          <MetaLineDash label="Sale / Rent" value={isNonEmpty(saleType) ? saleType.toString().toUpperCase() : "-"} />
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
              value={
                Array.isArray(propertySubtype)
                  ? propertySubtype.join(", ")
                  : (isNonEmpty(propertySubtype) ? propertySubtype : "-")
              }
            />
          )}

          <MetaLineDash label="你的产业步行能到达公共交通吗？" value={transitText} />

          {isNewProjectStatus(propertyStatus) ? (
            <MetaLineDash label="预计完成年份" value={expectedText} />
          ) : isCompletedUnitStatus(propertyStatus) ? (
            <MetaLineDash label="完成年份" value={isNonEmpty(completedYear) ? completedYear : "-"} />
          ) : isAuctionStatus(propertyStatus) ? (
            <MetaLineDash label="Auction Date" value={auctionDateText} />
          ) : (
            <MetaLineDash label="完成年份" value={isNonEmpty(completedYear) ? completedYear : "-"} />
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <button
          onClick={() => onView(rawProperty)}
          className="h-11 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
        >
          查看
        </button>
        <button
          onClick={() => onEdit(rawProperty)}
          className="h-11 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
        >
          编辑
        </button>
        <button
          onClick={() => onDelete(rawProperty)}
          className="h-11 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
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
  const user = useUser();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [sortKey, setSortKey] = useState("latest");

  async function fetchMyProperties() {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (e) {
      console.error(e);
      toast.error("加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    fetchMyProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    let arr = properties;

    if (kw) {
      arr = arr.filter((p) => {
        const t = (p?.title ?? "").toString().toLowerCase();
        const a = (p?.address ?? "").toString().toLowerCase();
        return t.includes(kw) || a.includes(kw);
      });
    }

    // 排序
    if (sortKey === "oldest") {
      arr = [...arr].sort((a, b) => {
        const at = new Date(a?.updated_at || a?.created_at || 0).getTime();
        const bt = new Date(b?.updated_at || b?.created_at || 0).getTime();
        return at - bt;
      });
    } else if (sortKey === "priceHigh") {
      arr = [...arr].sort((a, b) => {
        const aa = Number(a?.price ?? 0);
        const bb = Number(b?.price ?? 0);
        return bb - aa;
      });
    } else if (sortKey === "priceLow") {
      arr = [...arr].sort((a, b) => {
        const aa = Number(a?.price ?? 0);
        const bb = Number(b?.price ?? 0);
        return aa - bb;
      });
    } else {
      // latest
      arr = [...arr].sort((a, b) => {
        const at = new Date(a?.updated_at || a?.created_at || 0).getTime();
        const bt = new Date(b?.updated_at || b?.created_at || 0).getTime();
        return bt - at;
      });
    }

    return arr;
  }, [properties, keyword, sortKey]);

  async function handleDelete(p) {
    if (!p?.id) return;
    const ok = window.confirm("确认删除这个房源吗？");
    if (!ok) return;

    try {
      const { error } = await supabase.from("properties").delete().eq("id", p.id);
      if (error) throw error;
      toast.success("删除成功");
      fetchMyProperties();
    } catch (e) {
      console.error(e);
      toast.error("删除失败");
    }
  }

  function handleView(p) {
    if (!p?.id) return;
    router.push(`/property/${p.id}`);
  }

  function handleEdit(p) {
    if (!p?.id) return;
    router.push(`/upload-property?edit=1&id=${p.id}`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold text-gray-900">我的房源</div>
            <div className="text-sm text-gray-600 mt-1">查看 / 编辑 / 删除你上传的房源</div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="输入标题或地点..."
              className="h-11 w-full sm:w-72 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />

            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
              className="h-11 w-full sm:w-48 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none"
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
                <PropertyCard
                  key={p.id}
                  rawProperty={p}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
