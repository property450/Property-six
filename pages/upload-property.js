// pages/upload-property.js
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { supabase } from "../supabaseClient";
import { toast } from "react-hot-toast";

import TypeSelector from "@/components/TypeSelector";
import UnitTypeSelector from "@/components/UnitTypeSelector";
import UnitLayoutForm from "@/components/UnitLayoutForm";

import AreaSelector from "@/components/AreaSelector";
import PriceInput from "@/components/PriceInput";
import RoomCountSelector from "@/components/RoomCountSelector";
import CarparkCountSelector from "@/components/CarparkCountSelector";
import ExtraSpacesSelector from "@/components/ExtraSpacesSelector";
import FacingSelector from "@/components/FacingSelector";
import CarparkLevelSelector from "@/components/CarparkLevelSelector";
import FacilitiesSelector from "@/components/FacilitiesSelector";
import FurnitureSelector from "@/components/FurnitureSelector";
import BuildYearSelector from "@/components/BuildYearSelector";
import ImageUpload from "@/components/ImageUpload";
import TransitSelector from "@/components/TransitSelector";

// 你的表单（你项目里原本就有的）
import SaleUploadForm from "@/components/forms/SaleUploadForm";
import RentUploadForm from "@/components/forms/RentUploadForm";
import HomestayUploadForm from "@/components/homestay/HomestayUploadForm";
import HotelUploadForm from "@/components/hotel/HotelUploadForm";

/**
 * 解析 Supabase 缺少 column 的报错：
 * "Could not find the 'xxx' column of 'properties' in the schema cache"
 */
function extractMissingColumnName(error) {
  const msg = String(error?.message || "");
  const m = msg.match(/Could not find the '([^']+)' column/i);
  return m?.[1] || "";
}

/**
 * ✅ 深度清洗：把不能进 jsonb 的值（File/Blob/函数/undefined）去掉，
 * 并把 Date 变成 ISO string，避免“保存后读回不一致 / 不记住”
 */
function sanitizeForJson(input) {
  const seen = new WeakSet();

  const walk = (v) => {
    if (v === undefined) return null;
    if (typeof v === "function") return null;

    // 浏览器 File / Blob：不存进 jsonb（否则会变成 {} 或导致不一致）
    if (typeof File !== "undefined" && v instanceof File) return null;
    if (typeof Blob !== "undefined" && v instanceof Blob) return null;

    if (v instanceof Date) return v.toISOString();

    if (!v || typeof v !== "object") return v;

    if (seen.has(v)) return null;
    seen.add(v);

    if (Array.isArray(v)) {
      const arr = v.map(walk).filter((x) => x !== null);
      return arr;
    }

    const out = {};
    for (const k of Object.keys(v)) {
      const next = walk(v[k]);
      if (next === null) continue;
      out[k] = next;
    }
    return out;
  };

  return walk(input);
}

/**
 * ✅ 关键字段：这些没写进 DB 就会“不记住”
 * 注意：我们现在会“同时写入 camel + snake 两份 + v2 两份”
 * 所以当其中一个 column 缺失时，允许删掉“缺失的那一份副本”，但不能删真正数据。
 */
const PROTECTED_KEYS = new Set([
  "typeForm",
  "type_form",
  "singleFormData",
  "single_form_data",
  "areaData",
  "area_data",
  "unitLayouts",
  "unit_layouts",

  // v2
  "typeFormV2",
  "type_form_v2",
  "singleFormDataV2",
  "single_form_data_v2",
  "areaDataV2",
  "area_data_v2",
  "unitLayoutsV2",
  "unit_layouts_v2",
]);

// camel <-> snake 配对（以及 v2）
const KEY_PAIRS = [
  ["typeForm", "type_form"],
  ["singleFormData", "single_form_data"],
  ["areaData", "area_data"],
  ["unitLayouts", "unit_layouts"],

  ["typeFormV2", "type_form_v2"],
  ["singleFormDataV2", "single_form_data_v2"],
  ["areaDataV2", "area_data_v2"],
  ["unitLayoutsV2", "unit_layouts_v2"],
];

