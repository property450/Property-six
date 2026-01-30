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

import ProjectUploadForm from "@/components/forms/ProjectUploadForm";
import RentUploadForm from "@/components/forms/RentUploadForm";
import SaleUploadForm from "@/components/forms/SaleUploadForm";
import ListingTrustSection from "@/components/trust/ListingTrustSection";

import { useUser } from "@supabase/auth-helpers-react";

const AddressSearchInput = dynamic(() => import("@/components/AddressSearchInput"), {
  ssr: false,
});

// ================== 工具函数（保持你原本逻辑） ==================
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

// ================== 价格同步（保留你现有） ==================
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

// ================== 主页面 ==================
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
  const [description, setDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const isEditMode = String(router.query?.edit || "") === "1";
  const editId = router.query?.id ? Number(router.query.id) : null;
  const [editHydrated, setEditHydrated] = useState(false);

  const saleTypeNorm = String(saleType || "").trim().toLowerCase();

  const computedStatus = propertyStatus || typeForm?.propertyStatus || typeForm?.property_status || "";

  const statusLower = String(computedStatus || "").toLowerCase();

  // ✅✅✅ 关键：New Project / Completed Unit 用 ProjectUploadForm 才会有“房型数量”
  const isProjectStatus =
    saleTypeNorm === "sale" &&
    (statusLower.includes("new project") ||
      statusLower.includes("under construction") ||
      statusLower.includes("completed unit") ||
      statusLower.includes("developer unit") ||
      // 防止你选项里写 “Completed Unit / Developer Unit”
      statusLower.includes("completed"));

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

  // ===== 编辑回填（保留你原本）=====
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
        const sfd = safeParseMaybeJson(pickPreferNonEmpty(data.single_form_data_v2, data.singleFormData, {})) || {};

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

        setSingleFormData(sfd);

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
        toast.error("读取房源失败");
        alert("读取房源失败（请看 Console 报错）");
        setEditHydrated(true);
      }
    };

    fetchForEdit();
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
      const activeFormKey = getActiveFormKey({ saleTypeNorm, computedStatus, roomRentalMode });

      // ✅ 价格同步（保留你原本）
      const priceCols = derivePriceColumnsFromSingleForm(activeFormKey, singleFormData);

      const payload = {
        ...priceCols,

        user_id: user.id,
        address: addressObj?.address || "",
        lat: addressObj?.lat,
        lng: addressObj?.lng,

        saleType,
        propertyStatus: computedStatus,
        listing_mode: activeFormKey,

        type: typeValue,

        type_form_v2: typeForm || null,
        single_form_data_v2: singleFormData || {},

        // 兼容列（保留）
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
          if (out.protectedMissing) {
            toast.error(`保存失败：Supabase 缺少关键 column：${out.protectedMissing}`);
            alert(
              `保存失败：Supabase 缺少关键 column：${out.protectedMissing}\n\n` +
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

    if (!confirm("确定要删除该房源吗？")) return;

    try {
      const { error } = await supabase.from("properties").delete().eq("id", editId).eq("user_id", user.id);
      if (error) throw error;

      toast.success("删除成功");
      alert("删除成功");
      router.push("/my-profile");
    } catch (e) {
      console.error(e);
      toast.error("删除失败");
      alert("删除失败（请看 Console 报错）");
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

      {/* ✅✅✅ 关键修复：TypeSelector 兼容不同版本的 props（新建时 saleType 必须能 set） */}
      <TypeSelector
        saleType={saleType}
        setSaleType={setSaleType}
        onSaleTypeChange={setSaleType}
        typeValue={typeValue}
        setTypeValue={setTypeValue}
        onTypeValueChange={setTypeValue}
        propertyStatus={propertyStatus}
        setPropertyStatus={setPropertyStatus}
        onPropertyStatusChange={setPropertyStatus}
        roomRentalMode={roomRentalMode}
        setRoomRentalMode={setRoomRentalMode}
        onRoomRentalModeChange={setRoomRentalMode}
        rentBatchMode={rentBatchMode}
        setRentBatchMode={setRentBatchMode}
        onRentBatchModeChange={setRentBatchMode}
        typeForm={typeForm}
        setTypeForm={setTypeForm}
        initialForm={typeSelectorInitialForm}
      />

      <div className="mt-4">
        <AddressSearchInput value={addressObj?.address || ""} onSelect={setAddressObj} />
      </div>

      {/* ✅✅✅ 表单渲染：New Project / Completed Unit 用 ProjectUploadForm（房型数量会回来） */}
      <div className="mt-6">
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

      <div className="mt-6">
        <ListingTrustSection singleFormData={singleFormData} setSingleFormData={setSingleFormData} />
      </div>

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
    
