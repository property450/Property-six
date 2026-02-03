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

// 兼容你 JSON 里的 Yes/No / 是/否
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
   ✅ 合并 JSON 列（你原本逻辑）
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
   ✅ 价格显示（只改这里的必要逻辑）
========================= */
function getCardPriceText(rawProperty, mergedProperty) {
  const rp = rawProperty || {};
  const mp = mergedProperty || {};

  const mode = String(pickAny(mp, ["saleType", "sale_type", "saletype", "listing_mode"])).trim().toLowerCase();

  // ✅ Rent：绝对不要用 price_min / price_max（那通常是旧 Sale 残留）
  if (mode === "rent") {
    const rentPrice = pickAny(mp, ["rentPrice", "rent_price", "monthlyRent", "monthly_rent", "price"]);
    return isNonEmpty(rentPrice) ? money(rentPrice) : "";
  }

  // ✅ 只有 Sale 的 Project 才可能用 range
  const hasMin = isNonEmpty(rp.price_min);
  const hasMax = isNonEmpty(rp.price_max);

  const minNum = hasMin ? Number(String(rp.price_min).replace(/[^\d.]/g, "")) : NaN;
  const maxNum = hasMax ? Number(String(rp.price_max).replace(/[^\d.]/g, "")) : NaN;

  if (mode === "sale" && hasMin && hasMax && !Number.isNaN(minNum) && !Number.isNaN(maxNum) && minNum !== maxNum) {
    return `${money(rp.price_min)} ~ ${money(rp.price_max)}`;
  }

  // ✅ 其他情况：优先从“你表单保存的数据”里找单价
  const single = pickAny(mp, [
    "price",
    "salePrice",
    "sale_price",
    "sellingPrice",
    "selling_price",
    "rentPrice",
    "rent_price",
    "monthlyRent",
    "monthly_rent",
    "nightlyPrice",
    "nightly_price",
    "basePrice",
    "base_price",
    "price_min",
    "price_max",
  ]);

  if (isNonEmpty(single)) return money(single);

  return "";
}

