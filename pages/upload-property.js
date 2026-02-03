// pages/upload-property.js
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { supabase } from "../supabaseClient";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";

import TypeSelector from "@/components/TypeSelector";

import HotelUploadForm from "@/components/hotel/HotelUploadForm";
import HomestayUploadForm from "@/components/homestay/HomestayUploadForm";

import ProjectUploadForm from "@/components/forms/ProjectUploadForm";
import RentUploadForm from "@/components/forms/RentUploadForm";
import SaleUploadForm from "@/components/forms/SaleUploadForm";
import ListingTrustSection from "@/components/trust/ListingTrustSection";

import { useUser } from "@supabase/auth-helpers-react";

const AddressSearchInput = dynamic(() => import("@/components/AddressSearchInput"), {
  ssr: false,
});

const pickCommon = (l) => ({
  extraSpaces: l.extraSpaces || [],
  furniture: l.furniture || [],
  facilities: l.facilities || [],
  transit: l.transit ?? null,
});
const commonHash = (l) => JSON.stringify(pickCommon(l));

function isJsonLikeString(s) {
  if (typeof s !== "string") return false;
  const t = s.trim();
  return (t.startsWith("{") && t.endsWith("}")) || (t.startsWith("[") && t.endsWith("]"));
}

function safeParseMaybeJson(v) {
  if (v == null) return v;
  if (typeof v === "string" && isJsonLikeString(v)) {
    try {
      return JSON.parse(v);
    } catch {
      return v;
    }
  }
  return v;
}

function stableJson(obj) {
  const seen = new WeakSet();

  const sortDeep = (v) => {
    if (v === null || v === undefined) return v;
    if (v instanceof Date) return v.toISOString();
    if (Array.isArray(v)) return v.map(sortDeep);

    if (typeof v === "object") {
      if (seen.has(v)) return null;
      seen.add(v);
      const out = {};
      Object.keys(v)
        .sort()
        .forEach((k) => {
          const val = v[k];
          if (val === undefined) return;
          if (typeof val === "function") return;
          out[k] = sortDeep(val);
        });
      return out;
    }
    return v;
  };

  try {
    return JSON.stringify(sortDeep(obj ?? null));
  } catch {
    return "";
  }
}

/* =========================
   ✅ 你原本的 auto-strip 缺 column 机制
========================= */

const PROTECTED_KEYS = new Set(["type_form_v2", "single_form_data_v2"]);

function extractMissingColumnName(err) {
  const msg = String(err?.message || "");
  const m =
    msg.match(/column\s+"([^"]+)"\s+does\s+not\s+exist/i) ||
    msg.match(/Could not find the '([^']+)' column/i);
  return m?.[1] || "";
}

function dropProtectedIfCounterpartExists(payload, missing) {
  const counterpart = missing === "type_form_v2" ? "type_form" : missing === "single_form_data_v2" ? "single_form_data" : "";
  if (!counterpart) return false;
  if (Object.prototype.hasOwnProperty.call(payload, counterpart)) {
    delete payload[missing];
    return true;
  }
  return false;
}

async function runWithAutoStripColumns({ mode, payload, editId, userId, maxTries = 8 }) {
  let working = { ...(payload || {}) };
  const removed = [];

  for (let i = 0; i < maxTries; i++) {
    let res;
    if (mode === "update") {
      res = await supabase.from("properties").update(working).eq("id", editId).eq("user_id", userId);
    } else {
      res = await supabase.from("properties").insert(working);
    }

    if (!res?.error) return { ok: true, removed };

    const err = res.error;
    console.error("[Supabase Error]", err);

    const missing = extractMissingColumnName(err);

    if (err?.code === "PGRST204" && missing) {
      if (PROTECTED_KEYS.has(missing)) {
        const dropped = dropProtectedIfCounterpartExists(working, missing);
        if (dropped) {
          removed.push(`${missing} (missing, kept counterpart)`);
          continue;
        }
        return { ok: false, removed, error: err, protectedMissing: missing };
      }

      if (!Object.prototype.hasOwnProperty.call(working, missing)) {
        return { ok: false, removed, error: err };
      }

      delete working[missing];
      removed.push(missing);
      continue;
    }

    return { ok: false, removed, error: err };
  }

  return { ok: false, removed, error: new Error("自动处理次数用尽（请看 Console 报错）") };
}

function hasAnyValue(obj) {
  if (!obj || typeof obj !== "object") return false;
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (v === null || v === undefined) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    if (typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0) continue;
    return true;
  }
  return false;
}

