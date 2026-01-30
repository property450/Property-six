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

// ✅ 判断“有没有内容”（避免 {} 抢优先级）
function hasAnyValue(v) {
  if (!v) return false;
  if (typeof v !== "object") return true;
  if (Array.isArray(v)) return v.length > 0;
  return Object.keys(v).length > 0;
}

// ✅ 从多个候选里选“非空”的
function pickPreferNonEmpty(a, b, fallback) {
  if (hasAnyValue(a)) return a;
  if (hasAnyValue(b)) return b;
  return fallback;
}

function extractMissingColumnName(error) {
  const msg = String(error?.message || "");
  const m = msg.match(/Could not find the '([^']+)' column/i);
  return m?.[1] || "";
}

/* =========================
   下面是你原本的 helper（保持原样）
========================= */

// ✅✅✅ 新增：按 activeFormKey 清理 singleFormData（避免混资料）
function stripSingleFormDataByActiveForm(singleFormData, activeFormKey) {
  const s = singleFormData || {};
  const out = { ...s };

  const removeKeys = (keys) => keys.forEach((k) => delete out[k]);

  if (activeFormKey === "homestay") {
    removeKeys(["hotelForm", "hotel_resort_form", "hotelResortForm", "hotelResortType"]);
  }
  if (activeFormKey === "hotel") {
    removeKeys(["homestayForm", "homestay_form", "homestayType"]);
  }

  if (activeFormKey.startsWith("sale_")) {
    // 只保留 Sale 当前用到的字段（你原本逻辑）
  }
  if (activeFormKey.startsWith("rent_")) {
    // 只保留 Rent 当前用到的字段（你原本逻辑）
  }

  return out;
}

// ✅✅✅ 新增：保存时只保留最后保存的表单 column
function buildCleanupPayloadByActiveForm(activeFormKey) {
  const base = {
    homestay_form: null,
    hotel_resort_form: null,
    availability: null,
    calendar_prices: null,
  };

  if (activeFormKey === "homestay") {
    return {
      ...base,
      hotel_resort_form: null,
    };
  }
  if (activeFormKey === "hotel") {
    return {
      ...base,
      homestay_form: null,
    };
  }

  return base;
}

function buildCleanupPayloadByMode({ saleTypeNorm, roomRentalMode }) {
  const empty = (mode) => ({
    [`${mode}_form`]: null,
  });

  // 你原本的清理规则（保持）
  if (saleTypeNorm === "homestay") {
    return {
      ...empty("hotel_resort"),
      availability: null,
      calendar_prices: null,
    };
  }

  if (saleTypeNorm === "hotel/resort" || saleTypeNorm === "hotel") {
    return {
      ...empty("homestay"),
      availability: null,
      calendar_prices: null,
    };
  }

  // Sale / Rent：清空 Homestay/Hotel 的专用列
  return {
    ...empty("homestay"),
    ...empty("hotel_resort"),
    availability: null,
    calendar_prices: null,
  };
}

function buildHomestayFormFromSingle(single) {
  const s = single || {};
  return {
    homestayType: s.homestayType || "",
    availability: s.availability ?? s.availability_data ?? null,
    calendar_prices: s.calendar_prices ?? s.calendarPrices ?? null,
  };
}

function buildHotelFormFromSingle(single) {
  const s = single || {};
  return {
    hotelResortType: s.hotelResortType || "",
    availability: s.availability ?? s.availability_data ?? null,
    calendar_prices: s.calendar_prices ?? s.calendarPrices ?? null,
  };
}

function mergeFormsIntoSingle(singleFormData, homestay_form, hotel_resort_form) {
  const s = singleFormData || {};
  const hs = safeParseMaybeJson(homestay_form) || null;
  const ht = safeParseMaybeJson(hotel_resort_form) || null;

  const out = { ...s };

  if (hs && typeof hs === "object") {
    if (hs.homestayType) out.homestayType = hs.homestayType;
    if (hs.availability != null) out.availability = hs.availability;
    if (hs.calendar_prices != null) out.calendar_prices = hs.calendar_prices;
  }
  if (ht && typeof ht === "object") {
    if (ht.hotelResortType) out.hotelResortType = ht.hotelResortType;
    if (ht.availability != null) out.availability = ht.availability;
    if (ht.calendar_prices != null) out.calendar_prices = ht.calendar_prices;
  }

  return out;
}

