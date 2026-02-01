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

function hasAnyValue(v) {
  if (!v) return false;
  if (typeof v !== "object") return true;
  if (Array.isArray(v)) return v.length > 0;
  return Object.keys(v).length > 0;
}

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

export default function UploadPropertyPage() {
  const router = useRouter();
  const user = useUser();

  const [saleType, setSaleType] = useState("");
  const [typeValue, setTypeValue] = useState("");
  const [propertyStatus, setPropertyStatus] = useState("");
  const [roomRentalMode, setRoomRentalMode] = useState("whole");
  const [rentBatchMode, setRentBatchMode] = useState("no");

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
  const [submitting, setSubmitting] = useState(false);

  const isEditMode = String(router.query?.edit || "") === "1";
  const editId = router.query?.id ? Number(router.query.id) : null;
  const [editHydrated, setEditHydrated] = useState(!isEditMode);

  const saleTypeNorm = String(saleType || "").trim().toLowerCase();

  const safeId = isEditMode && editId ? editId : null;

  // ==========================
  // ✅ 编辑模式：加载并回填
  // ==========================
  useEffect(() => {
    if (!isEditMode) return;
    if (!safeId) return;
    if (!user?.id) return;

    let cancelled = false;

    (async () => {
      try {
        const { data, error } = await supabase
          .from("properties")
          .select("*")
          .eq("id", safeId)
          .eq("user_id", user.id)
          .single();

        if (error) throw error;
        if (cancelled) return;

        const raw = data || {};

        const typeFormCamel = safeParseMaybeJson(raw.typeForm);
        const typeFormSnake = safeParseMaybeJson(raw.type_form);
        const singleCamel = safeParseMaybeJson(raw.singleFormData);
        const singleSnake = safeParseMaybeJson(raw.single_form_data);
        const areaCamel = safeParseMaybeJson(raw.areaData);
        const areaSnake = safeParseMaybeJson(raw.area_data);
        const layoutsCamel = safeParseMaybeJson(raw.unitLayouts);
        const layoutsSnake = safeParseMaybeJson(raw.unit_layouts);

        const mergedTypeForm = pickPreferNonEmpty(typeFormCamel, typeFormSnake, {});
        const mergedSingle = pickPreferNonEmpty(singleCamel, singleSnake, {});
        const mergedArea = pickPreferNonEmpty(areaCamel, areaSnake, null);
        const mergedLayouts = pickPreferNonEmpty(layoutsCamel, layoutsSnake, []);

        setTypeForm(mergedTypeForm || {});
        setTypeSelectorInitialForm(mergedTypeForm || {});

        setSingleFormData(mergedSingle || {});

        if (mergedArea && typeof mergedArea === "object") setAreaData(mergedArea);

        setUnitLayouts(Array.isArray(mergedLayouts) ? mergedLayouts : []);

        const st = mergedTypeForm?.saleType || raw.saleType || raw.sale_type || "";
        const ps = mergedTypeForm?.propertyStatus || raw.propertyStatus || raw.property_status || "";
        const rrm = mergedTypeForm?.roomRentalMode || raw.roomRentalMode || raw.room_rental_mode || "whole";
        const rbm = mergedTypeForm?.rentBatchMode || raw.rentBatchMode || raw.rent_batch_mode || "no";

        setSaleType(st);
        setPropertyStatus(ps);
        setRoomRentalMode(rrm || "whole");
        setRentBatchMode(rbm || "no");

        if (raw.address) setAddressObj({ address: raw.address, lat: raw.lat, lng: raw.lng });

        setEditHydrated(true);
      } catch (e) {
        console.error(e);
        toast.error("读取房源资料失败（请看 Console）");
        setEditHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isEditMode, safeId, user?.id]);

  // ==========================
  // ✅ 保存 / 更新
  // ==========================
  const handleSubmit = useCallback(async () => {
    if (!user?.id) {
      toast.error("请先登录");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        user_id: user.id,

        typeForm,
        singleFormData,
        areaData,
        unitLayouts,

        saleType,
        propertyStatus,
        roomRentalMode,
        rentBatchMode,

        address: addressObj?.address || "",
        lat: addressObj?.lat ?? null,
        lng: addressObj?.lng ?? null,

        updated_at: new Date().toISOString(),
      };

      const mode = isEditMode ? "update" : "insert";

      const res = await runWithAutoStripColumns({
        mode,
        payload,
        editId: safeId,
        userId: user.id,
      });

      if (!res.ok) {
        if (res.protectedMissing) {
          toast.error(`Supabase 缺少 column：${res.protectedMissing}（请在 Supabase 补齐）`);
        } else {
          toast.error("保存失败（请看 Console）");
        }
        return;
      }

      if (res.removed?.length) {
        toast(
          `已自动移除 Supabase 不存在的字段：${res.removed.slice(0, 5).join(", ")}${
            res.removed.length > 5 ? "..." : ""
          }`
        );
      }

      toast.success(isEditMode ? "保存成功" : "上传成功");

      if (!isEditMode) router.push("/");
    } catch (e) {
      console.error(e);
      toast.error("保存失败（请看 Console）");
    } finally {
      setSubmitting(false);
    }
  }, [
    user?.id,
    typeForm,
    singleFormData,
    areaData,
    unitLayouts,
    saleType,
    propertyStatus,
    roomRentalMode,
    rentBatchMode,
    addressObj,
    isEditMode,
    safeId,
    router,
  ]);

  // ==========================
  // ✅ 删除
  // ==========================
  const handleDelete = useCallback(async () => {
    if (!user?.id) {
      toast.error("请先登录");
      return;
    }
    if (!safeId) return;

    const ok = window.confirm("确定要删除这条房源吗？");
    if (!ok) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("properties").delete().eq("id", safeId).eq("user_id", user.id);
      if (error) throw error;

      toast.success("删除成功");
      router.push("/my-profile");
    } catch (e) {
      console.error(e);
      toast.error("删除失败（请看 Console）");
    } finally {
      setSubmitting(false);
    }
  }, [user?.id, safeId, router]);

  if (isEditMode && !editHydrated) {
    return (
      <div className="p-6">
        <div className="text-gray-600">正在读取房源资料...</div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="text-2xl font-bold mb-4">{isEditMode ? "编辑房源" : "上传房源"}</div>

      <div className="mt-4">
        <AddressSearchInput value={addressObj?.address || ""} onSelect={setAddressObj} />
      </div>

      <div className="mt-4">
        <TypeSelector
          saleType={saleType}
          setSaleType={setSaleType}
          typeValue={typeValue}
          setTypeValue={setTypeValue}
          propertyStatus={propertyStatus}
          setPropertyStatus={setPropertyStatus}
          roomRentalMode={roomRentalMode}
          setRoomRentalMode={setRoomRentalMode}
          rentBatchMode={rentBatchMode}
          setRentBatchMode={setRentBatchMode}
          typeForm={typeForm}
          setTypeForm={setTypeForm}
          initialForm={typeSelectorInitialForm}
        />
      </div>

      <div className="mt-6">
        {saleTypeNorm === "sale" && (
          <SaleUploadForm
            typeForm={typeForm}
            setTypeForm={setTypeForm}
            singleFormData={singleFormData}
            setSingleFormData={setSingleFormData}
            areaData={areaData}
            setAreaData={setAreaData}
            unitLayouts={unitLayouts}
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
            unitLayouts={unitLayouts}
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

      {/* Trust Section（按你的设计：Homestay / Hotel 不显示；New Project / Completed Unit 必须先选 layout 数量才显示） */}
      {(() => {
        const st = String(saleType || "").trim().toLowerCase();
        const statusLower = String(propertyStatus || typeForm?.propertyStatus || "").toLowerCase();
        const isSaleOrRent = st === "sale" || st === "rent";
        const isSaleProject =
          st === "sale" &&
          (statusLower.includes("new project") ||
            statusLower.includes("completed unit") ||
            statusLower.includes("completed"));

        const hasLayouts = Array.isArray(unitLayouts) && unitLayouts.length > 0;

        if (!isSaleOrRent) return null;
        if (isSaleProject && !hasLayouts) return null;

        return (
          <div className="mt-6">
            <ListingTrustSection singleFormData={singleFormData} setSingleFormData={setSingleFormData} />
          </div>
        );
      })()}

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
