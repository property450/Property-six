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

// ✅ 兼容 Yes/No / 是/否
function yesNoText(v) {
  if (v === true) return "是";
  if (v === false) return "否";
  if (!isNonEmpty(v)) return "";
  const s = String(v).trim().toLowerCase();
  if (["yes", "y", "true", "1", "是"].includes(s)) return "是";
  if (["no", "n", "false", "0", "否"].includes(s)) return "否";
  return String(v);
}

/* =========================
   数字/金额
========================= */
function extractNumericString(x) {
  if (!isNonEmpty(x)) return "";
  const s = String(x).replace(/,/g, "").replace(/[^\d.]/g, "");
  if (!s || !/[0-9]/.test(s)) return "";
  return s;
}

function toNumberOrNaN(x) {
  const s = extractNumericString(x);
  if (!s) return NaN;
  const n = Number(s);
  return Number.isNaN(n) ? NaN : n;
}

function money(v) {
  if (!isNonEmpty(v)) return "";
  const n = toNumberOrNaN(v);
  if (Number.isNaN(n)) return "";
  return "RM " + n.toLocaleString("en-MY");
}

function formatCountOrRange(v) {
  if (!isNonEmpty(v)) return "";
  if (typeof v === "number") return String(v);
  if (typeof v === "string") return v;

  if (typeof v === "object") {
    const min = pickAny(v, ["min", "from", "minValue", "min_count", "minCount"]);
    const max = pickAny(v, ["max", "to", "maxValue", "max_count", "maxCount"]);
    const minN = toNumberOrNaN(min);
    const maxN = toNumberOrNaN(max);

    if (!Number.isNaN(minN) && !Number.isNaN(maxN) && minN !== maxN) return `${minN} ~ ${maxN}`;
    if (!Number.isNaN(minN) && (Number.isNaN(maxN) || minN === maxN)) return `${minN}`;
    if (!Number.isNaN(maxN) && Number.isNaN(minN)) return `${maxN}`;

    return "";
  }

  return String(v);
}

function formatYearLike(v) {
  if (!isNonEmpty(v)) return "";
  if (typeof v === "number") return String(v);
  if (typeof v === "string") return v;

  if (typeof v === "object") {
    const year = pickAny(v, ["year", "value", "completedYear", "expectedYear"]);
    const quarter = pickAny(v, ["quarter", "q"]);
    if (isNonEmpty(year) && isNonEmpty(quarter)) return `${year} Q${quarter}`;
    if (isNonEmpty(year)) return String(year);
  }
  return "";
}

/* =========================
   MetaLine：永远显示，没值就 "-"
========================= */
function MetaLine({ label, value }) {
  const show = isNonEmpty(value) ? toText(value) : "-";
  return (
    <div className="text-sm text-gray-700 leading-6">
      <span className="text-gray-500">{label}：</span>
      <span className="text-gray-900">{show}</span>
    </div>
  );
}

/* =========================
   解析 JSON（不做提升覆盖，避免串表单）
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
    "unit_layouts",
    "unitLayouts",
    "unitlayouts",
    "pricedata",
    "priceData",
    "areadata",
    "areaData",
    "area_data",
    "bed_types",
    "roomLayouts",
    "room_layouts",
  ];

  merged.__json = {};
  for (const k of jsonCols) {
    const parsed = safeJson(p?.[k]);
    if (parsed && typeof parsed === "object") merged.__json[k] = parsed;
  }

  // layout0
  let ul = p?.unit_layouts ?? p?.unitLayouts ?? p?.unitlayouts;
  ul = safeJson(ul) ?? ul;
  if (Array.isArray(ul) && ul[0] && typeof ul[0] === "object") merged.__layout0 = ul[0];

  return merged;
}

/* =========================
   根据模式选“当前表单来源”
   - Project：layout0 + shared(type_form_v2)
   - Sale/Rent 非 project：single_form_data_v2（优先）否则 type_form_v2
   - Homestay/Hotel：各自 form
========================= */
function getMode(raw) {
  const saleTypeRaw = pickAny(raw, ["saleType", "sale_type", "saletype", "listing_mode"]);
  const saleType = String(saleTypeRaw || "").trim().toLowerCase();
  const statusRaw = pickAny(raw, ["propertyStatus", "property_status", "propertystatus"]);
  const status = String(statusRaw || "").trim().toLowerCase();

  const isProjectNew = status.includes("new project") || status.includes("under construction");
  const isProjectCompleted = status.includes("completed unit") || status.includes("developer unit");
  const isProject = isProjectNew || isProjectCompleted;

  const isSale = saleType === "sale";
  const isRent = saleType === "rent";
  const isHomestay = saleType === "homestay";
  const isHotel = saleType === "hotel/resort";

  return { saleType, status, isProject, isProjectNew, isProjectCompleted, isSale, isRent, isHomestay, isHotel };
}

