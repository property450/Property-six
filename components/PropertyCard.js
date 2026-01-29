import Link from "next/link";
import { useUser } from "@supabase/auth-helpers-react";
import { supabase } from "../supabaseClient";
import { useEffect, useMemo, useState } from "react";

function safeObj(v) {
  if (!v) return null;
  if (typeof v === "string") {
    try {
      return JSON.parse(v);
    } catch {
      return null;
    }
  }
  if (typeof v === "object") return v;
  return null;
}

function pickCover(property, formObj) {
  // formObj.coverImage / formObj.image_urls / property.image_urls
  const cover1 = formObj?.coverImage;
  if (cover1) return cover1;

  const formImgs = formObj?.image_urls || formObj?.imageUrls || [];
  if (Array.isArray(formImgs) && formImgs.length > 0) return formImgs[0];

  const imgs = property?.image_urls || [];
  if (Array.isArray(imgs) && imgs.length > 0) return imgs[0];

  return "/no-image.jpg";
}

function normalizeBedroomDisplay(v) {
  // 支持：数字、"Studio"、{label:"Studio"}、{value:"Studio"}、{bedrooms:"Studio"}
  if (v === null || v === undefined) return "0";

  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return "0";
    // studio
    if (s.toLowerCase().includes("studio")) return "Studio";
    // 纯数字字符串
    const n = Number(s);
    if (Number.isFinite(n)) return String(n);
    return s;
  }

  if (typeof v === "number") {
    if (!Number.isFinite(v)) return "0";
    return String(v);
  }

  if (typeof v === "object") {
    const cand = v.label ?? v.value ?? v.name ?? v.bedrooms;
    return normalizeBedroomDisplay(cand);
  }

  return "0";
}

function normalizeNumber(v) {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    // 去掉逗号/RM
    const s = v.replace(/rm/gi, "").replace(/,/g, "").trim();
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function getCardSummary(property) {
  // ✅ 以 saleType 决定用哪个表单（避免 hotel_resort_form 永远覆盖 sale/subsale）
  const saleType = property?.saleType || property?.sale_type || "";

  const sfd = safeObj(property?.single_form_data_v2) || safeObj(property?.singleFormData) || safeObj(property?.single_form_data);
  const homestay = safeObj(property?.homestay_form);
  const hotel = safeObj(property?.hotel_resort_form);

  // 默认兜底（旧 column）
  let title = property?.title || "未命名房源";
  let price = normalizeNumber(property?.price);
  let bedrooms = normalizeBedroomDisplay(property?.bedrooms);
  let bathrooms = normalizeNumber(property?.bathrooms);
  let carparks = normalizeNumber(property?.carparks);
  let location = property?.location || property?.address || "";
  let typeLabel = property?.type || "未分类";

  // ✅ Sale / Rent / Subsale…：统一用 single_form_data_v2 + propertyStatus
  if (saleType !== "Homestay" && saleType !== "Hotel/Resort") {
    if (sfd) {
      title = sfd.title || title;
      price = normalizeNumber(sfd.price ?? sfd.priceValue ?? price);
      bedrooms = normalizeBedroomDisplay(sfd.bedrooms ?? sfd.roomCount ?? bedrooms);
      bathrooms = normalizeNumber(sfd.bathrooms ?? bathrooms);
      carparks = normalizeNumber(sfd.carparks ?? carparks);
      location = sfd.location || sfd.address || location;

      // ✅ 类型：优先用 propertyStatus（比如 Subsale / Auction）
      const ps = property?.propertyStatus || property?.property_status || sfd.propertyStatus || sfd.status;
      typeLabel = ps || sfd.category || property?.type || typeLabel;
    } else {
      // 没有 sfd 就退回 propertyStatus / type
      const ps = property?.propertyStatus || property?.property_status;
      typeLabel = ps || typeLabel;
    }

    const cover = pickCover(property, sfd || {});
    return { title, price, bedrooms, bathrooms, carparks, location, typeLabel, cover };
  }

  // ✅ Homestay：只用 homestay_form
  if (saleType === "Homestay") {
    if (homestay) {
      title = homestay.title || title;
      price = normalizeNumber(homestay.price ?? price);
      bedrooms = normalizeBedroomDisplay(homestay.bedrooms ?? homestay.roomCount ?? bedrooms);
      bathrooms = normalizeNumber(homestay.bathrooms ?? bathrooms);
      carparks = normalizeNumber(homestay.carparks ?? carparks);
      location = homestay.location || homestay.address || location;
    }
    typeLabel = "Homestay";
    const cover = pickCover(property, homestay || {});
    return { title, price, bedrooms, bathrooms, carparks, location, typeLabel, cover };
  }

  // ✅ Hotel/Resort：只用 hotel_resort_form
  if (saleType === "Hotel/Resort") {
    if (hotel) {
      title = hotel.title || title;
      price = normalizeNumber(hotel.price ?? price);
      bedrooms = normalizeBedroomDisplay(hotel.roomCount ?? hotel.bedrooms ?? bedrooms);
      bathrooms = normalizeNumber(hotel.bathrooms ?? bathrooms);
      carparks = normalizeNumber(hotel.carparks ?? carparks);
      location = hotel.location || hotel.address || location;
    }
    typeLabel = "Hotel / Resort";
    const cover = pickCover(property, hotel || {});
    return { title, price, bedrooms, bathrooms, carparks, location, typeLabel, cover };
  }

  const cover = pickCover(property, sfd || {});
  return { title, price, bedrooms, bathrooms, carparks, location, typeLabel, cover };
}

export default function PropertyCard({ property }) {
  const user = useUser();
  const [isFav, setIsFav] = useState(false);

  const { id } = property || {};

  const { title, price, bedrooms, bathrooms, carparks, location, typeLabel, cover } = useMemo(
    () => getCardSummary(property),
    [property]
  );

  useEffect(() => {
    // 不改你原逻辑：收藏状态是否初始化你自己决定
  }, []);

  async function toggleFavorite() {
    if (!user) {
      alert("请先登录再收藏房源");
      return;
    }

    if (isFav) {
      await supabase.from("favorites").delete().match({ user_id: user.id, property_id: id });
      setIsFav(false);
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, property_id: id });
      setIsFav(true);
    }
  }

  return (
    <div className="group flex flex-col md:flex-row border rounded-2xl shadow hover:shadow-lg transition overflow-hidden bg-white">
      <img
        src={cover}
        alt={title}
        loading="lazy"
        className="w-full md:w-64 h-48 md:h-auto object-cover"
      />

      <div className="p-4 flex-1 space-y-2">
        <div className="flex justify-between items-start">
          <h2 className="text-xl font-semibold text-gray-800 line-clamp-1">{title}</h2>
          <button
            onClick={toggleFavorite}
            className={`text-xl ${isFav ? "text-red-500" : "text-gray-400"} hover:scale-110 transition`}
            title={isFav ? "取消收藏" : "添加收藏"}
          >
            ❤️
          </button>
        </div>

        <p className="text-gray-500 text-sm line-clamp-1">📍 {location}</p>

        <p className="text-lg font-bold text-blue-700">
          RM {Number(price || 0).toLocaleString()}
        </p>

        <div className="flex flex-wrap gap-3 text-sm text-gray-700">
          <span>🛏 {bedrooms} 房</span>
          <span>🛁 {bathrooms} 浴</span>
          <span>🚗 {carparks} 车</span>
        </div>

        <p className="text-xs text-gray-500">🏷 {typeLabel}</p>

        <Link
          href={`/property/${id}`}
          className="inline-block bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 text-sm mt-2"
        >
          查看详情
        </Link>
      </div>
    </div>
  );
}
