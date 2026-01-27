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
  ["type_form_v2", "type_form_v2"],
  ["single_form_data_v2", "single_form_data_v2"],
];

async function runWithAutoStripColumns({ mode, payload, editId, userId, maxTries = 10 }) {
  let working = { ...payload };
  let tries = 0;

  while (tries < maxTries) {
    tries++;

    try {
      let q = supabase.from("properties");

      if (mode === "update") {
        q = q.update(working).eq("id", editId).eq("user_id", userId);
      } else {
        q = q.insert(working);
      }

      const { data, error } = await q.select("*").single();

      if (!error) return { ok: true, data };

      console.error("[Supabase Error]", error);

      const missing = extractMissingColumnName(error);

      if (missing) {
        if (PROTECTED_KEYS.has(missing)) {
          return { ok: false, error, protectedMissing: missing };
        }

        // ✅ 自动删掉缺失 column，并继续重试
        const next = { ...working };
        delete next[missing];

        // 同时删除同义 key（例如：singleFormData / single_form_data）
        for (const [a, b] of KEY_PAIRS) {
          if (missing === a) delete next[b];
          if (missing === b) delete next[a];
        }

        working = next;
        continue;
      }

      return { ok: false, error };
    } catch (e) {
      console.error("[Supabase Unexpected]", e);
      return { ok: false, error: e };
    }
  }

  return { ok: false, error: new Error("Too many tries") };
}