function getSources(raw, merged) {
  const m = merged || {};
  const typeForm = m.__json?.type_form_v2 || m.__json?.type_form || m.__json?.typeform || m.__json?.typeForm || null;
  const singleForm =
    m.__json?.single_form_data_v2 || m.__json?.single_form_data || m.__json?.singleFormData || null;
  const homestayForm = m.__json?.homestay_form || null;
  const hotelForm = m.__json?.hotel_resort_form || null;
  const layout0 = m.__layout0 || null;

  const mode = getMode(raw);

  if (mode.isProject) {
    // ✅ Project：layout0(房型) + shared(typeForm/singleForm)
    // 你很多共享字段（usage/title/status/transit/affordable/tenure/年份）在 typeForm 或 singleForm
    const shared = typeForm || singleForm || null;
    return { mode, layout: layout0, shared, form: null };
  }

  if (mode.isSale || mode.isRent) {
    const form = singleForm || typeForm || null;
    return { mode, layout: null, shared: form, form };
  }

  if (mode.isHomestay) return { mode, layout: null, shared: homestayForm, form: homestayForm };
  if (mode.isHotel) return { mode, layout: null, shared: hotelForm, form: hotelForm };

  // fallback
  return { mode, layout: null, shared: null, form: null };
}

/* =========================
   严格取值：只从“当前表单 sources”拿，不从顶层/其它表单拿
========================= */
function pickStrictFrom(objects, keys) {
  for (const obj of objects) {
    if (!obj) continue;
    const v = pickAny(obj, keys);
    if (isNonEmpty(v)) return v;
  }
  return "";
}

