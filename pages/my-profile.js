// pages/my-profile.js
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../supabaseClient";
import { useUser } from "@supabase/auth-helpers-react";
import { toast } from "react-hot-toast";

// ✅ 只引入：总入口 VM（你已经创建了）
import { getCardVM } from "../utils/property/getCardVM";

/* =========================
   UI 辅助（不属于表单逻辑）
========================= */
function isNonEmpty(v) {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim() !== "";
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v).length > 0;
  return true;
}

function deepGet(obj, path) {
  if (!obj || !path) return undefined;
  const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean);
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function pickAny(obj, candidates) {
  if (!obj) return "";
  for (const c of candidates) {
    const v = c.includes(".") || c.includes("[") ? deepGet(obj, c) : obj?.[c];
    if (isNonEmpty(v)) return v;
  }
  return "";
}

function extractNumeric(v) {
  if (!isNonEmpty(v)) return NaN;
  const n = Number(String(v).replace(/,/g, "").replace(/[^\d.]/g, ""));
  return Number.isNaN(n) ? NaN : n;
}

/* =========================
   UI：没选就 "-"
========================= */
function MetaLineDash({ label, value }) {
  const show = isNonEmpty(value) ? String(value) : "-";
  return (
    <div className="text-sm text-gray-700 leading-6">
      <span className="text-gray-500">{label}：</span>
      <span className="text-gray-900">{show}</span>
    </div>
  );
}

/* =========================
   ✅ 发布状态（用于“已发布/草稿”区块）
   不改你数据库结构：尽量兼容多种字段名
========================= */
function isPublishedProperty(p) {
  const v =
    p?.published ??
    p?.is_published ??
    p?.isPublished ??
    p?.status ??
    p?.listing_status ??
    p?.publish_status;
  if (typeof v === "boolean") return v;
  const s = String(v || "").toLowerCase().trim();
  if (!s) return true; // 没字段就默认当“已发布”，避免你页面变空
  if (["published", "publish", "active", "online", "live", "已发布"].includes(s)) return true;
  if (["draft", "inactive", "offline", "草稿", "未发布"].includes(s)) return false;
  return true;
}

/* =========================
   Card（卖家后台卡片）
   ✅ 只渲染 VM，不再自己 pick 表单字段
========================= */
function SellerPropertyCard({ rawProperty, onView, onEdit, onDelete }) {
  const vm = useMemo(() => {
    try {
      return getCardVM(rawProperty);
    } catch (e) {
      console.error("getCardVM error:", e);
      // 兜底：至少别让页面炸
      return {
        title: pickAny(rawProperty, ["title"]) || "（未命名房源）",
        address: pickAny(rawProperty, ["address"]) || "-",
        priceText: "-",
        bedrooms: "-",
        bathrooms: "-",
        carparks: "-",
        usage: "-",
        propertyTitle: "-",
        propertyStatus: pickAny(rawProperty, ["propertyStatus", "property_status", "propertystatus"]) || "-",
        affordableText: "-",
        tenure: "-",
        category: "-",
        subType: "-",
        storeys: "-",
        propSubtypes: "-",
        transitText: "-",
        completedYear: "-",
        expectedText: "-",
        showStoreys: false,
        showSubtype: false,
        isNewProject: false,
        isCompletedUnit: false,
        saleType: pickAny(rawProperty, ["saleType", "sale_type", "saletype"]) || "-",
      };
    }
  }, [rawProperty]);

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="min-w-0">
        <div className="text-lg font-semibold text-gray-900 truncate">{vm.title}</div>
        <div className="text-sm text-gray-600 mt-1 truncate">{vm.address}</div>

        <div className="text-base font-semibold text-blue-700 mt-2">{vm.priceText}</div>

        <div className="text-sm text-gray-700 mt-2 flex flex-wrap gap-x-4 gap-y-1">
          <span>🛏 {isNonEmpty(vm.bedrooms) ? String(vm.bedrooms) : "-"}</span>
          <span>🛁 {isNonEmpty(vm.bathrooms) ? String(vm.bathrooms) : "-"}</span>
          <span>🚗 {isNonEmpty(vm.carparks) ? String(vm.carparks) : "-"}</span>
        </div>

        <div className="mt-3 space-y-1">
          <MetaLineDash label="Sale / Rent" value={vm.saleType ? String(vm.saleType).toUpperCase() : "-"} />
          <MetaLineDash label="Property Usage" value={vm.usage} />
          <MetaLineDash label="Property Title" value={vm.propertyTitle} />
          <MetaLineDash label="Property Status / Sale Type" value={vm.propertyStatus} />
          <MetaLineDash label="Affordable Housing" value={vm.affordableText} />
          <MetaLineDash label="Tenure Type" value={vm.tenure} />

          <MetaLineDash label="Property Category" value={isNonEmpty(vm.category) ? vm.category : "-"} />
          <MetaLineDash label="Sub Type" value={isNonEmpty(vm.subType) ? vm.subType : "-"} />

          {vm.showStoreys && <MetaLineDash label="Storeys" value={isNonEmpty(vm.storeys) ? vm.storeys : "-"} />}

          {vm.showSubtype && (
            <MetaLineDash
              label="Property Subtype"
              value={
                Array.isArray(vm.propSubtypes)
                  ? vm.propSubtypes.length
                    ? vm.propSubtypes.join(", ")
                    : "-"
                  : isNonEmpty(vm.propSubtypes)
                    ? vm.propSubtypes
                    : "-"
              }
            />
          )}

          <MetaLineDash label="你的产业步行能到达公共交通吗？" value={vm.transitText} />

          {vm.isNewProject ? (
            <MetaLineDash label="预计完成年份" value={vm.expectedText} />
          ) : vm.isCompletedUnit ? (
            <MetaLineDash label="完成年份" value={isNonEmpty(vm.completedYear) ? vm.completedYear : "-"} />
          ) : (
            <>
              <MetaLineDash label="完成年份" value={isNonEmpty(vm.completedYear) ? vm.completedYear : "-"} />
              <MetaLineDash label="预计完成年份" value={vm.expectedText} />
            </>
          )}

          {/* ✅ Auction Property 之类的新增字段，后面你在对应 vm 文件加了，这里也可以直接渲染（不影响其他表单） */}
          {isNonEmpty(vm.auctionDateText) && <MetaLineDash label="Auction Date" value={vm.auctionDateText} />}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <button
          onClick={() => onView(rawProperty)}
          className="h-11 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
        >
          查看
        </button>
        <button
          onClick={() => onEdit(rawProperty)}
          className="h-11 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
        >
          编辑
        </button>
        <button
          onClick={() => onDelete(rawProperty)}
          className="h-11 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
        >
          删除
        </button>
      </div>
    </div>
  );
}