/** ✅ 把 singleFormData 里 Homestay/Hotel 相关字段拆出来，写入新 column（不影响你原本 single_form_data_v2） */
function buildHomestayFormFromSingle(singleFormData) {
  const s = singleFormData || {};
  const out = {
    homestayType: s.homestayType ?? "",
    category: s.category ?? s.homestayCategory ?? s.propertyCategory ?? "",
    finalType: s.finalType ?? s.homestaySubType ?? s.subType ?? "",
    storeys: s.storeys ?? s.homestayStoreys ?? "",
    subtype: s.subtype ?? s.homestaySubtype ?? s.propertySubtype ?? [],
  };
  return hasAnyValue(out) ? out : null;
}

function buildHotelFormFromSingle(singleFormData) {
  const s = singleFormData || {};
  const out = {
    hotelResortType: s.hotelResortType ?? s.hotel_resort_type ?? "",
    roomLayouts: s.roomLayouts ?? s.room_layouts ?? null,
    facilityImages: s.facilityImages ?? s.facility_images ?? {},
    roomCount: s.roomCount ?? s.room_count ?? null,
  };
  return hasAnyValue(out) ? out : null;
}

// ✅✅✅ 关键修复：把 homestay_form / hotel_resort_form 合并回 singleFormData 时，必须“空值也允许覆盖”
function mergeFormsIntoSingle(singleFormData, homestayForm, hotelForm) {
  const base = { ...(singleFormData || {}) };
  const h1 = homestayForm && typeof homestayForm === "object" ? homestayForm : null;
  const h2 = hotelForm && typeof hotelForm === "object" ? hotelForm : null;

  const isEmpty = (v) => {
    if (v === null || v === undefined) return true;
    if (typeof v === "string") return v.trim() === "";
    if (Array.isArray(v)) return v.length === 0;
    if (typeof v === "object") return Object.keys(v).length === 0;
    return false;
  };

  const fill = (key, val) => {
    if (val === undefined) return;
    if (isEmpty(base[key])) base[key] = val;
  };

  if (h1) {
    fill("homestayType", h1.homestayType ?? "");
    fill("category", h1.category ?? "");
    fill("finalType", h1.finalType ?? "");
    fill("storeys", h1.storeys ?? "");
    fill("subtype", Array.isArray(h1.subtype) ? h1.subtype : []);

    fill("homestayCategory", h1.category ?? "");
    fill("homestaySubType", h1.finalType ?? "");
    fill("homestayStoreys", h1.storeys ?? "");
    fill("homestaySubtype", Array.isArray(h1.subtype) ? h1.subtype : []);

    fill("propertyCategory", h1.category ?? "");
    fill("subType", h1.finalType ?? "");
    fill("propertySubtype", Array.isArray(h1.subtype) ? h1.subtype : []);
  }

  if (h2) {
    fill("hotelResortType", h2.hotelResortType ?? "");
    fill("roomLayouts", Array.isArray(h2.roomLayouts) ? h2.roomLayouts : null);
    fill("facilityImages", h2.facilityImages && typeof h2.facilityImages === "object" ? h2.facilityImages : {});
    fill("roomCount", h2.roomCount ?? null);

    fill("hotel_resort_type", h2.hotelResortType ?? "");
    fill("room_layouts", Array.isArray(h2.roomLayouts) ? h2.roomLayouts : null);
    fill("facility_images", h2.facilityImages && typeof h2.facilityImages === "object" ? h2.facilityImages : {});
    fill("room_count", h2.roomCount ?? null);
  }

  return base;
}