export default function UploadPropertyPage() {
  const router = useRouter();
  const user = useUser();

  const editId = router.query?.id ? String(router.query.id) : "";
  const isEditMode = router.query?.edit === "1" && !!editId;

  const [submitting, setSubmitting] = useState(false);

  const [typeForm, setTypeForm] = useState(null);
  const [saleType, setSaleType] = useState("");
  const [computedStatus, setComputedStatus] = useState("");
  const [typeValue, setTypeValue] = useState("");

  const [roomRentalMode, setRoomRentalMode] = useState("whole");
  const [rentBatchMode, setRentBatchMode] = useState("no");

  const [projectCategory, setProjectCategory] = useState("");
  const [projectSubType, setProjectSubType] = useState("");

  const [addressObj, setAddressObj] = useState(null);

  const lastDerivedRef = useRef({
    saleType: "",
    status: "",
    roomRentalMode: "",
    rentBatchMode: "",
  });

  const [unitLayouts, setUnitLayouts] = useState([]);
  const [singleFormData, setSingleFormData] = useState({});
  const [areaData, setAreaData] = useState({
    showBuildUp: true,
    showLand: false,
    buildUp: { unit: "sqft", value: "" },
    land: { unit: "sqft", value: "" },
  });
  const [description, setDescription] = useState("");

  // ✅✅✅ 关键：编辑回填后强制重挂载 Homestay/Hotel 表单，让内部 state 重新吃到 formData
  const [hydrateKey, setHydrateKey] = useState(0);

  const saleTypeNorm = String(saleType || "").toLowerCase();
  const isHomestay = saleTypeNorm.includes("homestay");
  const isHotel = saleTypeNorm.includes("hotel");

  const isProject = saleTypeNorm.includes("sale") && (computedStatus || "").toLowerCase().includes("project");
  const isRent = saleTypeNorm.includes("rent");
  const isSale = saleTypeNorm.includes("sale");

  const mustLogin = !user;
  const mustPickSaleType = !saleType;
  const mustPickAddress = !addressObj?.lat || !addressObj?.lng;
  const mustPickType = !typeValue;

  const handleTypeFormChange = useCallback(
    (next) => {
      setTypeForm(next);

      const nextSaleType = next?.saleType || "";
      const nextStatus = next?.propertyStatus || "";
      const nextRoomRentalMode = next?.roomRentalMode || "whole";
      const nextRentBatchMode = next?.rentBatchMode || "no";

      const last = lastDerivedRef.current;

      if (nextSaleType !== last.saleType) setSaleType(nextSaleType);
      if (nextStatus !== last.status) setComputedStatus(nextStatus);
      if (nextRoomRentalMode !== last.roomRentalMode) setRoomRentalMode(nextRoomRentalMode);
      if (nextRentBatchMode !== last.rentBatchMode) setRentBatchMode(nextRentBatchMode);

      lastDerivedRef.current = {
        saleType: nextSaleType,
        status: nextStatus,
        roomRentalMode: nextRoomRentalMode,
        rentBatchMode: nextRentBatchMode,
      };
    },
    [setTypeForm]
  );

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
        setSingleFormData(sfd || {});
        setAreaData(ad || areaData);
        setDescription(typeof data.description === "string" ? data.description : "");

        // ✅ 同步 lastDerived，避免第一次 TypeSelector onFormChange 又触发一轮不必要的 setState
        lastDerivedRef.current = {
          saleType: (tf && tf.saleType) || "",
          status: (tf && tf.propertyStatus) || "",
          roomRentalMode: (tf && tf.roomRentalMode) || "whole",
          rentBatchMode: (tf && tf.rentBatchMode) || "no",
        };

        // ✅✅✅ 关键：回填完成后强制重挂载 Homestay/Hotel 表单，让它们重新读入 formData
        setHydrateKey((k) => k + 1);

        toast.success("已进入编辑模式");
      } catch (e) {
        console.error(e);
        toast.error("进入编辑失败（请看 Console）");
        alert("进入编辑失败（请看 Console）");
      }
    };

    fetchForEdit();
  }, [isEditMode, editId, user]);

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
      } else {
        const out = await runWithAutoStripColumns({
          mode: "insert",
          payload,
          editId: "",
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
      }

      toast.success(isEditMode ? "保存修改成功" : "上传成功");
      router.push("/my-properties");
    } catch (e) {
      console.error(e);
      toast.error("提交失败（请看 Console 报错）");
      alert("提交失败（请看 Console 报错）");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <TypeSelector
        typeForm={typeForm}
        setTypeForm={setTypeForm}
        saleType={saleType}
        setSaleType={setSaleType}
        computedStatus={computedStatus}
        setComputedStatus={setComputedStatus}
        typeValue={typeValue}
        setTypeValue={setTypeValue}
        roomRentalMode={roomRentalMode}
        setRoomRentalMode={setRoomRentalMode}
        rentBatchMode={rentBatchMode}
        setRentBatchMode={setRentBatchMode}
        onFormChange={handleTypeFormChange}
      />

      {isHomestay ? (
        <HomestayUploadForm
          key={`home-${hydrateKey}`}
          formData={singleFormData}
          setFormData={setSingleFormData}
          onFormChange={(patch) => setSingleFormData((prev) => ({ ...(prev || {}), ...(patch || {}) }))}
          onPrimarySubmit={handleSubmit}
        />
      ) : isHotel ? (
        <HotelUploadForm
          key={`hotel-${hydrateKey}`}
          formData={singleFormData}
          setFormData={setSingleFormData}
          onFormChange={(patch) => setSingleFormData((prev) => ({ ...(prev || {}), ...(patch || {}) }))}
          onPrimarySubmit={handleSubmit}
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
            singleFormData={singleFormData}
            setSingleFormData={setSingleFormData}
            areaData={areaData}
            setAreaData={setAreaData}
          />

          <ListingTrustSection
            singleFormData={singleFormData}
            setSingleFormData={setSingleFormData}
            layoutCount={Array.isArray(unitLayouts) ? unitLayouts.length : 0}
          />
        </>
      ) : isRent ? (
        <RentUploadForm
          saleType={saleType}
          computedStatus={computedStatus}
          roomRentalMode={roomRentalMode}
          rentBatchMode={rentBatchMode}
          unitLayouts={unitLayouts}
          setUnitLayouts={setUnitLayouts}
          singleFormData={singleFormData}
          setSingleFormData={setSingleFormData}
          areaData={areaData}
          setAreaData={setAreaData}
        />
      ) : isSale ? (
        <SaleUploadForm
          saleType={saleType}
          computedStatus={computedStatus}
          unitLayouts={unitLayouts}
          setUnitLayouts={setUnitLayouts}
          singleFormData={singleFormData}
          setSingleFormData={setSingleFormData}
          areaData={areaData}
          setAreaData={setAreaData}
        />
      ) : null}

      <div className="space-y-2">
        <label className="block font-semibold">地址</label>
        <AddressSearchInput value={addressObj} onChange={setAddressObj} />
      </div>

      <div className="space-y-2">
        <label className="block font-semibold">房源描述</label>
        <textarea
          className="w-full border rounded p-3 min-h-[120px]"
          placeholder="请输入房源详细描述..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <Button
        className="w-full"
        disabled={submitting}
        onClick={handleSubmit}
      >
        {submitting ? "提交中..." : isEditMode ? "保存修改" : "提交房源"}
      </Button>
    </div>
  );
}