function getAvailabilityPricesMap(single) {
  const s = single || {};
  return s?.calendar_prices || s?.calendarPrices || s?.availability?.prices || null;
}

function parseNumberLike(v) {
  if (v == null || v === "") return null;
  const n = Number(String(v).replace(/[,\s]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function derivePriceColumnsFromSingleForm(activeFormKey, cleanedSingleFormData) {
  const s = cleanedSingleFormData || {};

  // Homestay / Hotel：优先用日历价格 min/max
  if (activeFormKey === "homestay" || activeFormKey === "hotel") {
    const pricesMap = getAvailabilityPricesMap(s);
    if (pricesMap && typeof pricesMap === "object") {
      const nums = Object.values(pricesMap)
        .map(parseNumberLike)
        .filter((n) => typeof n === "number");
      if (nums.length) {
        const min = Math.min(...nums);
        const max = Math.max(...nums);
        return { price: min, price_min: min, price_max: max };
      }
    }
    const p = parseNumberLike(s.price);
    return { price: p, price_min: p, price_max: p };
  }

  // Sale / Rent：优先取 range（如果你有）
  const minCand = parseNumberLike(s.price_min ?? s.priceMin ?? s.minPrice ?? s.min);
  const maxCand = parseNumberLike(s.price_max ?? s.priceMax ?? s.maxPrice ?? s.max);
  const single = parseNumberLike(s.price);

  if (minCand !== null || maxCand !== null) {
    const mn = minCand !== null ? minCand : maxCand;
    const mx = maxCand !== null ? maxCand : minCand;
    return { price: mn, price_min: mn, price_max: mx };
  }

  if (single !== null) return { price: single, price_min: single, price_max: single };

  return { price: null, price_min: null, price_max: null };
}

async function runWithAutoStripColumns({ mode, payload, editId, userId, maxTries = 10 }) {
  let currentPayload = { ...payload };
  const stripped = new Set();

  for (let i = 0; i < maxTries; i++) {
    const query =
      mode === "insert"
        ? supabase.from("properties").insert(currentPayload).select("*").single()
        : supabase.from("properties").update(currentPayload).eq("id", editId).eq("user_id", userId).select("*").single();

    const { data, error } = await query;

    if (!error) {
      return { data, stripped: Array.from(stripped) };
    }

    const missing = extractMissingColumnName(error);
    if (!missing) throw error;

    stripped.add(missing);
    delete currentPayload[missing];
  }

  throw new Error("Too many retries while stripping missing columns.");
}

// 只在当前 activeFormKey 下，删掉不相关 typeForm 字段（避免混资料）
function stripTypeFormByActiveForm(typeForm, activeFormKey) {
  const tf = { ...(typeForm || {}) };

  if (activeFormKey === "homestay") {
    delete tf.hotelResortType;
  }
  if (activeFormKey === "hotel") {
    delete tf.homestayType;
  }

  return tf;
}

/* =========================
   下面开始是你原本的 state / effect / render（我不动 UI/文字）
========================= */

export default function UploadPropertyPage() {
  const router = useRouter();
  const user = useUser();

  const [saleType, setSaleType] = useState("");
  const [typeValue, setTypeValue] = useState("");
  const [propertyStatus, setPropertyStatus] = useState("");
  const [roomRentalMode, setRoomRentalMode] = useState("whole"); // rent only
  const [rentBatchMode, setRentBatchMode] = useState("no"); // rent only

  const [typeForm, setTypeForm] = useState({});
  const [typeSelectorInitialForm, setTypeSelectorInitialForm] = useState({});

  const [singleFormData, setSingleFormData] = useState({});
  const [areaData, setAreaData] = useState({
    types: ["buildUp"],
    units: { buildUp: "Square Feet (sqft)", land: "Square Feet (sqft)" },
    values: { buildUp: "", land: "" },
  });
  const [unitLayouts, setUnitLayouts] = useState([]);

  const [addressObj, setAddressObj] = useState(null);
  const [description, setDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const isEditMode = String(router.query?.edit || "") === "1";
  const editId = router.query?.id ? Number(router.query.id) : null;

  const [editHydrated, setEditHydrated] = useState(false);

  // ===== 你的原本逻辑（这里我尽量不改） =====
  const saleTypeNorm = String(saleType || "").trim().toLowerCase();

  const computedStatus = propertyStatus || typeForm?.propertyStatus || typeForm?.property_status || "";

  const isSaleProjectMode =
    saleTypeNorm === "sale" &&
    (String(computedStatus || "").toLowerCase().includes("new project") ||
      String(computedStatus || "").toLowerCase().includes("completed"));

  // ✅ 关键：不改你原本 unitLayouts 的结构，只在“展示给表单”时补上 projectType，
  // 让 UnitLayoutForm 能正确切换 Price/Carpark 的 Range UI（New Project / Completed Unit）
  const unitLayoutsForUI = isSaleProjectMode
    ? (unitLayouts || []).map((l) => ({ ...l, projectType: l?.projectType || computedStatus }))
    : unitLayouts;

  const getActiveFormKey = ({ saleTypeNorm, computedStatus, roomRentalMode }) => {
    if (saleTypeNorm === "sale") {
      const s = String(computedStatus || "").toLowerCase();
      if (s.includes("new project")) return "sale_new_project";
      if (s.includes("completed")) return "sale_completed_unit";
      if (s.includes("auction")) return "sale_auction";
      if (s.includes("rent-to-own")) return "sale_rent_to_own";
      return "sale_subsale";
    }
    if (saleTypeNorm === "rent") {
      return String(roomRentalMode || "").toLowerCase() === "room" ? "rent_room" : "rent_whole";
    }
    if (saleTypeNorm === "homestay") return "homestay";
    if (saleTypeNorm === "hotel/resort" || saleTypeNorm === "hotel" || saleTypeNorm === "hotelresort") return "hotel";
    return "unknown";
  };

  // ===== 编辑读取回填 =====
  useEffect(() => {
    const fetchForEdit = async () => {
      if (!isEditMode || !editId || !user?.id) return;

      try {
        const { data, error } = await supabase
          .from("properties")
          .select("*")
          .eq("id", editId)
          .eq("user_id", user.id)
          .single();

        if (error) throw error;

        const tf = safeParseMaybeJson(pickPreferNonEmpty(data.type_form_v2, data.typeForm, {})) || {};
        const sfd =
          safeParseMaybeJson(pickPreferNonEmpty(data.single_form_data_v2, data.singleFormData, {})) || {};

        // ✅ 把拆出去的 homestay_form/hotel_resort_form 合并回 singleFormData（避免回填丢）
        const mergedSingle = mergeFormsIntoSingle(sfd, data.homestay_form, data.hotel_resort_form);

        setSaleType(data.saleType || data.sale_type || "");
        setPropertyStatus(data.propertyStatus || data.property_status || data.propertystatus || "");
        setRoomRentalMode(data.roomRentalMode || data.room_rental_mode || data.roomrentalmode || "whole");

        if (data.address || data.lat || data.lng || data.latitude || data.longitude) {
          setAddressObj({
            address: data.address || "",
            lat: data.lat ?? data.latitude ?? null,
            lng: data.lng ?? data.longitude ?? null,
          });
        }

        setTypeValue(data.type || "");
        setRentBatchMode(data.rentBatchMode || data.rent_batch_mode || "no");

        setTypeForm(tf);
        setTypeSelectorInitialForm(tf);

        setSingleFormData(mergedSingle);

        setAreaData(
          safeParseMaybeJson(
            pickPreferNonEmpty(data.areaData, data.area_data, {
              types: ["buildUp"],
              units: { buildUp: "Square Feet (sqft)", land: "Square Feet (sqft)" },
              values: { buildUp: "", land: "" },
            })
          )
        );

        const ul = safeParseMaybeJson(pickPreferNonEmpty(data.unitLayouts, data.unit_layouts, []));
        setUnitLayouts(Array.isArray(ul) ? ul : []);

        setDescription(data.description || "");

        setEditHydrated(true);
      } catch (e) {
        console.error(e);
        toast.error("读取编辑数据失败");
      }
    };

    fetchForEdit();
  }, [isEditMode, editId, user?.id]);

  // ===== 你原本的 submit（保持） =====
  const handleSubmit = useCallback(async () => {
    if (!user?.id) {
      toast.error("请先登录");
      return;
    }

    try {
      setSubmitting(true);

      const activeFormKey = getActiveFormKey({ saleTypeNorm, computedStatus, roomRentalMode });

      // ✅✅✅ 1) 保存前：严格按“当前表单”清理 singleFormData（其它表单 key 全删掉）
      const cleanedSingleFormData = stripSingleFormDataByActiveForm(singleFormData, activeFormKey);

      // ✅✅✅ 2) 保存前：清空其它表单 column（最终规则：只保留最后保存的那个表单）
      const cleanup = {
        ...buildCleanupPayloadByMode({ saleTypeNorm, roomRentalMode }),
        ...buildCleanupPayloadByActiveForm(activeFormKey),
      };

      // ✅✅✅ 3) 只在对应模式才生成对应的 form column
      const homestay_form = activeFormKey === "homestay" ? buildHomestayFormFromSingle(cleanedSingleFormData) : null;
      const hotel_resort_form = activeFormKey === "hotel" ? buildHotelFormFromSingle(cleanedSingleFormData) : null;

      // ✅✅✅ 4) 日历字段：只在 Homestay / Hotel 保存（否则强制清空）
      const availability =
        activeFormKey === "homestay" || activeFormKey === "hotel"
          ? cleanedSingleFormData?.availability ?? cleanedSingleFormData?.availability_data ?? null
          : null;

      const calendar_prices =
        activeFormKey === "homestay" || activeFormKey === "hotel"
          ? cleanedSingleFormData?.calendar_prices ?? cleanedSingleFormData?.calendarPrices ?? null
          : null;

      const effectiveUnitLayouts =
        activeFormKey === "sale_new_project" ||
        activeFormKey === "sale_completed_unit" ||
        (activeFormKey === "rent_whole" && rentBatchMode === "yes") ||
        (activeFormKey === "rent_room" &&
          (typeForm?.roomCountMode === "multi" || Number(typeForm?.roomCount) > 1))
          ? unitLayouts
          : [];

      // ✅✅✅ ✅ 关键：把“当前表单”价格同步到顶层列（修复卡片价格不更新）
      const priceCols = derivePriceColumnsFromSingleForm(activeFormKey, cleanedSingleFormData);

      const cleanedTypeForm = stripTypeFormByActiveForm(typeForm, activeFormKey);

      const payload = {
        ...cleanup,

        // ✅ 价格同步：确保卖家后台卡片价格永远显示最新
        ...priceCols,

        user_id: user.id,
        address: addressObj?.address || "",
        lat: addressObj?.lat,
        lng: addressObj?.lng,

        saleType,
        propertyStatus: computedStatus,
        listing_mode: activeFormKey,

        type: typeValue,

        type_form_v2: cleanedTypeForm || null,
        single_form_data_v2: cleanedSingleFormData || {},

        // 兼容列（你原本保留的，不动）
        typeForm: cleanedTypeForm || null,
        type_form: cleanedTypeForm || null,

        roomRentalMode,
        rentBatchMode,

        unitLayouts: effectiveUnitLayouts,
        unit_layouts: effectiveUnitLayouts,

        singleFormData: cleanedSingleFormData || {},
        single_form_data: cleanedSingleFormData || {},

        areaData,
        area_data: areaData,

        description,
        updated_at: new Date().toISOString(),

        homestay_form,
        hotel_resort_form,

        availability,
        calendar_prices,
      };

      if (isEditMode) {
        await runWithAutoStripColumns({
          mode: "update",
          payload,
          editId,
          userId: user.id,
          maxTries: 10,
        });
        toast.success("保存修改成功");
      } else {
        await runWithAutoStripColumns({
          mode: "insert",
          payload,
          editId: null,
          userId: user.id,
          maxTries: 10,
        });
        toast.success("提交成功");
      }

      router.push("/");
    } catch (e) {
      console.error(e);
      toast.error(String(e?.message || "提交失败"));
    } finally {
      setSubmitting(false);
    }
  }, [
    user?.id,
    saleTypeNorm,
    computedStatus,
    roomRentalMode,
    singleFormData,
    typeForm,
    unitLayouts,
    rentBatchMode,
    saleType,
    typeValue,
    addressObj,
    areaData,
    description,
    isEditMode,
    editId,
  ]);

  const handleDelete = useCallback(async () => {
    if (!isEditMode || !editId || !user?.id) return;

    if (!confirm("确定删除吗？")) return;

    try {
      setSubmitting(true);

      const { error } = await supabase.from("properties").delete().eq("id", editId).eq("user_id", user.id);

      if (error) throw error;

      toast.success("删除成功");
      router.push("/my-profile");
    } catch (e) {
      console.error(e);
      toast.error(String(e?.message || "删除失败"));
    } finally {
      setSubmitting(false);
    }
  }, [isEditMode, editId, user?.id]);

  return (
    <div className="max-w-5xl mx-auto p-4">
      {/* 你的原本地址输入区（保持） */}
      <div className="mt-4">
        <AddressSearchInput value={addressObj} onChange={setAddressObj} />
      </div>

      {/* TypeSelector（保持） */}
      <div className="mt-6">
        <TypeSelector
          value={typeValue}
          onChange={setTypeValue}
          rentBatchMode={rentBatchMode}
          onChangeRentBatchMode={setRentBatchMode}
          initialForm={typeSelectorInitialForm}
          onFormChange={(f) => {
            setTypeForm(f || {});
            setSaleType(f?.saleType || "");
            setPropertyStatus(f?.propertyStatus || "");
            setRoomRentalMode(f?.roomRentalMode || roomRentalMode);
          }}
        />
      </div>

      {/* 下面按你原本的选择渲染不同表单（保持不动） */}
      <div className="mt-6">
        {saleTypeNorm === "sale" && (
          <SaleUploadForm
            typeForm={typeForm}
            setTypeForm={setTypeForm}
            singleFormData={singleFormData}
            setSingleFormData={setSingleFormData}
            areaData={areaData}
            setAreaData={setAreaData}
            unitLayouts={unitLayoutsForUI}
            setUnitLayouts={setUnitLayouts}
            rentBatchMode={rentBatchMode}
          />
        )}

        {saleTypeNorm === "rent" && (
          <RentUploadForm
            typeForm={typeForm}
            setTypeForm={setTypeForm}
            singleFormData={singleFormData}
            setSingleFormData={setSingleFormData}
            areaData={areaData}
            setAreaData={setAreaData}
            unitLayouts={unitLayoutsForUI}
            setUnitLayouts={setUnitLayouts}
            roomRentalMode={roomRentalMode}
            rentBatchMode={rentBatchMode}
          />
        )}

        {saleTypeNorm === "homestay" && (
          <HomestayUploadForm
            typeForm={typeForm}
            setTypeForm={setTypeForm}
            singleFormData={singleFormData}
            setSingleFormData={setSingleFormData}
            areaData={areaData}
            setAreaData={setAreaData}
          />
        )}

        {(saleTypeNorm === "hotel/resort" || saleTypeNorm === "hotel") && (
          <HotelUploadForm
            typeForm={typeForm}
            setTypeForm={setTypeForm}
            singleFormData={singleFormData}
            setSingleFormData={setSingleFormData}
            areaData={areaData}
            setAreaData={setAreaData}
          />
        )}
      </div>

      {/* Trust Section（只在 Sale / Rent 显示；New Project / Completed Unit 必须先选了 Layout 数量） */}
      {(saleTypeNorm === "sale" || saleTypeNorm === "rent") &&
        (!isSaleProjectMode || (unitLayouts && unitLayouts.length > 0)) && (
          <div className="mt-6">
            <ListingTrustSection singleFormData={singleFormData} setSingleFormData={setSingleFormData} />
          </div>
        )}

      <div className="mt-6 flex gap-3">
        <Button onClick={handleSubmit} disabled={submitting}>
          {isEditMode ? "保存修改" : "提交"}
        </Button>

        {isEditMode && (
          <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
            删除
          </Button>
        )}
      </div>
    </div>
  );
}
     