// 找对偶 key
function getCounterpartKey(k) {
  for (const [camel, snake] of KEY_PAIRS) {
    if (k === camel) return snake;
    if (k === snake) return camel;
  }
  return "";
}

// 判断值是否“有内容”（避免 {} 抢优先级）
function hasMeaningfulValue(v) {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v).length > 0;
  return true;
}

// ✅ 不让 {} / [] 抢优先级
function pickPreferNonEmpty(primary, fallback, defaultValue) {
  if (hasMeaningfulValue(primary)) return primary;
  if (hasMeaningfulValue(fallback)) return fallback;
  return defaultValue;
}

/**
 * 自动剥离 Supabase 缺失列，但不会剥离关键字段（PROTECTED_KEYS）
 * 同时支持“缺失的是副本列（camel/snake/v2）”时自动删掉那一份。
 */
async function runWithAutoStripColumns(runFn, payload) {
  let currentPayload = { ...payload };
  const stripped = new Set();

  for (let i = 0; i < 12; i++) {
    const { data, error } = await runFn(currentPayload);

    if (!error) {
      return { data, error: null, stripped: Array.from(stripped) };
    }

    const missing = extractMissingColumnName(error);
    if (!missing) {
      return { data: null, error, stripped: Array.from(stripped) };
    }

    // ✅ 如果缺的是关键字段本体：直接报错（不要自动删）
    if (PROTECTED_KEYS.has(missing)) {
      const counterpart = getCounterpartKey(missing);

      // ✅ 如果缺的是“副本列”，而对偶列存在：允许删缺失的那一份
      // 例如缺 typeFormV2 但 type_form_v2 还在，或缺 type_form_v2 但 typeFormV2 还在
      const hasCounterpart =
        counterpart && Object.prototype.hasOwnProperty.call(currentPayload, counterpart);

      if (hasCounterpart) {
        delete currentPayload[missing];
        stripped.add(missing);
        continue;
      }

      // 否则就是关键字段真的缺：你需要去 Supabase 加 column
      return { data: null, error, stripped: Array.from(stripped) };
    }

    // 非关键字段：可以自动删
    if (Object.prototype.hasOwnProperty.call(currentPayload, missing)) {
      delete currentPayload[missing];
      stripped.add(missing);
      continue;
    }

    // payload 没有这个 key：那就是 Supabase 端其它问题
    return { data: null, error, stripped: Array.from(stripped) };
  }

  return {
    data: null,
    error: new Error("Too many schema-cache retries (missing columns)."),
    stripped: Array.from(stripped),
  };
}

