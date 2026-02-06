// pages/my-profile.js
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../supabaseClient";
import { useUser } from "@supabase/auth-helpers-react";
import { toast } from "react-hot-toast";

import { getCardVM } from "../utils/property/getCardVM";
import { isNonEmpty, pickAny, extractNumeric } from "../utils/property/pickers";
import { isNewProjectStatus, isCompletedUnitStatus } from "../utils/property/resolveActiveForm";

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
   Card（卖家后台卡片）
========================= */
function SellerPropertyCard({ rawProperty, onView, onEdit, onDelete }) {
  const vm = useMemo(() => getCardVM(rawProperty), [rawProperty]);

  const title = vm.title;
  const address = vm.address;

  const bedrooms = vm.bedrooms;
  const bathrooms = vm.bathrooms;
  const carparks = vm.carparks;

  const usage = vm.usage;
  const propertyTitle = vm.propertyTitle;
  const propertyStatus = vm.propertyStatus;
  const tenure = vm.tenure;

  const category = vm.category;
  const subType = vm.subType;
  const storeys = vm.storeys;
  const propSubtypes = vm.propSubtypes;

  const affordableText = vm.affordableText;
  const transitText = vm.transitText;
  const priceText = vm.priceText;

  const expectedText = vm.expectedText;
  const completedYear = vm.completedYear;

  const showStoreys = vm.showStoreys;
  const showSubtype = vm.showSubtype;

  const isNewProject = isNewProjectStatus(propertyStatus);
  const isCompletedUnit = isCompletedUnitStatus(propertyStatus);

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="min-w-0">
        <div className="text-lg font-semibold text-gray-900 truncate">{title}</div>
        <div className="text-sm text-gray-600 mt-1 truncate">{address}</div>

        <div className="text-base font-semibold text-blue-700 mt-2">{priceText}</div>

        <div className="text-sm text-gray-700 mt-2 flex flex-wrap gap-x-4 gap-y-1">
          <span>🛏 {isNonEmpty(bedrooms) ? String(bedrooms) : "-"}</span>
          <span>🛁 {isNonEmpty(bathrooms) ? String(bathrooms) : "-"}</span>
          <span>🚗 {carparks}</span>
        </div>

        <div className="mt-3 space-y-1">
          <MetaLineDash label="Sale / Rent" value={vm.active?.saleType ? String(vm.active.saleType).toUpperCase() : "-"} />
          <MetaLineDash label="Property Usage" value={usage} />
          <MetaLineDash label="Property Title" value={propertyTitle} />
          <MetaLineDash label="Property Status / Sale Type" value={propertyStatus} />
          <MetaLineDash label="Affordable Housing" value={affordableText} />
          <MetaLineDash label="Tenure Type" value={tenure} />

          <MetaLineDash label="Property Category" value={isNonEmpty(category) ? category : "-"} />
          <MetaLineDash label="Sub Type" value={isNonEmpty(subType) ? subType : "-"} />

          {showStoreys && <MetaLineDash label="Storeys" value={isNonEmpty(storeys) ? storeys : "-"} />}
          {showSubtype && (
            <MetaLineDash
              label="Property Subtype"
              value={
                Array.isArray(propSubtypes)
                  ? (propSubtypes.length ? propSubtypes.join(", ") : "-")
                  : (isNonEmpty(propSubtypes) ? propSubtypes : "-")
              }
            />
          )}

          <MetaLineDash label="你的产业步行能到达公共交通吗？" value={transitText} />

          {isNewProject ? (
            <MetaLineDash label="预计完成年份" value={expectedText} />
          ) : isCompletedUnit ? (
            <MetaLineDash label="完成年份" value={isNonEmpty(completedYear) ? completedYear : "-"} />
          ) : (
            <>
              <MetaLineDash label="完成年份" value={isNonEmpty(completedYear) ? completedYear : "-"} />
              <MetaLineDash label="预计完成年份" value={expectedText} />
            </>
          )}
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

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    let list = properties;

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
        (a, b) => new Date(a?.updated_at || a?.created_at || 0) - new Date(a?.updated_at || a?.created_at || 0)
      );
    } else if (sortKey === "priceHigh") {
      list = [...list].sort((a, b) => getPriceNum(b) - getPriceNum(a));
    } else if (sortKey === "priceLow") {
      list = [...list].sort((a, b) => getPriceNum(a) - getPriceNum(b));
    }

    return list;
  }, [properties, keyword, sortKey]);

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