/* =========================
   Card（卖家后台卡片）
========================= */
function SellerPropertyCard({ rawProperty, onView, onEdit, onDelete }) {
  const p = useMemo(() => mergePropertyData(rawProperty), [rawProperty]);

  const title = pickAny(p, ["title"]);
  const address = pickAny(p, ["address"]);

  const bedrooms = pickAny(p, ["bedrooms", "bedroom_count", "room_count"]);
  const bathrooms = pickAny(p, ["bathrooms", "bathroom_count"]);
  const carparks = pickAny(p, ["carparks", "carpark"]);

  const saleType = pickAny(p, ["saleType", "sale_type", "saletype", "listing_mode"]);
  const finalType = pickAny(p, ["finalType"]);
  const roomRentalMode = pickAny(p, ["roomRentalMode", "room_rental_mode", "roomrentalmode"]);

  const showSale = String(saleType).toLowerCase() === "sale";
  const showRent = String(saleType).toLowerCase() === "rent";
  const showHomestay = String(saleType).toLowerCase() === "homestay";
  // ✅ 修复：只看 saleType，不用 finalType 来误判
  const showHotel = String(saleType).toLowerCase() === "hotel/resort";

  const isRentRoom = showRent && String(roomRentalMode).toLowerCase() === "room";

  const usage = pickAny(p, ["usage", "property_usage"]);
  const tenure = pickAny(p, ["tenure", "tenure_type"]);
  const storeys = pickAny(p, ["storeys"]);
  const category = pickAny(p, ["category", "propertyCategory", "property_category"]);
  const subType = pickAny(p, ["subType", "property_sub_type", "sub_type"]);
  const subtypesMulti = pickAny(p, ["subtype", "property_subtypes", "propertySubtype"]);

  const propertyTitle = pickAny(p, ["propertyTitle", "property_title"]);
  const propertyStatus = pickAny(p, ["propertyStatus", "property_status", "propertystatus"]);

  const affordableRaw = pickAny(p, ["affordable", "affordable_housing", "affordableHousing"]);
  const affordableType = pickAny(p, ["affordableType", "affordable_housing_type", "affordableHousingType"]);
  let affordable = yesNoText(affordableRaw);
  if (affordableType && affordable !== "是") affordable = "是";

  const completedYear = pickAny(p, ["completedYear", "built_year"]);
  const expectedYear = pickAny(p, ["expectedCompletedYear", "expected_year"]);

  const homestayType = pickAny(p, ["homestayType", "homestay_type"]);
  const hotelResortType = pickAny(p, ["hotelResortType", "hotel_resort_type"]);

  const cardPriceText = getCardPriceText(rawProperty, p);

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="min-w-0">
        <div className="text-lg font-semibold text-gray-900 truncate">{title || "（未命名房源）"}</div>
        {isNonEmpty(address) && <div className="text-sm text-gray-600 mt-1 truncate">{address}</div>}

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-700">
          {isNonEmpty(cardPriceText) && <div className="font-semibold text-gray-900">{cardPriceText}</div>}

          {isNonEmpty(bedrooms) && <div>房间：{toText(bedrooms)}</div>}
          {isNonEmpty(bathrooms) && <div>浴室：{toText(bathrooms)}</div>}
          {isNonEmpty(carparks) && <div>停车位：{toText(carparks)}</div>}

          {showSale && <div className="text-gray-500">模式：Sale</div>}
          {showRent && <div className="text-gray-500">模式：Rent{isRentRoom ? "（房间出租）" : "（整间出租）"}</div>}
          {showHomestay && <div className="text-gray-500">模式：Homestay</div>}
          {showHotel && <div className="text-gray-500">模式：Hotel/Resort</div>}
        </div>

        <div className="mt-4 space-y-1">
          <MetaLine label="Property Usage" value={usage} />
          <MetaLine label="Property Title" value={propertyTitle} />
          <MetaLine label="Property Status" value={propertyStatus} />
          <MetaLine label="Tenure" value={tenure} />
          <MetaLine label="Property Category" value={category} />
          <MetaLine label="Sub Type" value={subType} />
          <MetaLine label="Storeys" value={storeys} />
          <MetaLine label="Property Subtype" value={Array.isArray(subtypesMulti) ? subtypesMulti.join(", ") : subtypesMulti} />

          <MetaLine label="Affordable Housing" value={affordable} />
          <MetaLine label="Affordable Type" value={affordableType} />

          <MetaLine label="Completed Year" value={completedYear} />
          <MetaLine label="Expected Completed" value={expectedYear} />

          {showHomestay && <MetaLine label="Homestay Type" value={homestayType} />}
          {showHotel && <MetaLine label="Hotel/Resort Type" value={hotelResortType || finalType} />}
        </div>

        <div className="mt-4 flex gap-2">
          <button className="px-3 py-2 rounded-lg bg-black text-white" onClick={onView}>
            查看
          </button>
          <button className="px-3 py-2 rounded-lg bg-gray-200 text-black" onClick={onEdit}>
            编辑
          </button>
          <button className="px-3 py-2 rounded-lg bg-red-600 text-white" onClick={onDelete}>
            删除
          </button>
        </div>
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
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const run = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error(error);
        setList([]);
      } else {
        setList(Array.isArray(data) ? data : []);
      }
      setLoading(false);
    };
    run();
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="text-lg font-semibold">请先登录</div>
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
      alert("删除失败（请看 Console）");
      return;
    }
    setList((prev) => prev.filter((x) => x.id !== p.id));
    alert("已删除");
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <div className="text-2xl font-bold">我的房源</div>

      {loading && <div className="text-sm text-gray-500">加载中…</div>}
      {!loading && list.length === 0 && <div className="text-sm text-gray-500">你还没有上传任何房源</div>}

      <div className="space-y-3">
        {list.map((p) => (
          <SellerPropertyCard
            key={p.id}
            rawProperty={p}
            onView={() => onView(p)}
            onEdit={() => onEdit(p)}
            onDelete={() => onDelete(p)}
          />
        ))}
      </div>
    </div>
  );
}