/* =========================
   公共交通（严格）：没选 "-"；No "否"；Yes "是..."
   只读 shared（当前表单），不读顶层不读其它表单
========================= */
function getTransitText(shared) {
  const near = pickAny(shared, ["transit.nearTransit", "nearTransit", "transitNearTransit"]);
  if (!isNonEmpty(near)) return "-";

  const yn = yesNoText(near);
  if (!isNonEmpty(yn)) return "-";
  if (yn === "否") return "否";

  const lines = pickAny(shared, ["transit.selectedLines", "selectedLines"]);
  const stations = pickAny(shared, ["transit.selectedStations", "selectedStations"]);

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
   价格（严格）：Project 用 layout 优先，其它用 form
========================= */
function getPriceInfo(mode, layout, form, raw) {
  // 顶层 price_min/max 只作为最后兜底（很多时候顶层会残留旧模式）
  // 你要求“只显示当前表单”，所以这里只在当前 form/layout 都没有时才用。
  // Project：
  if (mode.isProject) {
    const pd = pickAny(layout, ["priceData", "pricedata", "price_data"]);
    if (pd && typeof pd === "object") {
      const minV = pickAny(pd, ["min", "minPrice", "min_value", "minValue", "from"]);
      const maxV = pickAny(pd, ["max", "maxPrice", "max_value", "maxValue", "to"]);
      const minP = toNumberOrNaN(minV);
      const maxP = toNumberOrNaN(maxV);
      if (!Number.isNaN(minP) && !Number.isNaN(maxP) && minP !== maxP) return { kind: "range", min: minP, max: maxP };
      if (!Number.isNaN(minP)) return { kind: "single", value: minP };
      if (!Number.isNaN(maxP)) return { kind: "single", value: maxP };
    }
  }

  // 非 Project（或 Project 没 priceData）
  const pd2 = pickAny(form, ["priceData", "pricedata", "price_data"]);
  if (pd2 && typeof pd2 === "object") {
    const minV = pickAny(pd2, ["min", "minPrice", "min_value", "minValue", "from"]);
    const maxV = pickAny(pd2, ["max", "maxPrice", "max_value", "maxValue", "to"]);
    const minP = toNumberOrNaN(minV);
    const maxP = toNumberOrNaN(maxV);
    if (!Number.isNaN(minP) && !Number.isNaN(maxP) && minP !== maxP) return { kind: "range", min: minP, max: maxP };
    if (!Number.isNaN(minP)) return { kind: "single", value: minP };
    if (!Number.isNaN(maxP)) return { kind: "single", value: maxP };
  }

  const priceSingle = pickAny(form, ["price", "amount"]);
  const n = toNumberOrNaN(priceSingle);
  if (!Number.isNaN(n)) return { kind: "single", value: n };

  // 最后兜底（但仍遵守“没值显示 - ”）
  const hasMin = isNonEmpty(raw?.price_min);
  const hasMax = isNonEmpty(raw?.price_max);
  const minNum = hasMin ? toNumberOrNaN(raw?.price_min) : NaN;
  const maxNum = hasMax ? toNumberOrNaN(raw?.price_max) : NaN;
  if (hasMin && hasMax && !Number.isNaN(minNum) && !Number.isNaN(maxNum) && minNum !== maxNum) {
    return { kind: "range", min: minNum, max: maxNum };
  }
  const topPrice = toNumberOrNaN(raw?.price);
  if (!Number.isNaN(topPrice)) return { kind: "single", value: topPrice };

  return null;
}

function formatPriceText(info) {
  if (!info) return "";
  if (info.kind === "range") return `${money(info.min)} ~ ${money(info.max)}`;
  if (info.kind === "single") return money(info.value);
  return "";
}

/* =========================
   Card
========================= */
function SellerPropertyCard({ rawProperty, onView, onEdit, onDelete }) {
  const merged = useMemo(() => mergePropertyData(rawProperty), [rawProperty]);
  const { mode, layout, shared, form } = useMemo(() => getSources(rawProperty, merged), [rawProperty, merged]);

  // 标题/地址：保持你顶层（通常可靠）
  const title = pickAny(rawProperty, ["title"]) || "（未命名房源）";
  const address = pickAny(rawProperty, ["address"]);

  // Project：房间/厕所/车位通常在 layout；其它模式在 form/shared
  const bedrooms = mode.isProject
    ? pickStrictFrom([layout], ["bedrooms", "bedroom_count", "room_count"])
    : pickStrictFrom([form], ["bedrooms", "bedroom_count", "room_count"]);

  const bathrooms = mode.isProject
    ? pickStrictFrom([layout], ["bathrooms", "bathroom_count"])
    : pickStrictFrom([form], ["bathrooms", "bathroom_count"]);

  const carparksRaw = mode.isProject
    ? pickStrictFrom([layout], ["carparks", "carpark", "carparkCount", "carpark_count"])
    : pickStrictFrom([form], ["carparks", "carpark", "carparkCount", "carpark_count"]);
  const carparks = formatCountOrRange(carparksRaw);

  // ✅ 共享字段：只读 shared（当前表单共享），不读顶层
  const usage = pickAny(shared, ["usage", "property_usage"]);
  const propertyTitle = pickAny(shared, ["propertyTitle", "property_title"]);
  const propertyStatus = pickAny(rawProperty, ["propertyStatus", "property_status", "propertystatus"]) || pickAny(shared, ["propertyStatus", "property_status", "propertystatus"]);

  const tenure = pickAny(shared, ["tenure", "tenure_type"]);
  const category = pickAny(shared, ["category", "propertyCategory", "property_category"]);
  const subType = pickAny(shared, ["subType", "property_sub_type", "sub_type"]);
  const storeys = formatCountOrRange(pickAny(shared, ["storeys"]));
  const subtypesMulti = pickAny(shared, ["subtype", "property_subtypes", "propertySubtype"]);

  // Affordable
  const affordableRaw = pickAny(shared, ["affordable", "affordable_housing", "affordableHousing"]);
  const affordableType = pickAny(shared, ["affordableType", "affordable_housing_type", "affordableHousingType"]);
  let affordable = yesNoText(affordableRaw);
  if (affordableType && affordable !== "是") affordable = "是";
  const affordableText = affordable === "是" && isNonEmpty(affordableType) ? `是（${affordableType}）` : affordable;

  // ✅ 公共交通：严格 shared
  const transitText = getTransitText(shared);

  // ✅ 年份：严格 shared + 按 Project 类型显示
  const completedYearRaw = pickAny(shared, ["completedYear", "built_year"]);
  const expectedYearRaw = pickAny(shared, ["expectedCompletedYear", "expected_year"]);

  const completedYear = formatYearLike(completedYearRaw);
  const expectedYear = formatYearLike(expectedYearRaw);

  // 价格
  const priceInfo = getPriceInfo(mode, layout, form, rawProperty);
  const priceText = formatPriceText(priceInfo);

  // Rent room mode
  const roomRentalMode = pickAny(shared, ["roomRentalMode", "room_rental_mode", "roomrentalmode"]);
  const isRentRoom = mode.isRent && String(roomRentalMode).toLowerCase() === "room";

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="min-w-0">
        <div className="text-lg font-semibold text-gray-900 truncate">{title}</div>
        <div className="text-sm text-gray-600 mt-1 truncate">{isNonEmpty(address) ? address : "-"}</div>

        <div className="text-base font-semibold text-blue-700 mt-2">{isNonEmpty(priceText) ? priceText : "-"}</div>

        <div className="text-sm text-gray-700 mt-2 flex flex-wrap gap-x-4 gap-y-1">
          <span>🛏 {isNonEmpty(bedrooms) ? toText(bedrooms) : "-"}</span>
          <span>🛁 {isNonEmpty(bathrooms) ? toText(bathrooms) : "-"}</span>
          <span>🚗 {isNonEmpty(carparks) ? toText(carparks) : "-"}</span>
        </div>

        <div className="mt-3 space-y-1">
          {/* SALE */}
          {mode.isSale && (
            <>
              <MetaLine label="Sale / Rent" value="Sale" />
              <MetaLine label="Property Usage" value={usage} />
              <MetaLine label="Property Title" value={propertyTitle} />
              <MetaLine label="Property Status / Sale Type" value={propertyStatus} />
              <MetaLine label="Affordable Housing" value={affordableText} />
              <MetaLine label="Tenure Type" value={tenure} />
              <MetaLine label="Property Category" value={category} />
              <MetaLine label="Sub Type" value={subType} />
              <MetaLine label="Storeys" value={storeys} />
              <MetaLine label="Property Subtype" value={subtypesMulti} />

              <MetaLine label="你的产业步行能到达公共交通吗？" value={transitText} />

              {/* ✅ 年份显示规则 */}
              {mode.isProjectNew ? (
                <>
                  <MetaLine label="完成年份" value="-" />
                  <MetaLine label="预计完成年份" value={isNonEmpty(expectedYear) ? expectedYear : "-"} />
                </>
              ) : mode.isProjectCompleted ? (
                <>
                  <MetaLine label="完成年份" value={isNonEmpty(completedYear) ? completedYear : "-"} />
                  <MetaLine label="预计完成年份" value="-" />
                </>
              ) : (
                <>
                  <MetaLine label="完成年份" value={isNonEmpty(completedYear) ? completedYear : "-"} />
                  <MetaLine label="预计完成年份" value={isNonEmpty(expectedYear) ? expectedYear : "-"} />
                </>
              )}
            </>
          )}

          {/* RENT（整间） */}
          {mode.isRent && !isRentRoom && (
            <>
              <MetaLine label="Sale / Rent" value="Rent" />
              <MetaLine label="Property Category" value={category} />
              <MetaLine label="Storeys" value={storeys} />
              <MetaLine label="Property Subtype" value={subtypesMulti} />
              <MetaLine label="房间数量" value={bedrooms} />
              <MetaLine label="浴室数量" value={bathrooms} />
              <MetaLine label="停车位数量" value={carparks} />
              <MetaLine label="你的产业步行能到达公共交通吗？" value={transitText} />
            </>
          )}

          {/* RENT（出租房间） */}
          {mode.isRent && isRentRoom && (
            <>
              <MetaLine label="租金" value={isNonEmpty(priceText) ? priceText : "-"} />
              <MetaLine label="Property Category" value={category} />
              <MetaLine label="Storeys" value={storeys} />
              <MetaLine label="Property Subtype" value={subtypesMulti} />
              <MetaLine label="停车位数量" value={carparks} />
              <MetaLine label="你的产业步行能到达公共交通吗？" value={transitText} />
            </>
          )}

          {/* HOMESTAY */}
          {mode.isHomestay && (
            <>
              <MetaLine label="Sale / Rent" value="Homestay" />
              <MetaLine label="Property Category" value={category} />
              <MetaLine label="你的产业步行能到达公共交通吗？" value={transitText} />
            </>
          )}

          {/* HOTEL / RESORT */}
          {mode.isHotel && (
            <>
              <MetaLine label="Sale / Rent" value="Hotel/Resort" />
              <MetaLine label="Property Category" value={category} />
              <MetaLine label="你的产业步行能到达公共交通吗？" value={transitText} />
            </>
          )}
        </div>
      </div>

      {/* 123 按钮 */}
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
      const merged = mergePropertyData(p);
      const { mode, layout, form } = getSources(p, merged);
      const info = getPriceInfo(mode, layout, form, p);
      if (!info) return 0;
      if (info.kind === "range") return info.max || info.min || 0;
      if (info.kind === "single") return info.value || 0;
      return 0;
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
            className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="latest">最新优先</option>
            <option value="oldest">最旧优先</option>
            <option value="priceHigh">价格：高到低</option>
            <option value="priceLow">价格：低到高</option>
          </select>
        </div>
      </div>

      {/* 列表 */}
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
