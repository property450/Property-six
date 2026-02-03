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

function toText(v) {
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function money(v) {
  const s = String(v ?? "").trim();
  if (!s) return "";
  const n = Number(s.replace(/[^\d.]/g, ""));
  if (!Number.isFinite(n)) return s;
  return "RM " + n.toLocaleString("en-MY");
}

function safeJson(v) {
  if (!isNonEmpty(v)) return null;
  if (typeof v === "object") return v;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

function deepGet(obj, path) {
  try {
    // eslint-disable-next-line no-new-func
    return Function("o", `return o?.${path}`)(obj);
  } catch {
    return undefined;
  }
}

function pickAny(obj, candidates) {
  for (const c of candidates) {
    const v = c.includes(".") || c.includes("[") ? deepGet(obj, c) : obj?.[c];
    if (isNonEmpty(v)) return v;
  }
  return "";
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

function MetaLine({ label, value }) {
  if (!isNonEmpty(value)) return null;
  return (
    <div className="text-sm text-gray-700 leading-6">
      <span className="text-gray-500">{label}：</span>
      <span className="text-gray-900">{toText(value)}</span>
    </div>
  );
}

/* =========================
   合并 JSON 列（保持你原本逻辑）
========================= */
function mergePropertyData(raw) {
  const p = raw || {};
  const merged = { ...p };

  const jsonCols = [
    "type_form_v2",
    "type_form",
    "typeform",
    "typeForm",
    "single_form_data_v2",
    "single_form_data",
    "singleFormData",
    "homestay_form",
    "hotel_resort_form",
    "availability",
    "calendar_prices",
    "unit_layouts",
    "unitLayouts",
    "unitlayouts",
    "areadata",
    "areaData",
    "area_data",
  ];

  merged.__json = {};

  for (const k of jsonCols) {
    const parsed = safeJson(p?.[k]);
    if (parsed && typeof parsed === "object") {
      merged.__json[k] = parsed;

      for (const key of Object.keys(parsed)) {
        if (!isNonEmpty(merged[key])) merged[key] = parsed[key];
      }
    }
  }

  let ul = p?.unit_layouts ?? p?.unitLayouts ?? p?.unitlayouts;
  ul = safeJson(ul) ?? ul;
  if (Array.isArray(ul) && ul[0] && typeof ul[0] === "object") {
    merged.__layout0 = ul[0];
    for (const key of Object.keys(ul[0])) {
      if (!isNonEmpty(merged[key])) merged[key] = ul[0][key];
    }
  }

  return merged;
}

/* =========================
   Transit / Layout helpers（保持你原本逻辑）
========================= */
function getTransitText(p) {
  const near = pickAny(p, ["nearTransit", "near_transit", "neartransit"]);
  if (!isNonEmpty(near)) return "";
  const yn = yesNoText(near);
  const lines = pickAny(p, ["transitLines", "transit_lines"]);
  const stations = pickAny(p, ["transitStations", "transit_stations"]);
  const parts = [];
  if (yn) parts.push(yn);
  if (isNonEmpty(lines)) parts.push(`Line: ${toText(lines)}`);
  if (isNonEmpty(stations)) parts.push(`Station: ${toText(stations)}`);
  return parts.join(" | ");
}

function getRoomLayouts(p) {
  const layouts = pickAny(p, ["roomLayouts", "room_layouts"]);
  const parsed = safeJson(layouts) ?? layouts;
  if (Array.isArray(parsed)) return parsed;
  return [];
}

function summarizeRoomLayout(layout) {
  const l = layout || {};
  const out = {};

  const beds = [];
  if (Array.isArray(l.beds)) {
    for (const b of l.beds) {
      if (!b) continue;
      if (typeof b === "string") beds.push(b);
      else if (typeof b === "object") {
        const t = b.type || b.bedType || b.name;
        const c = b.count ?? b.qty ?? 1;
        if (t) beds.push(`${t}${c ? ` x${c}` : ""}`);
      }
    }
  }
  out.beds = beds;

  out.pet = pickAny(l, ["pet", "allowPets", "allow_pets"]);
  out.cancel = pickAny(l, ["cancel", "cancellationPolicy", "cancel_policy"]);
  out.serviceFee = pickAny(l, ["serviceFee", "service_fee"]);
  out.cleaningFee = pickAny(l, ["cleaningFee", "cleaning_fee"]);
  out.deposit = pickAny(l, ["deposit"]);
  out.otherFee = pickAny(l, ["otherFee", "other_fee"]);

  const calendar = pickAny(l, ["calendarSummary", "calendar_summary"]);
  out.calendarSummary = calendar || "";

  return out;
}

/* =========================
   ✅✅✅ 价格显示逻辑（修正：Rent 不读 sale 的 range）
========================= */
function getCardPriceText(rawProperty, mergedProperty) {
  const rp = rawProperty || {};
  const mp = mergedProperty || {};

  const mode = String(pickAny(mp, ["saleType", "sale_type", "saletype", "listing_mode"]))
    .trim()
    .toLowerCase();

  // ✅ Rent：绝对不要用 price_min/price_max（那通常是旧 Sale 残留）
  if (mode === "rent") {
    const rentPrice = pickAny(mp, ["rentPrice", "rent_price", "monthlyRent", "monthly_rent", "price"]);
    return isNonEmpty(rentPrice) ? money(rentPrice) : "";
  }

  const hasMin = isNonEmpty(rp.price_min);
  const hasMax = isNonEmpty(rp.price_max);

  const minNum = hasMin ? Number(String(rp.price_min).replace(/[^\d.]/g, "")) : NaN;
  const maxNum = hasMax ? Number(String(rp.price_max).replace(/[^\d.]/g, "")) : NaN;

  // ✅ 只有 Sale + min & max 都有，并且 min != max 才显示 range
  if (
    mode === "sale" &&
    hasMin &&
    hasMax &&
    !Number.isNaN(minNum) &&
    !Number.isNaN(maxNum) &&
    minNum !== maxNum
  ) {
    return `${money(rp.price_min)} ~ ${money(rp.price_max)}`;
  }

  // ✅ 其他情况：优先用单价（subsale / auction / rto / homestay / hotel）
  const single = pickAny(mp, ["price", "salePrice", "sale_price", "sellingPrice", "selling_price"]);
  if (isNonEmpty(single)) return money(single);

  return "";
}

/* =========================
   Card（卖家后台卡片）
========================= */
function SellerPropertyCard({ rawProperty, onView, onEdit, onDelete }) {
  const p = useMemo(() => mergePropertyData(rawProperty), [rawProperty]);

  // 基础展示
  const title = pickAny(p, ["title"]);
  const address = pickAny(p, ["address"]);

  // 你这里 “Studio” 存在 bedrooms 字段里（你贴的 JSON 是 bedrooms:"Studio"）
  const bedrooms = pickAny(p, ["bedrooms", "bedroom_count", "room_count"]);
  const bathrooms = pickAny(p, ["bathrooms", "bathroom_count"]);
  const carparks = pickAny(p, ["carparks", "carpark"]);

  // 模式：你贴的 JSON 是 saleType:"Sale"/ finalType:"Hotel / Resort" / roomRentalMode:"whole"
  const saleType = pickAny(p, ["saleType", "sale_type", "saletype", "listing_mode"]);
  const finalType = pickAny(p, ["finalType"]); // 例如 "Hotel / Resort"
  const roomRentalMode = pickAny(p, ["roomRentalMode", "room_rental_mode", "roomrentalmode"]);

  const showSale = String(saleType).toLowerCase() === "sale";
  const showRent = String(saleType).toLowerCase() === "rent";
  const showHomestay = String(saleType).toLowerCase() === "homestay";
  // ✅✅✅ 修复：不要用 finalType 来误判 Hotel/Resort
  const showHotel = String(saleType).toLowerCase() === "hotel/resort";

  const isRentRoom = showRent && String(roomRentalMode).toLowerCase() === "room";

  // ✅ 这些字段按你真实 JSON key 对齐
  const usage = pickAny(p, ["usage", "property_usage"]);
  const tenure = pickAny(p, ["tenure", "tenure_type"]);
  const storeys = pickAny(p, ["storeys"]);
  const category = pickAny(p, ["category", "propertyCategory", "property_category"]);
  const subType = pickAny(p, ["subType", "property_sub_type", "sub_type"]);
  const subtypesMulti = pickAny(p, ["subtype", "property_subtypes", "propertySubtype"]); // 注意：你 JSON 的 subtype 是数组

  const propertyTitle = pickAny(p, ["propertyTitle", "property_title"]);
  const propertyStatus = pickAny(p, ["propertyStatus", "property_status", "propertystatus"]);

  // Affordable：你 JSON 是 affordable:"Yes" + affordableType:"Rumah Mampu Milik"
  const affordableRaw = pickAny(p, ["affordable", "affordable_housing", "affordableHousing"]);
  const affordableType = pickAny(p, ["affordableType", "affordable_housing_type", "affordableHousingType"]);
  let affordable = yesNoText(affordableRaw);
  if (affordableType && affordable !== "是") affordable = "是";

  const completedYear = pickAny(p, ["completedYear", "built_year"]);
  const expectedYear = pickAny(p, ["expectedCompletedYear", "expected_year"]);

  const transitText = getTransitText(p);

  // Homestay / Hotel extra
  const homestayType = pickAny(p, ["homestayType", "homestay_type"]);
  const hotelResortType = pickAny(p, ["hotelResortType", "hotel_resort_type", "hotel_resort_type", "hotel_resort_type"]);
  const maxGuests = pickAny(p, ["maxGuests", "max_guests"]);

  // 从 roomLayouts 取一个“汇总”
  const layouts = getRoomLayouts(p);
  const layout0 = layouts[0] || null;
  const layoutInfo = layout0 ? summarizeRoomLayout(layout0) : {};

  // 如果没有 roomLayouts，也尝试从顶层 bed_types
  const bedTypesFallback = pickAny(p, ["bed_types"]);
  const bedTypesText =
    (layoutInfo?.beds && layoutInfo.beds.length ? layoutInfo.beds.join(", ") : "") ||
    (Array.isArray(bedTypesFallback) ? bedTypesFallback.join(", ") : "");

  // 费用
  const serviceFee = layoutInfo.serviceFee || "";
  const cleaningFee = layoutInfo.cleaningFee || "";
  const deposit = layoutInfo.deposit || "";
  const otherFee = layoutInfo.otherFee || "";

  // 日历价格
  const calendarSummary = layoutInfo.calendarSummary || "";

  // ✅ 价格显示（你要的最终逻辑）
  const cardPriceText = getCardPriceText(rawProperty, p);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-lg font-bold text-gray-900 truncate">{title || "（未命名房源）"}</div>
          {isNonEmpty(address) && <div className="text-sm text-gray-600 mt-1 truncate">{address}</div>}

          {/* ✅ 价格 */}
          {isNonEmpty(cardPriceText) && <div className="text-base font-semibold text-blue-700 mt-2">{cardPriceText}</div>}

          <div className="text-sm text-gray-700 mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {isNonEmpty(bedrooms) && <span>🛏 {toText(bedrooms)}</span>}
            {isNonEmpty(bathrooms) && <span>🛁 {toText(bathrooms)}</span>}
            {isNonEmpty(carparks) && <span>🚗 {toText(carparks)}</span>}
          </div>
        </div>
      </div>

      {/* 详细字段：有值才显示 */}
      <div className="mt-3 space-y-1">
        {/* SALE */}
        {showSale && (
          <>
            <MetaLine label="Sale / Rent" value="Sale" />
            <MetaLine label="Property Usage" value={usage} />
            <MetaLine label="Property Title" value={propertyTitle} />
            <MetaLine label="Property Status / Sale Type" value={propertyStatus} />

            <MetaLine
              label="Affordable Housing"
              value={affordable === "是" && affordableType ? `是（${affordableType}）` : affordable}
            />

            <MetaLine label="Tenure Type" value={tenure} />
            <MetaLine label="Property Category" value={category} />
            <MetaLine label="Sub Type" value={subType} />
            <MetaLine label="Storeys" value={storeys} />
            <MetaLine
              label="Property Subtype"
              value={Array.isArray(subtypesMulti) ? subtypesMulti.join(", ") : subtypesMulti}
            />
            <MetaLine label="Completed Year" value={completedYear} />
            <MetaLine label="Expected Completed" value={expectedYear} />
            <MetaLine label="Near Public Transit" value={transitText} />
          </>
        )}

        {/* RENT */}
        {showRent && (
          <>
            <MetaLine label="Sale / Rent" value={isRentRoom ? "Rent（房间出租）" : "Rent（整间出租）"} />
            <MetaLine label="Property Category" value={category} />
            <MetaLine label="Sub Type" value={subType} />
            <MetaLine label="Storeys" value={storeys} />
            <MetaLine
              label="Property Subtype"
              value={Array.isArray(subtypesMulti) ? subtypesMulti.join(", ") : subtypesMulti}
            />
            <MetaLine label="Tenure Type" value={tenure} />
            <MetaLine label="Near Public Transit" value={transitText} />
          </>
        )}

        {/* HOMESTAY */}
        {showHomestay && (
          <>
            <MetaLine label="Sale / Rent" value="Homestay" />
            <MetaLine label="Homestay Type" value={homestayType} />
            <MetaLine label="Max Guests" value={maxGuests} />
            <MetaLine label="Beds" value={bedTypesText} />
            <MetaLine label="Service Fee" value={serviceFee} />
            <MetaLine label="Cleaning Fee" value={cleaningFee} />
            <MetaLine label="Deposit" value={deposit} />
            <MetaLine label="Other Fee" value={otherFee} />
            <MetaLine label="Calendar Price" value={calendarSummary} />
            <MetaLine label="Near Public Transit" value={transitText} />
          </>
        )}

        {/* HOTEL / RESORT */}
        {showHotel && (
          <>
            <MetaLine label="Sale / Rent" value="Hotel / Resort" />
            <MetaLine label="Hotel/Resort Type" value={hotelResortType || finalType} />
            <MetaLine label="Max Guests" value={maxGuests} />
            <MetaLine label="Beds" value={bedTypesText} />
            <MetaLine label="Service Fee" value={serviceFee} />
            <MetaLine label="Cleaning Fee" value={cleaningFee} />
            <MetaLine label="Deposit" value={deposit} />
            <MetaLine label="Other Fee" value={otherFee} />
            <MetaLine label="Calendar Price" value={calendarSummary} />
            <MetaLine label="Near Public Transit" value={transitText} />
          </>
        )}
      </div>

      {/* 按钮 */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <button
          onClick={() => onView(rawProperty)}
          className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
        >
          查看
        </button>
        <button
          onClick={() => onEdit(rawProperty)}
          className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
        >
          编辑
        </button>
        <button
          onClick={() => onDelete(rawProperty)}
          className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
        >
          删除
        </button>
      </div>
    </div>
  );
}

export default function MyProfilePage() {
  const router = useRouter();
  const user = useUser();

  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState([]);

  const [keyword, setKeyword] = useState("");
  const [sortKey, setSortKey] = useState("latest"); // latest | oldest | priceHigh | priceLow

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

  // 统计（你表里没有 published 字段，不乱猜，全部当已发布）
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
        const merged = mergePropertyData(p);
        const t = pickAny(merged, ["title"]);
        const a = pickAny(merged, ["address"]);
        return String(t || "").toLowerCase().includes(k) || String(a || "").toLowerCase().includes(k);
      });
    }

    const getPriceNum = (p) => {
      const merged = mergePropertyData(p);
      const mode = String(pickAny(merged, ["saleType", "sale_type", "saletype", "listing_mode"]))
        .trim()
        .toLowerCase();

      if (mode === "rent") {
        const v = pickAny(merged, ["rentPrice", "rent_price", "monthlyRent", "monthly_rent", "price"]);
        const n = Number(String(v).replace(/[^\d.]/g, ""));
        return Number.isNaN(n) ? 0 : n;
      }

      const v = p?.price ?? p?.price_min ?? p?.price_max ?? pickAny(merged, ["price"]);
      const n = Number(String(v).replace(/[^\d.]/g, ""));
      return Number.isNaN(n) ? 0 : n;
    };

    if (sortKey === "latest") {
      list = [...list].sort((a, b) => {
        const ta = new Date(a?.updated_at || a?.created_at || 0).getTime();
        const tb = new Date(b?.updated_at || b?.created_at || 0).getTime();
        return tb - ta;
      });
    } else if (sortKey === "oldest") {
      list = [...list].sort((a, b) => {
        const ta = new Date(a?.updated_at || a?.created_at || 0).getTime();
        const tb = new Date(b?.updated_at || b?.created_at || 0).getTime();
        return ta - tb;
      });
    } else if (sortKey === "priceHigh") {
      list = [...list].sort((a, b) => getPriceNum(b) - getPriceNum(a));
    } else if (sortKey === "priceLow") {
      list = [...list].sort((a, b) => getPriceNum(a) - getPriceNum(b));
    }

    return list;
  }, [properties, keyword, sortKey]);

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="text-lg font-bold text-gray-900">请先登录</div>
      </div>
    );
  }

  const onView = (p) => router.push(`/property/${p.id}`);
  const onEdit = (p) => router.push(`/upload-property?edit=1&id=${p.id}`);

  const onDelete = async (p) => {
    const ok = confirm("确定要删除这个房源吗？此操作不可恢复。");
    if (!ok) return;

    const { error } = await supabase.from("properties").delete().eq("id", p.id).eq("user_id", user.id);

    if (error) {
      console.error(error);
      toast.error("删除失败（请看 Console）");
      alert("删除失败（请看 Console）");
      return;
    }

    toast.success("已删除");
    setProperties((prev) => prev.filter((x) => x.id !== p.id));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="text-2xl font-bold text-gray-900">我的房源（卖家后台）</div>

      {/* 统计 */}
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

      {/* 搜索 + 排序 */}
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
            className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white"
          >
            <option value="latest">最新更新</option>
            <option value="oldest">最旧</option>
            <option value="priceHigh">价格高 → 低</option>
            <option value="priceLow">价格低 → 高</option>
          </select>
        </div>
      </div>

      {/* 列表 */}
      <div className="mt-4 space-y-3">
        {loading ? (
          <div className="text-sm text-gray-500">加载中...</div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-gray-500">没有找到任何房源</div>
        ) : (
          filtered.map((p) => (
            <SellerPropertyCard
              key={p.id}
              rawProperty={p}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