export default function UploadPropertyPage() {
  const router = useRouter();
  const { edit, id } = router.query;

  const isEditMode = edit === "1" && !!id;
  const editId = id ? Number(id) : null;

  // ====== 登录用户 ======
  const [user, setUser] = useState(null);
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };
    getUser();
  }, []);

  // ====== 表单状态（保持你原本的结构） ======
  const [saleType, setSaleType] = useState("");
  const [computedStatus, setComputedStatus] = useState("");
  const [roomRentalMode, setRoomRentalMode] = useState("whole");
  const [rentBatchMode, setRentBatchMode] = useState("");

  const [typeValue, setTypeValue] = useState("");
  const [typeForm, setTypeForm] = useState(null);

  const [singleFormData, setSingleFormData] = useState({});
  const [areaData, setAreaData] = useState({
    buildUp: { enabled: true, value: "", unit: "sqft" },
    land: { enabled: false, value: "", unit: "sqft" },
  });

  const [unitLayouts, setUnitLayouts] = useState([]);

  const [projectCategory, setProjectCategory] = useState("");
  const [projectSubType, setProjectSubType] = useState("");

  const [addressObj, setAddressObj] = useState({ address: "", lat: null, lng: null });
  const [description, setDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);

  // ====== 编辑模式加载 ======
  const didHydrateRef = useRef(false);

  useEffect(() => {
    if (!isEditMode || !editId || !user) return;
    if (didHydrateRef.current) return;
    didHydrateRef.current = true;

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

        // ✅✅✅ 关键：v2 优先，其次才回退到旧字段（避免“保存了但读取用错列”）
        const tfV2 = pickPreferNonEmpty(data.typeFormV2, data.type_form_v2, null);
        const tf = tfV2 || pickPreferNonEmpty(data.typeForm, data.type_form, null);

        const sfdV2 = pickPreferNonEmpty(data.singleFormDataV2, data.single_form_data_v2, null);
        const sfd = sfdV2 || pickPreferNonEmpty(data.singleFormData, data.single_form_data, {});

        const adV2 = pickPreferNonEmpty(data.areaDataV2, data.area_data_v2, null);
        const ad = adV2 || pickPreferNonEmpty(data.areaData, data.area_data, areaData);

        const ulsV2 = pickPreferNonEmpty(data.unitLayoutsV2, data.unit_layouts_v2, null);
        const uls = ulsV2 || pickPreferNonEmpty(data.unitLayouts, data.unit_layouts, []);

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
        setComputedStatus(
          (tf && tf.propertyStatus) || data.propertyStatus || data.property_status || ""
        );
        setRoomRentalMode(
          (tf && tf.roomRentalMode) || data.roomRentalMode || data.room_rental_mode || "whole"
        );
        if (typeof data.rentBatchMode === "string") setRentBatchMode(data.rentBatchMode);

        setProjectCategory(data.projectCategory || "");
        setProjectSubType(data.projectSubType || "");
        setUnitLayouts(Array.isArray(uls) ? uls : []);
        setSingleFormData(sfd || {});
        setAreaData(ad || areaData);
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
      // ✅✅✅ 保存前清洗（去掉 File/Blob/undefined），避免 jsonb 保存后读回不一致
      const safeTypeForm = sanitizeForJson(typeForm || null);
      const safeSingleFormData = sanitizeForJson(singleFormData || null);
      const safeAreaData = sanitizeForJson(areaData || null);
      const safeUnitLayouts = sanitizeForJson(unitLayouts || null);

      // ✅✅✅ 关键：同时写入 camel + snake（避免你其它页面/旧代码读不到）
      const payload = {
        user_id: user.id,
        address: addressObj?.address || "",
        lat: addressObj?.lat,
        lng: addressObj?.lng,

        saleType,
        propertyStatus: computedStatus,

        type: typeValue,

        typeForm: safeTypeForm,

        // v2（你现在 DB 里已有这些 column）
        typeFormV2: safeTypeForm,
        type_form_v2: safeTypeForm,

        type_form: safeTypeForm,

        singleFormData: safeSingleFormData,
        single_form_data: safeSingleFormData,

        // v2
        singleFormDataV2: safeSingleFormData,
        single_form_data_v2: safeSingleFormData,

        areaData: safeAreaData,
        area_data: safeAreaData,

        // v2
        areaDataV2: safeAreaData,
        area_data_v2: safeAreaData,

        unitLayouts: safeUnitLayouts,
        unit_layouts: safeUnitLayouts,

        // v2
        unitLayoutsV2: safeUnitLayouts,
        unit_layouts_v2: safeUnitLayouts,

        description: description || "",
      };

      const runFn = (p) => {
        if (isEditMode && editId) {
          return supabase.from("properties").update(p).eq("id", editId).eq("user_id", user.id);
        }
        return supabase.from("properties").insert(p).select().single();
      };

      const { data, error, stripped } = await runWithAutoStripColumns(runFn, payload);

      if (error) {
        console.error("SAVE ERROR:", error, { stripped });
        toast.error("保存失败（请看 Console）");
        alert(`保存失败：${error.message || error}\n\n（缺失列已自动删除：${stripped.join(", ") || "无"}）`);
        return;
      }

      toast.success(isEditMode ? "保存修改成功" : "上传成功");
      alert(isEditMode ? "保存修改成功" : "上传成功");

      // ✅ 编辑模式保存后，回到编辑页也要显示刚保存的（避免看起来“没记住”）
      if (isEditMode) {
        // 直接刷新路由（你原本的逻辑不动）
        router.replace(`/upload-property?edit=1&id=${editId}`);
      } else {
        router.push("/");
      }
    } catch (e) {
      console.error(e);
      toast.error("保存失败（请看 Console）");
      alert("保存失败（请看 Console 报错）");
    } finally {
      setSubmitting(false);
    }
  };

  // ====== 这里开始是你原本的 UI 渲染（我不改你的设计/选项） ======
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">{isEditMode ? "编辑房源" : "上传房源"}</h1>

      <TypeSelector
        saleType={saleType}
        setSaleType={setSaleType}
        propertyStatus={computedStatus}
        setPropertyStatus={setComputedStatus}
        typeValue={typeValue}
        setTypeValue={setTypeValue}
        typeForm={typeForm}
        setTypeForm={setTypeForm}
        roomRentalMode={roomRentalMode}
        setRoomRentalMode={setRoomRentalMode}
        rentBatchMode={rentBatchMode}
        setRentBatchMode={setRentBatchMode}
      />

      {/* 你项目里地址选择组件如果是 dynamic import，请按你原本写法替换这里 */}
      {/* 这里我保持最小改动：用你现有的 addressObj state */}
      <div className="mt-4">
        <label className="block font-semibold mb-1">地址</label>
        <input
          className="border rounded p-2 w-full"
          value={addressObj?.address || ""}
          onChange={(e) => setAddressObj({ ...addressObj, address: e.target.value })}
          placeholder="输入地址（或用你原本的 AddressSearchInput）"
        />
      </div>

      {/* 根据 saleType 切换表单：保持你原本结构 */}
      <div className="mt-6">
        {saleType === "Sale" && (
          <SaleUploadForm
            typeForm={typeForm}
            setTypeForm={setTypeForm}
            singleFormData={singleFormData}
            setSingleFormData={setSingleFormData}
            areaData={areaData}
            setAreaData={setAreaData}
            unitLayouts={unitLayouts}
            setUnitLayouts={setUnitLayouts}
            projectCategory={projectCategory}
            setProjectCategory={setProjectCategory}
            projectSubType={projectSubType}
            setProjectSubType={setProjectSubType}
            description={description}
            setDescription={setDescription}
          />
        )}

        {saleType === "Rent" && (
          <RentUploadForm
            typeForm={typeForm}
            setTypeForm={setTypeForm}
            singleFormData={singleFormData}
            setSingleFormData={setSingleFormData}
            areaData={areaData}
            setAreaData={setAreaData}
            unitLayouts={unitLayouts}
            setUnitLayouts={setUnitLayouts}
            description={description}
            setDescription={setDescription}
            roomRentalMode={roomRentalMode}
            rentBatchMode={rentBatchMode}
          />
        )}

        {saleType === "Homestay" && (
          <HomestayUploadForm
            typeForm={typeForm}
            setTypeForm={setTypeForm}
            formData={singleFormData}
            setFormData={setSingleFormData}
          />
        )}

        {saleType === "Hotel/Resort" && (
          <HotelUploadForm
            typeForm={typeForm}
            setTypeForm={setTypeForm}
            formData={singleFormData}
            setFormData={setSingleFormData}
          />
        )}
      </div>

      <div className="mt-8">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "保存中..." : isEditMode ? "保存修改" : "上传房源"}
        </button>
      </div>
    </div>
  );
}
