// pages/property/[id].js
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useUser } from "@supabase/auth-helpers-react";
import { FaHeart, FaRegHeart } from "react-icons/fa";

/* ========= 工具函数（与 PropertyCard 同逻辑） ========= */

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

function normalizeNumber(v) {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const s = v.replace(/rm/gi, "").replace(/,/g, "").trim();
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function normalizeBedroom(v) {
  if (v === null || v === undefined) return "0";
  if (typeof v === "string") {
    if (v.toLowerCase().includes("studio")) return "Studio";
    const n = Number(v);
    return Number.isFinite(n) ? String(n) : v;
  }
  if (typeof v === "number") return String(v);
  if (typeof v === "object") {
    return normalizeBedroom(v.label ?? v.value ?? v.bedrooms);
  }
  return "0";
}

function pickImages(property, form) {
  if (Array.isArray(form?.image_urls) && form.image_urls.length > 0) {
    return form.image_urls;
  }
  if (Array.isArray(property?.image_urls)) {
    try {
      return typeof property.image_urls === "string"
        ? JSON.parse(property.image_urls)
        : property.image_urls;
    } catch {
      return [];
    }
  }
  return [];
}

function getDetailSummary(property) {
  const saleType = property?.saleType || property?.sale_type || "";

  const sfd = safeObj(property?.single_form_data_v2);
  const homestay = safeObj(property?.homestay_form);
  const hotel = safeObj(property?.hotel_resort_form);

  // 默认兜底（旧 column）
  let title = property?.title || "未命名房源";
  let price = normalizeNumber(property?.price);
  let bedrooms = normalizeBedroom(property?.bedrooms);
  let bathrooms = normalizeNumber(property?.bathrooms);
  let carparks = normalizeNumber(property?.carparks);
  let location = property?.address || "";
  let typeLabel = property?.type || "未分类";
  let description = property?.description || "";
  let images = pickImages(property, {});

  // 👉 Sale / Rent / Subsale / Auction / Rent-to-own
  if (saleType !== "Homestay" && saleType !== "Hotel/Resort") {
    if (sfd) {
      title = sfd.title || title;
      price = normalizeNumber(sfd.price ?? price);
      bedrooms = normalizeBedroom(sfd.bedrooms ?? bedrooms);
      bathrooms = normalizeNumber(sfd.bathrooms ?? bathrooms);
      carparks = normalizeNumber(sfd.carparks ?? carparks);
      location = sfd.address || location;
      description = sfd.description || description;
      images = pickImages(property, sfd);

      typeLabel =
        property?.propertyStatus ||
        sfd.propertyStatus ||
        sfd.status ||
        typeLabel;
    }
  }

  // 👉 Homestay
  if (saleType === "Homestay" && homestay) {
    title = homestay.title || title;
    price = normalizeNumber(homestay.price ?? price);
    bedrooms = normalizeBedroom(homestay.bedrooms ?? bedrooms);
    bathrooms = normalizeNumber(homestay.bathrooms ?? bathrooms);
    carparks = normalizeNumber(homestay.carparks ?? carparks);
    location = homestay.address || location;
    description = homestay.description || description;
    images = pickImages(property, homestay);
    typeLabel = "Homestay";
  }

  // 👉 Hotel / Resort
  if (saleType === "Hotel/Resort" && hotel) {
    title = hotel.title || title;
    price = normalizeNumber(hotel.price ?? price);
    bedrooms = normalizeBedroom(hotel.roomCount ?? bedrooms);
    bathrooms = normalizeNumber(hotel.bathrooms ?? bathrooms);
    carparks = normalizeNumber(hotel.carparks ?? carparks);
    location = hotel.address || location;
    description = hotel.description || description;
    images = pickImages(property, hotel);
    typeLabel = "Hotel / Resort";
  }

  return {
    title,
    price,
    bedrooms,
    bathrooms,
    carparks,
    location,
    typeLabel,
    description,
    images,
  };
}

/* ========= 页面组件 ========= */

export default function PropertyDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [property, setProperty] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const user = useUser();

  useEffect(() => {
    if (id) fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    const { data } = await supabase
      .from("properties")
      .select("*")
      .eq("id", id)
      .single();
    if (data) {
      setProperty(data);
      checkIfFavorite(data.id);
    }
  };

  const checkIfFavorite = async (propertyId) => {
    if (!user) return;
    const { data } = await supabase
      .from("favorites")
      .select("*")
      .eq("user_id", user.id)
      .eq("property_id", propertyId)
      .single();
    setIsFavorite(!!data);
  };

  const toggleFavorite = async () => {
    if (!user || !property) return;
    if (isFavorite) {
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("property_id", property.id);
      setIsFavorite(false);
    } else {
      await supabase.from("favorites").insert({
        user_id: user.id,
        property_id: property.id,
      });
      setIsFavorite(true);
    }
  };

  const summary = useMemo(() => {
  if (!property) return null;
  return getDetailSummary(property);
}, [property]);

if (!property) {
  return <div className="p-4">载入中...</div>;
}

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-2">{summary.title}</h1>

      <div className="flex items-center justify-between mb-4">
        <p className="text-lg text-gray-600">
          RM {summary.price.toLocaleString()}
        </p>
        <Button onClick={toggleFavorite} variant="ghost" className="text-red-500">
          {isFavorite ? <FaHeart size={24} /> : <FaRegHeart size={24} />}
        </Button>
      </div>

      {summary.images.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {summary.images.map((url, index) => (
            <div key={index} className="relative w-full h-64 rounded overflow-hidden shadow">
              <Image src={url} alt="" fill className="object-cover" />
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <p><strong>地点：</strong> {summary.location}</p>
        <p><strong>类型：</strong> {summary.typeLabel}</p>
        <p><strong>房间：</strong> {summary.bedrooms}</p>
        <p><strong>浴室：</strong> {summary.bathrooms}</p>
        <p><strong>车位：</strong> {summary.carparks}</p>
        <p><strong>描述：</strong> {summary.description}</p>
      </div>
    </div>
  );
}
