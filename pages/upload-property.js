// pages/upload-property.js
"use client";

import { useState, useEffect, useRef } from "react";
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

function stableJson(obj) {
  try {
    return JSON.stringify(obj ?? null);
  } catch {
    return "";
  }
}

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

// ✅ 判断“有没有内容”（避免 {} 抢优先级导致读不到真正数据）
function hasAnyValue(v) {
  if (!v) return false;
  if (typeof v !== "object") return true;
  if (Array.isArray(v)) return v.length > 0;
  return Object.keys(v).length > 0;
}

// ✅ 从 camel/snake 里选“有内容的那一个”
function pickPreferNonEmpty(camel, snake, fallback) {
  if (hasAnyValue(camel)) return camel;
  if (hasAnyValue(snake)) return snake;
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

// ✅ 当缺的是 protected key：如果对偶 key 存在（且有数据），就删掉缺失的那一份副本继续（不影响核心数据）
function dropProtectedIfCounterpartExists(working, missing) {
  const other = getCounterpartKey(missing);
  if (!other) return false;
  if (!Object.prototype.hasOwnProperty.call(working, other)) return false;

  // 对偶有内容，就允许删掉缺失那份
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
      res = await supabase
        .from("properties")
        .update(working)
        .eq("id", editId)
        .eq("user_id", userId);
    } else {
      res = await supabase.from("properties").insert([working]);
    }

    if (!res?.error) {
      return { ok: true, removed, result: res };
    }

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

// ✅ 把对象变成“跟 DB 现状一致”的格式：
// - 如果 DB 之前是字符串 JSON，就继续 stringify
// - 如果 DB 之前是对象(json/jsonb)，就保持对象
function encodeByDbMode(value, shouldStringify) {
  if (!shouldStringify) return value ?? null;
  try {
    return JSON.stringify(value ?? null);
  } catch {
    return JSON.stringify(null);
  }
}

// ✅ 保存后读回验证：如果读回还是空/没变，就不跳转，直接告诉你数据库没存
function normalizeForCompare(v) {
  const parsed = safeParseMaybeJson(v);
  try {
    return JSON.stringify(parsed ?? null);
  } catch {
    return String(parsed);
  }
}

export default function UploadPropertyPage() {
  const router = useRouter();
  const user = useUser();

  const edit = router?.query?.edit;
  const editId = router?.query?.id;
  const isEditMode = String(edit || "") === "1" && !!editId;

  const [submitting, setSubmitting] = useState(false);

  const [addressObj, setAddressObj] = useState(null);

  const [typeValue, setTypeValue] = useState("");
  const [rentBatchMode, setRentBatchMode] = useState("no");
  const [typeForm, setTypeForm] = useState(null);

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
    ["New Project / Under Construction", "Completed Unit / Developer Unit"].includes(
      computedStatus
    );

  const rentCategorySelected = !!(typeForm && (typeForm.category || typeForm.propertyCategory));
  const allowRentBatchMode = saleTypeNorm === "rent" && rentCategorySelected;

  const isRentBatch =
    saleTypeNorm === "rent" && rentBatchMode === "yes" && roomRentalMode !== "room";

  const rawLayoutCount = Number(typeForm?.layoutCount);
  const batchLayoutCount = Math.max(
    2,
    Math.min(20, Number.isFinite(rawLayoutCount) ? rawLayoutCount : 2)
  );

  const rawRoomCount = Number(typeForm?.roomCount);
  const roomLayoutCount =
    roomRentalMode === "room"
      ? typeForm?.roomCountMode === "multi"
        ? Math.max(2, Math.min(20, Number.isFinite(rawRoomCount) ? rawRoomCount : 2))
        : 1
      : 1;

  const lastFormJsonRef = useRef("");
  const lastDerivedRef = useRef({ saleType: "", status: "", roomMode: "" });

  // ✅ 记住 DB 这四个字段到底是“对象”还是“JSON 字符串”
  const dbJsonStringModeRef = useRef({
    typeForm: false,
    singleFormData: false,
    areaData: false,
    unitLayouts: false,
  });

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

  // ✅ 编辑模式：读取房源并回填（最关键：优先取“有内容”的那一个 + 支持 JSON 字符串）
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
          return;
        }

        // 记录 DB 是否是“字符串 JSON”
        dbJsonStringModeRef.current.typeForm =
          typeof data.typeForm === "string" || typeof data.type_form === "string";
        dbJsonStringModeRef.current.singleFormData =
          typeof data.singleFormData === "string" || typeof data.single_form_data === "string";
        dbJsonStringModeRef.current.areaData =
          typeof data.areaData === "string" || typeof data.area_data === "string";
        dbJsonStringModeRef.current.unitLayouts =
          typeof data.unitLayouts === "string" || typeof data.unit_layouts === "string";

        const tfRaw = pickPreferNonEmpty(data.typeForm, data.type_form, null);
        const sfdRaw = pickPreferNonEmpty(data.singleFormData, data.single_form_data, {});
        const adRaw = pickPreferNonEmpty(data.areaData, data.area_data, areaData);
        const ulsRaw = pickPreferNonEmpty(data.unitLayouts, data.unit_layouts, []);

        const tf = safeParseMaybeJson(tfRaw);
        const sfd = safeParseMaybeJson(sfdRaw);
        const ad = safeParseMaybeJson(adRaw);
        const uls = safeParseMaybeJson(ulsRaw);

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
        setSingleFormData((sfd && typeof sfd === "object") ? sfd : {});
        setAreaData((ad && typeof ad === "object") ? ad : areaData);
        setDescription(typeof data.description === "string" ? data.description : "");

        toast.success("已进入编辑模式");
      } catch (e) {
        console.error(e);
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
      const mode = dbJsonStringModeRef.current;

      // ✅✅✅ 关键：按 DB 现状决定是否 stringify（否则永远保存了读不回）
      const tfPayload = encodeByDbMode(typeForm || null, mode.typeForm);
      const sfdPayload = encodeByDbMode(singleFormData, mode.singleFormData);
      const adPayload = encodeByDbMode(areaData, mode.areaData);
      const ulsPayload = encodeByDbMode(unitLayouts, mode.unitLayouts);

      const payload = {
        user_id: user.id,
        address: addressObj?.address || "",
        lat: addressObj?.lat,
        lng: addressObj?.lng,

        saleType,
        propertyStatus: computedStatus,

        type: typeValue,

        // 同时写入 camel + snake（但值类型跟 DB 当前一致）
        typeForm: tfPayload,
        type_form: tfPayload,

        roomRentalMode,
        rentBatchMode,

        unitLayouts: ulsPayload,
        unit_layouts: ulsPayload,

        singleFormData: sfdPayload,
        single_form_data: sfdPayload,

        areaData: adPayload,
        area_data: adPayload,

        description,
        updated_at: new Date().toISOString(),
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
                `这个 column 必须存在（建议 jsonb 或 text 存 JSON 字符串）。\n\n` +
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

        // ✅✅✅ 保存后立刻读回验证（不再允许“假成功”）
        const { data: after, error: afterErr } = await supabase
          .from("properties")
          .select("typeForm,type_form,singleFormData,single_form_data,areaData,area_data,unitLayouts,unit_layouts")
          .eq("id", editId)
          .eq("user_id", user.id)
          .single();

        if (afterErr) {
          console.error("[Readback Error]", afterErr);
          toast.error("保存后读取失败（请看 Console）");
          alert("保存后读取失败（请看 Console）");
          return;
        }

        const afterSfd = safeParseMaybeJson(pickPreferNonEmpty(after?.singleFormData, after?.single_form_data, {}));
        const afterTf = safeParseMaybeJson(pickPreferNonEmpty(after?.typeForm, after?.type_form, null));
        const afterAd = safeParseMaybeJson(pickPreferNonEmpty(after?.areaData, after?.area_data, {}));
        const afterUls = safeParseMaybeJson(pickPreferNonEmpty(after?.unitLayouts, after?.unit_layouts, []));

        const okSfd = normalizeForCompare(afterSfd) === normalizeForCompare(singleFormData);
        const okTf = normalizeForCompare(afterTf) === normalizeForCompare(typeForm || null);
        const okAd = normalizeForCompare(afterAd) === normalizeForCompare(areaData);
        const okUls = normalizeForCompare(afterUls) === normalizeForCompare(unitLayouts);

        if (!okSfd || !okTf || !okAd || !okUls) {
          console.error("[SAVE READBACK MISMATCH]", {
            okSfd,
            okTf,
            okAd,
            okUls,
            expected: { typeForm, singleFormData, areaData, unitLayouts },
            got: { afterTf, afterSfd, afterAd, afterUls },
            rawAfter: after,
          });

          toast.error("保存失败：数据库读回的内容还是空/不一致（不是前端没记住）");
          alert(
            "保存失败：数据库读回的内容还是空/不一致。\n\n" +
              "✅ 这说明问题在 Supabase（列类型/trigger/RLS 覆盖），不是你有没有选。\n" +
              "我已经把差异打印在 Console：SAVE READBACK MISMATCH"
          );
          return;
        }

        toast.success("保存修改成功");
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
              `这个 column 必须存在（建议 jsonb 或 text 存 JSON 字符串）。\n\n` +
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
      const { error } = await supabase
        .from("properties")
        .delete()
        .eq("id", editId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("房源已删除");
      router.push("/my-profile");
    } catch (e) {
      console.error(e);
      toast.error("删除失败");
      alert("删除失败（请看 Console 报错）");
    } finally {
      setSubmitting(false);
    }
  };

  const shouldShowProjectTrustSection =
    isProject && Array.isArray(unitLayouts) && unitLayouts.length > 0;

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">{isEditMode ? "编辑房源" : "上传房源"}</h1>

      <AddressSearchInput value={addressObj} onChange={setAddressObj} />

      <TypeSelector
        value={typeValue}
        onChange={setTypeValue}
        initialForm={typeForm}
        rentBatchMode={allowRentBatchMode ? rentBatchMode : "no"}
        onChangeRentBatchMode={(val) => {
          if (!allowRentBatchMode) return;
          setRentBatchMode(val);
        }}
        onFormChange={(form) => {
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
        }}
      />

      {isHomestay ? (
        <HomestayUploadForm
          formData={singleFormData}
          setFormData={setSingleFormData}
          onFormChange={(patch) =>
            setSingleFormData((prev) => ({ ...(prev || {}), ...(patch || {}) }))
          }
        />
      ) : isHotel ? (
        <HotelUploadForm
          formData={singleFormData}
          setFormData={setSingleFormData}
          onFormChange={(patch) =>
            setSingleFormData((prev) => ({ ...(prev || {}), ...(patch || {}) }))
          }
        />
      ) : isProject ? (
        <>
          <ProjectUploadForm
  
