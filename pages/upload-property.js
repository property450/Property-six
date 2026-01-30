// pages/upload-property.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { supabase } from "../supabaseClient";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";

import TypeSelector from "@/components/TypeSelector";

import HotelUploadForm from "@/components/hotel/HotelUploadForm";
import HomestayUploadForm from "@/components/homestay/HomestayUploadForm";

import RentUploadForm from "@/components/forms/RentUploadForm";
import SaleUploadForm from "@/components/forms/SaleUploadForm";
import ProjectUploadForm from "@/components/forms/ProjectUploadForm"; // ✅ 关键：Project 表单要回来

// ⚠️ 这里不要再渲染 ListingTrustSection（你表单内部已经有了），否则会出现两个“真实性与地址信息”
// import ListingTrustSection from "@/components/trust/ListingTrustSection";

import { useUser } from "@supabase/auth-helpers-react";

const AddressSearchInput = dynamic(() => import("@/components/AddressSearchInput"), { ssr: false });

/* =========================
   小工具（保持你原本）
========================= */
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

/* =========================
   ✅ 价格列同步（保留你现有）
========================= */
function parseNumberLike(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isNaN(v) ? null : v;
  const s = String(v).trim();
  if (!s) return null;
  const n = Number(s.replace(/,/g, "").replace(/[^\d.]/g, ""));
  return Number.isNaN(n) ? null : n;
}

function getAvailabilityPricesMap(singleFormData) {
  const s = singleFormData || {};
  const layout0 = Array.isArray(s.roomLayouts)
    ? s.roomLayouts[0]
    : Array.isArray(s.room_layouts)
    ? s.room_layouts[0]
    : null;
  const map1 = layout0?.availability?.prices;
  const map2 = s?.availability?.prices;
  const map3 = s?.availability_data?.prices;
  return map1 && typeof map1 === "object"
    ? map1
    : map2 && typeof map2 === "object"
    ? map2
    : map3 && typeof map3 === "object"
    ? map3
    : null;
}