/* =========================
   Page
========================= */
export default function MyProfilePage() {
  const router = useRouter();
  const user = useUser();

  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [sortKey, setSortKey] = useState("latest");

  // ✅ 恢复“已发布/草稿”区块（不依赖你数据库一定有字段）
  const [tab, setTab] = useState("published"); // published | draft | all

  const fetchMyProperties = async () => {
    if (!user?.id) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("fetchMyProperties error:", error);
      toast.error(error.message || "加载失败");
      setLoading(false);
      return;
    }

    setProperties(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchMyProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const publishedCount = useMemo(() => properties.filter((p) => isPublishedProperty(p)).length, [properties]);
  const draftCount = useMemo(() => properties.filter((p) => !isPublishedProperty(p)).length, [properties]);

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    let list = properties;

    // tab filter
    if (tab === "published") list = list.filter((p) => isPublishedProperty(p));
    if (tab === "draft") list = list.filter((p) => !isPublishedProperty(p));

    // keyword filter
    if (k) {
      list = list.filter((p) => {
        const t = pickAny(p, ["title"]);
        const a = pickAny(p, ["address"]);
        return String(t || "").toLowerCase().includes(k) || String(a || "").toLowerCase().includes(k);
      });
    }

    const getPriceNum = (p) => {
      const n = extractNumeric(p?.price_max ?? p?.price ?? p?.price_min);
      return Number.isNaN(n) ? 0 : n;
    };

    if (sortKey === "latest") {
      list = [...list].sort(
        (a, b) => new Date(b?.updated_at || b?.created_at || 0) - new Date(a?.updated_at || a?.created_at || 0)
      );
    } else if (sortKey === "oldest") {
      list = [...list].sort(
        (a, b) => new Date(a?.updated_at || a?.created_at || 0) - new Date(b?.updated_at || b?.created_at || 0)
      );
    } else if (sortKey === "priceHigh") {
      list = [...list].sort((a, b) => getPriceNum(b) - getPriceNum(a));
    } else if (sortKey === "priceLow") {
      list = [...list].sort((a, b) => getPriceNum(a) - getPriceNum(b));
    }

    return list;
  }, [properties, keyword, sortKey, tab]);

  const onView = (p) => router.push(`/property/${p.id}`);
  const onEdit = (p) => router.push(`/upload-property?edit=1&id=${p.id}`);

  const onDelete = async (p) => {
    if (!confirm("确定要删除这个房源吗？")) return;

    const { error } = await supabase.from("properties").delete().eq("id", p.id);
    if (error) {
      console.error("delete error:", error);
      toast.error(error.message || "删除失败");
      return;
    }

    toast.success("已删除");
    fetchMyProperties();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="text-2xl font-bold text-gray-900">我的房源（卖家后台）</div>

      {/* ✅ 已发布/草稿 */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => setTab("published")}
          className={`h-10 px-4 rounded-xl border ${
            tab === "published"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
          }`}
        >
          已发布（{publishedCount}）
        </button>
        <button
          onClick={() => setTab("draft")}
          className={`h-10 px-4 rounded-xl border ${
            tab === "draft"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
          }`}
        >
          草稿（{draftCount}）
        </button>
        <button
          onClick={() => setTab("all")}
          className={`h-10 px-4 rounded-xl border ${
            tab === "all"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
          }`}
        >
          全部（{properties.length}）
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
        <div className="md:col-span-3">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="输入标题或地点..."
            className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div className="md:col-span-1">
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="latest">最新优先</option>
            <option value="oldest">最旧优先</option>
            <option value="priceHigh">价格：高到低</option>
            <option value="priceLow">价格：低到高</option>
          </select>
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="text-gray-600">加载中...</div>
        ) : filtered.length === 0 ? (
          <div className="text-gray-600">没有符合条件的房源。</div>
        ) : (
          <div className="space-y-4">
            {filtered.map((p) => (
              <SellerPropertyCard key={p.id} rawProperty={p} onView={onView} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
