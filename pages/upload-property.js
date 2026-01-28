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

const PROTECTED_KEYS = new Set([
  "typeForm",
  "type_form",
  "singleFormData",
  "single_form_data",
  "areaData",
  "area_data",
  "unitLayouts",
  "unit_layouts",
  "type_form_v2",
  "single_form_data_v2",
]);

const KEY_PAIRS = [
  ["typeForm", "type_form"],
  ["singleFormData", "single_form_data"],
  ["areaData", "area_data"],
  ["unitLayouts", "unit_layouts"],
];

function getCounterpartKey(k) {
  for (const [camel, snake] of KEY_PAIRS) {
    if (k === camel) return snake;
    if (k === snake) return camel;
  }
  return "";
}

function dropProtectedIfCounterpartExists(working, missing) {
  const other = getCounterpartKey(missing);
  if (!other) return false;
  if (!Object.prototype.hasOwnProperty.call(working, other)) return false;

  if (hasAnyValue(working[other])) {
    delete working[missing];
    return true;
  }
  return false;
}

async function runWithAutoStripColumns({ mode, payload, editId, userId, maxTries = 10 }) {
  let working = { ...(payload || {}) };
  let tries = 0;
  const removed = [];

  while (tries < maxTries) {
    tries += 1;

    let res;
    if (mode === "update") {
      res = await supabase.from("properties").update(working).eq("id", editId).eq("user_id", userId);
    } else {
      res = await supabase.from("properties").insert([working]);
    }

    if (!res?.error) return { ok: true, removed, result: res };

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
  // 避免写入一堆空
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
// 否则 single_form_data_v2 里的 "" / [] / {} 会挡住真正数据
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
    // 主 key
    fill("homestayType", h1.homestayType ?? "");
    fill("category", h1.category ?? "");
    fill("finalType", h1.finalType ?? "");
    fill("storeys", h1.storeys ?? "");
    fill("subtype", Array.isArray(h1.subtype) ? h1.subtype : []);

    // 兼容旧 key
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

    // 兼容旧 key
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

  const edit = router?.query?.edit;
  const editId = router?.query?.id;
  const isEditMode = String(edit || "") === "1" && !!editId;

  // ✅✅✅ 编辑页面：等 Supabase 数据回填完成后才渲染表单，避免子组件用默认值覆盖已保存数据
  const [editHydrated, setEditHydrated] = useState(false);

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

  const saleTypeNorm = String(saleType || "").toLowerCase();
  const isHomestay = saleTypeNorm.includes("homestay");
  const isHotel = saleTypeNorm.includes("hotel");

  const isProject =
    saleTypeNorm === "sale" &&
    ["New Project / Under Construction", "Completed Unit / Developer Unit"].includes(computedStatus);

  const rentCategorySelected = !!(typeForm && (typeForm.category || typeForm.propertyCategory));
  const allowRentBatchMode = saleTypeNorm === "rent" && rentCategorySelected;

  const isRentBatch = saleTypeNorm === "rent" && rentBatchMode === "yes" && roomRentalMode !== "room";

  const rawLayoutCount = Number(typeForm?.layoutCount);
  const batchLayoutCount = Math.max(2, Math.min(20, Number.isFinite(rawLayoutCount) ? rawLayoutCount : 2));

  const rawRoomCount = Number(typeForm?.roomCount);
  const roomLayoutCount =
    roomRentalMode === "room"
      ? typeForm?.roomCountMode === "multi"
        ? Math.max(2, Math.min(20, Number.isFinite(rawRoomCount) ? rawRoomCount : 2))
        : 1
      : 1;

  const lastFormJsonRef = useRef("");
  const lastDerivedRef = useRef({ saleType: "", status: "", roomMode: "" });

  // ✅ 关键：把 onFormChange 固定，避免“函数引用变化 → TypeSelector effect 反复触发 → 闪烁”
  const handleTypeFormChange = useCallback((form) => {
    const nextJson = stableJson(form);
    if (nextJson && nextJson === lastFormJsonRef.current) return;
    lastFormJsonRef.current = nextJson;

    setTypeForm((prev) => {
      const prevJson = stableJson(prev);
      if (prevJson === nextJson) return prev;
      return form || null;
    });

    const nextSale = form?.saleType || "";
    const nextStatus = form?.propertyStatus || "";
    const nextRoom = form?.roomRentalMode || "whole";

    const last = lastDerivedRef.current;
    if (last.saleType !== nextSale) setSaleType(nextSale);
    if (last.status !== nextStatus) setComputedStatus(nextStatus);
    if (last.roomMode !== nextRoom) setRoomRentalMode(nextRoom);

    lastDerivedRef.current = { saleType: nextSale, status: nextStatus, roomMode: nextRoom };
  }, []);

  useEffect(() => {
    if (!isEditMode) {
      setEditHydrated(true);
    } else {
      setEditHydrated(false);
    }
  }, [isEditMode, editId]);

  useEffect(() => {
    if (!isRentBatch) return;
    const n = batchLayoutCount;
    setUnitLayouts((prev) => {
      const prevArr = Array.isArray(prev) ? prev : [];
      return Array.from({ length: n }).map((_, i) => prevArr[i] || {});
    });
  }, [isRentBatch, batchLayoutCount]);

  useEffect(() => {
    if (saleTypeNorm !== "rent") return;
    if (roomRentalMode !== "room") return;
    if (isRentBatch) return;

    if (roomLayoutCount <= 1) {
      setUnitLayouts?.([]);
      return;
    }

    setUnitLayouts?.((prev) => {
      const prevArr = Array.isArray(prev) ? prev : [];
      return Array.from({ length: roomLayoutCount }).map((_, i) => prevArr[i] || {});
    });
  }, [saleTypeNorm, roomRentalMode, isRentBatch, roomLayoutCount]);

  // ✅ 编辑模式：读取房源并回填（优先用 v2）
  useEffect(() => {
    if (!isEditMode) return;
    if (!user) return;
    if (!editId) return;

    const fetchForEdit = async () => {
      try {
        const { data, error } = await supabase
          .from("properties")
          .select("*")
          .eq("id", editId)
          .eq("user_id", user.id)
          .single();

        if (error) throw error;
        if (!data) {
          toast.error("找不到该房源");
          alert("找不到该房源");
          setEditHydrated(true);
          return;
        }

        const tfRaw = pickPreferNonEmpty(
          data.type_form_v2,
          pickPreferNonEmpty(data.typeForm, data.type_form, null),
          null
        );
        const sfdRaw = pickPreferNonEmpty(
          data.single_form_data_v2,
          pickPreferNonEmpty(data.singleFormData, data.single_form_data, {}),
          {}
        );

        const adRaw = pickPreferNonEmpty(data.areaData, data.area_data, areaData);
        const ulsRaw = pickPreferNonEmpty(data.unitLayouts, data.unit_layouts, []);

        const tf = safeParseMaybeJson(tfRaw);
        const sfd = safeParseMaybeJson(sfdRaw);
        const ad = safeParseMaybeJson(adRaw);
        const uls = safeParseMaybeJson(ulsRaw);

        // ✅✅✅ 新增：把你新 column 的数据合并回 singleFormData（这样表单一定能回填）
        const homestayForm = safeParseMaybeJson(data.homestay_form);
        const hotelForm = safeParseMaybeJson(data.hotel_resort_form);
        const availability = safeParseMaybeJson(data.availability);
        const calendarPrices = safeParseMaybeJson(data.calendar_prices);

        let mergedSfd = mergeFormsIntoSingle(sfd || {}, homestayForm, hotelForm);
        // 日历也合并到 singleFormData（如果你表单内部是从 singleFormData 读）
        if (availability && typeof availability === "object") mergedSfd.availability = mergedSfd.availability ?? availability;
        if (calendarPrices && typeof calendarPrices === "object") mergedSfd.calendar_prices = mergedSfd.calendar_prices ?? calendarPrices;

        // ✅✅✅【修复闪烁核心】只在编辑回填时给 TypeSelector initialForm 一次
        setTypeSelectorInitialForm(tf);

        setTypeForm(tf);

        if (data.lat && data.lng) {
          setAddressObj({
            address: data.address || data.location || "",
            lat: data.lat,
            lng: data.lng,
          });
        }

        if (typeof data.type === "string") setTypeValue(data.type);

        setSaleType((tf && tf.saleType) || data.saleType || data.sale_type || "");
        setComputedStatus((tf && tf.propertyStatus) || data.propertyStatus || data.property_status || "");
        setRoomRentalMode((tf && tf.roomRentalMode) || data.roomRentalMode || data.room_rental_mode || "whole");
        if (typeof data.rentBatchMode === "string") setRentBatchMode(data.rentBatchMode);

        setProjectCategory(data.projectCategory || "");
        setProjectSubType(data.projectSubType || "");
        setUnitLayouts(Array.isArray(uls) ? uls : []);
        setSingleFormData(mergedSfd || {});
        setAreaData(ad || areaData);
        setDescription(typeof data.description === "string" ? data.description : "");

        // ✅ 同步 lastDerived，避免第一次 TypeSelector onFormChange 又触发一轮不必要的 setState
        lastDerivedRef.current = {
          saleType: (tf && tf.saleType) || "",
          status: (tf && tf.propertyStatus) || "",
          roomMode: (tf && tf.roomRentalMode) || "whole",
        };
        lastFormJsonRef.current = stableJson(tf);

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
      // ✅✅✅ 新增：把 singleFormData 拆出两份，写入你新建的 column
      const homestay_form = buildHomestayFormFromSingle(singleFormData);
      const hotel_resort_form = buildHotelFormFromSingle(singleFormData);

      const payload = {
        user_id: user.id,
        address: addressObj?.address || "",
        lat: addressObj?.lat,
        lng: addressObj?.lng,

        saleType,
        propertyStatus: computedStatus,

        type: typeValue,

        type_form_v2: typeForm || null,
        single_form_data_v2: singleFormData || {},

        typeForm: typeForm || null,
        type_form: typeForm || null,

        roomRentalMode,
        rentBatchMode,

        unitLayouts,
        unit_layouts: unitLayouts,

        singleFormData,
        single_form_data: singleFormData,

        areaData,
        area_data: areaData,

        description,
        updated_at: new Date().toISOString(),

        // ✅✅✅ 关键：把 Homestay/Hotel 表单选择写进 Supabase 独立 column（你看表就会有值）
        homestay_form: homestay_form,
        hotel_resort_form: hotel_resort_form,

        // ✅✅✅ 日历字段（如果你已经在 Supabase 加了 column）
        availability: singleFormData?.availability ?? singleFormData?.availability_data ?? null,
        calendar_prices: singleFormData?.calendar_prices ?? singleFormData?.calendarPrices ?? null,
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
        // ✅✅✅ 不再用 typeForm 当 initialForm（否则每次都重置导致闪烁）
        initialForm={typeSelectorInitialForm}
        rentBatchMode={allowRentBatchMode ? rentBatchMode : "no"}
        onChangeRentBatchMode={(val) => {
          if (!allowRentBatchMode) return;
          setRentBatchMode(val);
        }}
        onFormChange={handleTypeFormChange}
      />

      {(!isEditMode || editHydrated) &&
        (isHomestay ? (
          <HomestayUploadForm
            formData={singleFormData}
            setFormData={setSingleFormData}
            isEditing={isEditMode}
            onFormChange={(patch) => setSingleFormData((prev) => ({ ...(prev || {}), ...(patch || {}) }))}
          />
        ) : isHotel ? (
          <HotelUploadForm
            formData={singleFormData}
            setFormData={setSingleFormData}
            isEditing={isEditMode}
            onFormChange={(patch) => setSingleFormData((prev) => ({ ...(prev || {}), ...(patch || {}) }))}
          />
        ) : isProject ? (
          <>
            <ProjectUploadForm
              saleType={saleType}
              computedStatus={computedStatus}
              isBulkRentProject={false}
              projectCategory={projectCategory}
              setProjectCategory={setProjectCategory}
              projectSubType={projectSubType}
              setProjectSubType={setProjectSubType}
              unitLayouts={unitLayouts}
              setUnitLayouts={setUnitLayouts}
              enableProjectAutoCopy={computedStatus === "New Project / Under Construction"}
              pickCommon={pickCommon}
              commonHash={commonHash}
            />

            {shouldShowProjectTrustSection && (
              <ListingTrustSection
                mode={computedStatus === "New Project / Under Construction" ? "new_project" : "completed_unit"}
                value={singleFormData?.trustSection || {}}
                onChange={(next) => setSingleFormData((prev) => ({ ...(prev || {}), trustSection: next }))}
              />
            )}
          </>
        ) : saleTypeNorm === "rent" ? (
          <RentUploadForm
            saleType={saleType}
            computedStatus={computedStatus}
            roomRentalMode={roomRentalMode}
            isRoomRental={roomRentalMode === "room"}
            singleFormData={singleFormData}
            setSingleFormData={setSingleFormData}
            areaData={areaData}
            setAreaData={setAreaData}
            description={description}
            setDescription={setDescription}
            rentBatchMode={rentBatchMode}
            layoutCount={isRentBatch ? batchLayoutCount : roomLayoutCount}
            unitLayouts={unitLayouts}
            setUnitLayouts={setUnitLayouts}
            propertyCategory={typeForm?.category || typeForm?.propertyCategory || ""}
          />
        ) : (
          <SaleUploadForm
            saleType={saleType}
            computedStatus={computedStatus}
            singleFormData={singleFormData}
            setSingleFormData={setSingleFormData}
            areaData={areaData}
            setAreaData={setAreaData}
            description={description}
            setDescription={setDescription}
            propertyCategory={typeForm?.category || typeForm?.propertyCategory || ""}
          />
        ))}

      <Button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="bg-blue-600 text-white p-3 rounded hover:bg-blue-700 w-full disabled:opacity-60"
      >
        {submitting ? "提交中..." : isEditMode ? "保存修改" : "提交房源"}
      </Button>

      {isEditMode && (
        <Button
          type="button"
          onClick={handleDelete}
          disabled={submitting}
          className="bg-red-600 text-white p-3 rounded hover:bg-red-700 w-full disabled:opacity-60"
        >
          删除房源
        </Button>
      )}
    </div>
  );
}