function derivePriceColumnsFromSingleForm(activeFormKey, singleFormData) {
  const s = singleFormData || {};

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

/* =========================
   主页面
========================= */
const DEFAULT_AREA_DATA = {
  types: ["buildUp"],
  units: { buildUp: "Square Feet (sqft)", land: "Square Feet (sqft)" },
  values: { buildUp: "", land: "" },
};

export default function UploadPropertyPage() {
  const router = useRouter();
  const user = useUser();

  const [typeValue, setTypeValue] = useState("");
  const [rentBatchMode, setRentBatchMode] = useState("no");

  const [typeForm, setTypeForm] = useState({});
  const [typeSelectorInitialForm, setTypeSelectorInitialForm] = useState({});

  const [singleFormData, setSingleFormData] = useState({});
  const [areaData, setAreaData] = useState(DEFAULT_AREA_DATA);
  const [unitLayouts, setUnitLayouts] = useState([]);

  const [addressObj, setAddressObj] = useState(null);
  const [description, setDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [editHydrated, setEditHydrated] = useState(false);

  const [typeSelectorKey, setTypeSelectorKey] = useState(0);

  const isEditMode = String(router.query?.edit || "") === "1";
  const editId = router.query?.id ? Number(router.query.id) : null;

  const saleTypeRaw = String(typeForm?.saleType || "").trim();
  const saleTypeNorm = saleTypeRaw.toLowerCase();
  const computedStatus = String(typeForm?.propertyStatus || "").trim();
  const statusLower = computedStatus.toLowerCase();
  const roomRentalMode = String(typeForm?.roomRentalMode || "whole").toLowerCase();

  // ✅ New Project / Completed Unit 判断
  const isProjectStatus =
    saleTypeNorm === "sale" &&
    (statusLower.includes("new project") ||
      statusLower.includes("under construction") ||
      statusLower.includes("completed unit") ||
      statusLower.includes("developer unit") ||
      statusLower.includes("completed"));

  // ✅ 读 layout 数量（兼容多个 key）
  const layoutCountRaw =
    typeForm?.layoutCount ??
    typeForm?.layout_count ??
    typeForm?.unitTypeCount ??
    typeForm?.unit_type_count ??
    "";
  const layoutCount = Number(String(layoutCountRaw || "").replace(/,/g, ""));

  // ✅✅✅ 关键修复：你选择 layoutCount 后，强制让 unitLayouts 数量 = layoutCount
  useEffect(() => {
    if (!isProjectStatus) return;
    if (!Number.isFinite(layoutCount) || layoutCount <= 0) return;

    setUnitLayouts((prev) => {
      const arr = Array.isArray(prev) ? prev.slice(0) : [];
      if (arr.length === layoutCount) return arr;

      if (arr.length < layoutCount) {
        while (arr.length < layoutCount) {
          arr.push({
            // 给一个最小结构，避免 UnitLayoutForm 读不到而报错
            name: "",
            roomCounts: {},
            photos: {},
          });
        }
      } else {
        arr.length = layoutCount;
      }
      return arr;
    });
  }, [isProjectStatus, layoutCount]);

  const getActiveFormKey = () => {
    if (saleTypeNorm === "sale") {
      if (statusLower.includes("new project")) return "sale_new_project";
      if (statusLower.includes("completed")) return "sale_completed_unit";
      if (statusLower.includes("auction")) return "sale_auction";
      if (statusLower.includes("rent-to-own")) return "sale_rent_to_own";
      return "sale_subsale";
    }
    if (saleTypeNorm === "rent") return roomRentalMode === "room" ? "rent_room" : "rent_whole";
    if (saleTypeNorm === "homestay") return "homestay";
    if (saleTypeNorm.includes("hotel")) return "hotel";
    return "unknown";
  };

  // ✅ 从编辑回到“上传房源”时：清空（避免带着编辑资料）
  useEffect(() => {
    if (!router.isReady) return;

    if (!isEditMode) {
      setTypeValue("");
      setRentBatchMode("no");
      setTypeForm({});
      setTypeSelectorInitialForm({});
      setSingleFormData({});
      setAreaData(DEFAULT_AREA_DATA);
      setUnitLayouts([]);
      setAddressObj(null);
      setDescription("");
      setEditHydrated(false);
      setTypeSelectorKey((k) => k + 1);
    }
  }, [router.isReady, isEditMode, router.asPath]);

  // 编辑回填
  useEffect(() => {
    const fetchForEdit = async () => {
      if (!router.isReady) return;
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
        const sfd = safeParseMaybeJson(pickPreferNonEmpty(data.single_form_data_v2, data.singleFormData, {})) || {};

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

        setSingleFormData(sfd);

        setAreaData(
          safeParseMaybeJson(pickPreferNonEmpty(data.areaData, data.area_data, DEFAULT_AREA_DATA)) ||
            DEFAULT_AREA_DATA
        );

        const ul = safeParseMaybeJson(pickPreferNonEmpty(data.unitLayouts, data.unit_layouts, []));
        setUnitLayouts(Array.isArray(ul) ? ul : []);

        setDescription(data.description || "");

        setEditHydrated(true);
      } catch (e) {
        console.error(e);
        toast.error("读取房源失败");
        alert("读取房源失败（请看 Console 报错）");
        setEditHydrated(true);
      }
    };

    fetchForEdit();
  }, [router.isReady, isEditMode, editId, user?.id]);

  const mustLogin = !user;
  const mustPickSaleType = !saleTypeRaw;
  const mustPickAddress = !addressObj?.lat || !addressObj?.lng;

  const handleSubmit = async () => {
    if (mustLogin) return alert("请先登录");
    if (mustPickSaleType) return alert("请选择 Sale / Rent / Homestay / Hotel");
    if (mustPickAddress) return alert("请选择地址");
    if (submitting) return;

    setSubmitting(true);
    try {
      const activeFormKey = getActiveFormKey();
      const priceCols = derivePriceColumnsFromSingleForm(activeFormKey, singleFormData);

      const payload = {
        ...priceCols,

        user_id: user.id,
        address: addressObj?.address || "",
        lat: addressObj?.lat,
        lng: addressObj?.lng,

        saleType: saleTypeRaw,
        propertyStatus: computedStatus,
        listing_mode: activeFormKey,

        type: typeValue,

        type_form_v2: typeForm || null,
        single_form_data_v2: singleFormData || {},

        typeForm: typeForm || null,
        type_form: typeForm || null,

        roomRentalMode,
        rentBatchMode,

        unitLayouts: unitLayouts || [],
        unit_layouts: unitLayouts || [],

        singleFormData: singleFormData || {},
        single_form_data: singleFormData || {},

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
          const missing = extractMissingColumnName(out.error);
          alert(missing ? `保存失败：缺少 column ${missing}` : "保存失败（看 Console）");
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
        const missing = extractMissingColumnName(out.error);
        alert(missing ? `提交失败：缺少 column ${missing}` : "提交失败（看 Console）");
        return;
      }

      toast.success("提交成功");
      router.push("/");
    } catch (e) {
      console.error(e);
      alert("提交失败（看 Console）");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return alert("请先登录");
    if (!isEditMode) return;
    if (!confirm("确定要删除该房源吗？")) return;

    try {
      const { error } = await supabase.from("properties").delete().eq("id", editId).eq("user_id", user.id);
      if (error) throw error;
      toast.success("删除成功");
      router.push("/my-profile");
    } catch (e) {
      console.error(e);
      alert("删除失败（看 Console）");
    }
  };

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

      {/* ✅ 必须用你现在 TypeSelector 的 API */}
      <TypeSelector
        key={typeSelectorKey}
        onFormChange={setTypeForm}
        rentBatchMode={rentBatchMode}
        onChangeRentBatchMode={setRentBatchMode}
        initialForm={typeSelectorInitialForm}
      />

      <div className="mt-4">
        <AddressSearchInput value={addressObj?.address || ""} onSelect={setAddressObj} />
      </div>

      <div className="mt-6">
        {/* ✅✅✅ 关键：New Project / Completed Unit 用 ProjectUploadForm */}
        {saleTypeNorm === "sale" && isProjectStatus && (
          <ProjectUploadForm
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

        {/* 其它 Sale 状态继续用 SaleUploadForm */}
        {saleTypeNorm === "sale" && !isProjectStatus && (
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

        {saleTypeNorm.includes("hotel") && (
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

      {/* ✅✅✅ 不要在这里再渲染 ListingTrustSection，否则会出现两个 */}
      {/* <ListingTrustSection ... /> */}

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