export default function UploadPropertyPage() {
  const router = useRouter();
  const user = useUser();

  const [submitting, setSubmitting] = useState(false);

  const [addressObj, setAddressObj] = useState(null);

  const [typeValue, setTypeValue] = useState("");
  const [rentBatchMode, setRentBatchMode] = useState("no");
  const [typeForm, setTypeForm] = useState(null);

  // ✅✅✅【修复闪烁核心】TypeSelector 的 initialForm 只给一次（编辑回填时）
  const [typeSelectorInitialForm, setTypeSelectorInitialForm] = useState(null);

  const [saleType, setSaleType] = useState("");
  const [computedStatus, setComputedStatus] = useState("");
  const [roomRentalMode, setRoomRentalMode] = useState("whole");

  const [projectCategory, setProjectCategory] = useState("");
  const [projectSubType, setProjectSubType] = useState("");
  const [unitLayouts, setUnitLayouts] = useState([]);

  const [singleFormData, setSingleFormData] = useState({});
  const [areaData, setAreaData] = useState({
    types: ["buildUp"],
    units: { buildUp: "Square Feet (sqft)", land: "Square Feet (sqft)" },
    values: { buildUp: "", land: "" },
  });

  const [description, setDescription] = useState("");

  // ✅ 编辑模式
  const isEditMode = String(router?.query?.edit || "") === "1";
  const editId = router?.query?.id ? String(router.query.id) : "";

  // ✅ 防重复 hydrate 的 ref
  const lastFormJsonRef = useRef("");
  const lastDerivedRef = useRef({ saleType: "", status: "", roomMode: "whole" });
  const [editHydrated, setEditHydrated] = useState(false);

  useEffect(() => {
    if (!isEditMode || !editId || !user) return;

    const fetchForEdit = async () => {
      try {
        const { data, error } = await supabase
          .from("properties")
          .select("*")
          .eq("id", editId)
          .eq("user_id", user.id)
          .single();

        if (error) throw error;
        if (!data) throw new Error("No data");

        const tf =
          safeParseMaybeJson(data?.type_form_v2) ??
          safeParseMaybeJson(data?.type_form) ??
          safeParseMaybeJson(data?.typeForm) ??
          null;

        const sfd =
          safeParseMaybeJson(data?.single_form_data_v2) ??
          safeParseMaybeJson(data?.single_form_data) ??
          safeParseMaybeJson(data?.singleFormData) ??
          {};

        const homestayForm = safeParseMaybeJson(data?.homestay_form) ?? null;
        const hotelForm = safeParseMaybeJson(data?.hotel_resort_form) ?? null;

        const mergedSingle = mergeFormsIntoSingle(sfd, homestayForm, hotelForm);

        const jsonSig = stableJson({ tf, mergedSingle, addr: data?.address, lat: data?.lat, lng: data?.lng });
        if (jsonSig && jsonSig === lastFormJsonRef.current) {
          setEditHydrated(true);
          return;
        }

        setAddressObj({ address: data?.address || "", lat: data?.lat, lng: data?.lng });
        setTypeValue(data?.type || "");
        setTypeForm(tf || null);

        setTypeSelectorInitialForm(tf || null);

        setSaleType(tf?.saleType || data?.saleType || "");
        setComputedStatus(tf?.propertyStatus || data?.propertyStatus || "");
        setRoomRentalMode(tf?.roomRentalMode || data?.roomRentalMode || "whole");

        setRentBatchMode(data?.rentBatchMode || tf?.rentBatchMode || "no");

        const ul =
          safeParseMaybeJson(data?.unit_layouts) ??
          safeParseMaybeJson(data?.unitLayouts) ??
          safeParseMaybeJson(data?.unitlayouts) ??
          [];

        setUnitLayouts(Array.isArray(ul) ? ul : []);

        const ad =
          safeParseMaybeJson(data?.area_data) ??
          safeParseMaybeJson(data?.areaData) ??
          safeParseMaybeJson(data?.areadata) ??
          null;
        if (ad && typeof ad === "object") setAreaData(ad);

        setSingleFormData(mergedSingle || {});
        setDescription(data?.description || "");

        lastDerivedRef.current = {
          saleType: (tf && tf.saleType) || "",
          status: (tf && tf.propertyStatus) || "",
          roomMode: (tf && tf.roomRentalMode) || "whole",
        };
        lastFormJsonRef.current = stableJson({ tf, mergedSingle, addr: data?.address, lat: data?.lat, lng: data?.lng });

        setEditHydrated(true);

        toast.success("已进入编辑模式");
      } catch (e) {
        console.error(e);
        setEditHydrated(true);
        toast.error("无法加载房源进行编辑");
        alert("无法加载房源进行编辑（请看 Console 报错）");
      }
    };

    fetchForEdit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, editId, user]);

  const mustLogin = !user;
  const mustPickSaleType = !saleType;
  const mustPickAddress = !addressObj?.lat || !addressObj?.lng;

  const saleTypeNorm = String(saleType || "").trim().toLowerCase();
  const isSale = saleTypeNorm.includes("sale");
  const isRent = saleTypeNorm.includes("rent");
  const isHomestay = saleTypeNorm.includes("homestay");
  const isHotel = saleTypeNorm.includes("hotel");

  const isProject =
    saleTypeNorm === "sale" &&
    ["New Project / Under Construction", "Completed Unit / Developer Unit"].includes(computedStatus);

  const rentCategorySelected = !!(typeForm && (typeForm.category || typeForm.propertyCategory));

  const copyCommonFromFirst = useCallback(() => {
    if (!Array.isArray(unitLayouts) || unitLayouts.length <= 1) return;

    const first = unitLayouts[0];
    const hash0 = commonHash(first);

    const next = unitLayouts.map((l, idx) => {
      if (idx === 0) return l;
      const curHash = commonHash(l);
      if (curHash === hash0) return l;
      return { ...l, ...pickCommon(first) };
    });

    setUnitLayouts(next);
  }, [unitLayouts]);

  useEffect(() => {
    if (!isProject) return;
    copyCommonFromFirst();
  }, [isProject, copyCommonFromFirst]);

  const onTypeFormChange = useCallback((form) => {
    const nextSale = form?.saleType || "";
    const nextStatus = form?.propertyStatus || "";
    const nextRoom = form?.roomRentalMode || "whole";

    const last = lastDerivedRef.current;
    if (last.saleType !== nextSale) setSaleType(nextSale);
    if (last.status !== nextStatus) setComputedStatus(nextStatus);
    if (last.roomMode !== nextRoom) setRoomRentalMode(nextRoom);

    lastDerivedRef.current = { saleType: nextSale, status: nextStatus, roomMode: nextRoom };
  }, []);

  const handleSubmit = async () => {
    if (mustLogin) {
      toast.error("请先登录");
      alert("请先登录（你现在 user 还是 null）");
      return;
    }
    if (mustPickSaleType) {
      toast.error("请选择 Sale / Rent / Homestay / Hotel");
      alert("请选择 Sale / Rent / Homestay / Hotel（你现在 saleType 还是空）");
      return;
    }
    if (mustPickAddress) {
      toast.error("请选择地址");
      alert("请选择地址（你现在 lat/lng 还是空）");
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    try {
      // ✅✅✅ 修复：保存时只保留“当前表单”的数据，其他表单相关数据一律清空（避免卡片读到旧资料）
      const modeLower = (() => {
        const s = String(saleType || "").trim().toLowerCase();
        if (s === "hotel/resort" || s.includes("hotel")) return "hotel/resort";
        return s;
      })();

      // 1) 先清理 singleFormData 里明显属于“其他模式”的字段（只动很少量 key，不会影响你原本表单结构）
      const cleanedSingleFormData = (() => {
        const s = { ...(singleFormData || {}) };

        const HOTEL_KEYS = [
          "hotelResortType",
          "hotel_resort_type",
          "roomLayouts",
          "room_layouts",
          "facilityImages",
          "facility_images",
          "roomCount",
          "room_count",
        ];
        const HOMESTAY_KEYS = [
          "homestayType",
          "homestay_type",
          "homestayCategory",
          "homestaySubType",
          "homestayStoreys",
          "homestaySubtype",
        ];

        if (modeLower !== "hotel/resort") HOTEL_KEYS.forEach((k) => delete s[k]);
        if (modeLower !== "homestay") HOMESTAY_KEYS.forEach((k) => delete s[k]);

        return s;
      })();

      // 2) 独立 column：只有当前模式才写入，否则强制写 null 覆盖旧值
      const homestay_form = modeLower === "homestay" ? buildHomestayFormFromSingle(cleanedSingleFormData) : null;
      const hotel_resort_form = modeLower === "hotel/resort" ? buildHotelFormFromSingle(cleanedSingleFormData) : null;

      // 3) 价格 column：同步写 price / price_min / price_max（旧值会被覆盖清空）
      const pickFirst = (obj, keys) => {
        const o = obj || {};
        for (const k of keys) {
          const v = o?.[k];
          if (v === 0) return v;
          if (v === null || v === undefined) continue;
          if (typeof v === "string" && v.trim() === "") continue;
          if (Array.isArray(v) && v.length === 0) continue;
          if (typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0) continue;
          return v;
        }
        return null;
      };

      let price = null;
      let price_min = null;
      let price_max = null;

      if (modeLower === "sale") {
        const isProjectSale =
          ["New Project / Under Construction", "Completed Unit / Developer Unit"].includes(String(computedStatus || ""));
        if (isProjectSale && Array.isArray(unitLayouts) && unitLayouts[0] && typeof unitLayouts[0] === "object") {
          const l0 = unitLayouts[0];
          price_min = pickFirst(l0, ["priceMin", "price_min", "minPrice", "min_price"]);
          price_max = pickFirst(l0, ["priceMax", "price_max", "maxPrice", "max_price"]);
          price = pickFirst(l0, ["price", "salePrice", "sale_price"]);
        } else {
          price = pickFirst(cleanedSingleFormData, [
            "price",
            "salePrice",
            "sale_price",
            "sellingPrice",
            "selling_price",
            "priceValue",
            "price_value",
          ]);
          price_min = pickFirst(cleanedSingleFormData, ["priceMin", "price_min", "minPrice", "min_price"]);
          price_max = pickFirst(cleanedSingleFormData, ["priceMax", "price_max", "maxPrice", "max_price"]);
        }
      } else if (modeLower === "rent") {
        price = pickFirst(cleanedSingleFormData, ["rentPrice", "rent_price", "monthlyRent", "monthly_rent", "price"]);
        price_min = null;
        price_max = null;
      } else if (modeLower === "homestay" || modeLower === "hotel/resort") {
        price = pickFirst(cleanedSingleFormData, ["price", "nightlyPrice", "nightly_price", "basePrice", "base_price"]);
        price_min = null;
        price_max = null;
      }

      // 4) unitLayouts：只在 Project 或 Rent 批量才保留，否则保存时覆盖成空（避免旧 layouts 残留）
      const keepUnitLayouts =
        isProject || (modeLower === "rent" && String(rentBatchMode || "").toLowerCase() === "yes");

      const payload = {
        user_id: user.id,
        address: addressObj?.address || "",
        lat: addressObj?.lat,
        lng: addressObj?.lng,

        saleType,
        propertyStatus: computedStatus,

        // ✅ 用于卖家后台卡片显示（会覆盖清空旧值）
        price,
        price_min,
        price_max,

        type: typeValue,

        type_form_v2: typeForm || null,
        single_form_data_v2: cleanedSingleFormData || {},

        typeForm: typeForm || null,
        type_form: typeForm || null,

        roomRentalMode,
        rentBatchMode,

        unitLayouts: keepUnitLayouts ? unitLayouts : [],
        unit_layouts: keepUnitLayouts ? unitLayouts : [],

        singleFormData: cleanedSingleFormData,
        single_form_data: cleanedSingleFormData,

        areaData,
        area_data: areaData,

        description,
        updated_at: new Date().toISOString(),

        // ✅✅✅ 关键：只有当前模式才写入；否则强制写 null 覆盖旧值
        homestay_form: homestay_form,
        hotel_resort_form: hotel_resort_form,

        // ✅✅✅ 日历字段（如果你已经在 Supabase 加了 column）
        availability: cleanedSingleFormData?.availability ?? cleanedSingleFormData?.availability_data ?? null,
        calendar_prices: cleanedSingleFormData?.calendar_prices ?? cleanedSingleFormData?.calendarPrices ?? null,
      };

      if (isEditMode) {
        const out = await runWithAutoStripColumns({
          mode: "update",
          payload,
          editId,
          userId: user.id,
          maxTries: 10,
        });

        if (!out.ok) {
          if (out.protectedMissing) {
            toast.error(`保存失败：Supabase 缺少关键 column：${out.protectedMissing}`);
            alert(
              `保存失败：Supabase 缺少关键 column：${out.protectedMissing}\n\n` +
                `✅ 你必须先在 Supabase SQL Editor 加上：type_form_v2 和 single_form_data_v2（jsonb）。\n\n` +
                `（请看 Console 的 [Supabase Error]）`
            );
            return;
          }

          const missing = extractMissingColumnName(out.error);
          if (missing) {
            toast.error(`提交失败：Supabase 缺少 column：${missing}`);
            alert(`提交失败：Supabase 缺少 column：${missing}\n（请看 Console 报错）`);
          } else {
            toast.error("提交失败（请看 Console 报错）");
            alert("提交失败（请看 Console 报错）");
          }
          return;
        }

        if (out.removed?.length) console.log("[Save] Removed columns:", out.removed);

        toast.success("保存修改成功");
        alert("保存修改成功");
        router.push("/my-profile");
        return;
      }

      const out = await runWithAutoStripColumns({
        mode: "insert",
        payload: { ...payload, created_at: new Date().toISOString() },
        userId: user.id,
        maxTries: 10,
      });

      if (!out.ok) {
        if (out.protectedMissing) {
          toast.error(`提交失败：Supabase 缺少关键 column：${out.protectedMissing}`);
          alert(
            `提交失败：Supabase 缺少关键 column：${out.protectedMissing}\n\n` +
              `✅ 你必须先在 Supabase SQL Editor 加上：type_form_v2 和 single_form_data_v2（jsonb）。\n\n` +
              `（请看 Console 的 [Supabase Error]）`
          );
          return;
        }

        const missing = extractMissingColumnName(out.error);
        if (missing) {
          toast.error(`提交失败：Supabase 缺少 column：${missing}`);
          alert(`提交失败：Supabase 缺少 column：${missing}\n（请看 Console 报错）`);
        } else {
          toast.error("提交失败（请看 Console 报错）");
          alert("提交失败（请看 Console 报错）");
        }
        return;
      }

      toast.success("提交成功");
      alert("提交成功");
      router.push("/");
    } catch (e) {
      console.error(e);
      toast.error("提交失败");
      alert("提交失败（请看 Console 报错）");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!user) {
      toast.error("请先登录");
      alert("请先登录");
      return;
    }
    if (!isEditMode) return;

    const ok = confirm("确定要删除这个房源吗？此操作不可恢复。");
    if (!ok) return;

    try {
      setSubmitting(true);
      const { error } = await supabase.from("properties").delete().eq("id", editId).eq("user_id", user.id);
      if (error) throw error;

      toast.success("房源已删除");
      alert("房源已删除");
      router.push("/my-profile");
    } catch (e) {
      console.error(e);
      toast.error("删除失败");
      alert("删除失败（请看 Console 报错）");
    } finally {
      setSubmitting(false);
    }
  };

  const shouldShowProjectTrustSection = isProject && Array.isArray(unitLayouts) && unitLayouts.length > 0;

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">{isEditMode ? "编辑房源" : "上传房源"}</h1>

      <AddressSearchInput value={addressObj} onChange={setAddressObj} />

      <TypeSelector
        value={typeValue}
        onChange={setTypeValue}
        saleType={saleType}
        setSaleType={setSaleType}
        propertyStatus={computedStatus}
        setPropertyStatus={setComputedStatus}
        typeForm={typeForm}
        setTypeForm={setTypeForm}
        onFormChange={onTypeFormChange}
        roomRentalMode={roomRentalMode}
        setRoomRentalMode={setRoomRentalMode}
        rentBatchMode={rentBatchMode}
        onChangeRentBatchMode={setRentBatchMode}
        initialForm={typeSelectorInitialForm}
      />

      {isProject && (
        <ProjectUploadForm
          projectCategory={projectCategory}
          setProjectCategory={setProjectCategory}
          projectSubType={projectSubType}
          setProjectSubType={setProjectSubType}
          unitLayouts={unitLayouts}
          setUnitLayouts={setUnitLayouts}
          singleFormData={singleFormData}
          setSingleFormData={setSingleFormData}
          areaData={areaData}
          setAreaData={setAreaData}
        />
      )}

      {isSale && !isProject && (
        <SaleUploadForm singleFormData={singleFormData} setSingleFormData={setSingleFormData} areaData={areaData} setAreaData={setAreaData} />
      )}

      {isRent && rentCategorySelected && (
        <RentUploadForm
          singleFormData={singleFormData}
          setSingleFormData={setSingleFormData}
          areaData={areaData}
          setAreaData={setAreaData}
          roomRentalMode={roomRentalMode}
          rentBatchMode={rentBatchMode}
          unitLayouts={unitLayouts}
          setUnitLayouts={setUnitLayouts}
        />
      )}

      {isHomestay && (
        <HomestayUploadForm singleFormData={singleFormData} setSingleFormData={setSingleFormData} areaData={areaData} setAreaData={setAreaData} />
      )}

      {isHotel && (
        <HotelUploadForm singleFormData={singleFormData} setSingleFormData={setSingleFormData} areaData={areaData} setAreaData={setAreaData} />
      )}

      {!isProject && <ListingTrustSection singleFormData={singleFormData} setSingleFormData={setSingleFormData} />}
      {shouldShowProjectTrustSection && <ListingTrustSection singleFormData={singleFormData} setSingleFormData={setSingleFormData} />}

      <div className="space-y-2">
        <div className="text-sm text-gray-600">描述（可选）</div>
        <textarea
          className="w-full border rounded-lg p-3 min-h-[120px]"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="补充说明（可选）"
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSubmit} disabled={submitting}>
          {isEditMode ? "保存修改" : "提交房源"}
        </Button>

        {isEditMode && (
          <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
            删除房源
          </Button>
        )}
      </div>

      {isEditMode && !editHydrated && <div className="text-sm text-gray-500">加载中…</div>}
    </div>
  );
      }
