// pages/my-profile.js
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { supabase } from "../supabaseClient";
import { useUser } from "@supabase/auth-helpers-react";
import { toast } from "react-hot-toast";

import PropertyCard from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";

export default function MyProfile() {
  const router = useRouter();
  const user = useUser();

  const [loading, setLoading] = useState(true);
  const [myProperties, setMyProperties] = useState([]);
  const [deletingId, setDeletingId] = useState(null);

  // ✅ UI: 搜索 & 排序（不动原数据）
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState("new"); // new | old

  const total = useMemo(() => myProperties?.length || 0, [myProperties]);

  const stats = useMemo(() => {
    const published = myProperties.filter((p) => p?.status === "published").length;
    const draft = myProperties.filter((p) => p?.status === "draft").length;

    const latest = myProperties[0]?.created_at || myProperties[0]?.updated_at || null;

    return { published, draft, latest };
  }, [myProperties]);

  const filtered = useMemo(() => {
    const k = (keyword || "").trim().toLowerCase();

    let list = [...(Array.isArray(myProperties) ? myProperties : [])];

    // 搜索：标题 + 地点
    if (k) {
      list = list.filter((p) => {
        const title = (p?.title || "").toLowerCase();
        const location = (p?.location || "").toLowerCase();
        return title.includes(k) || location.includes(k);
      });
    }

    // 排序：最新/最旧
    list.sort((a, b) => {
      const ta = new Date(a?.created_at || a?.updated_at || 0).getTime();
      const tb = new Date(b?.created_at || b?.updated_at || 0).getTime();
      return sort === "new" ? tb - ta : ta - tb;
    });

    return list;
  }, [myProperties, keyword, sort]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchMyProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function fetchMyProperties() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMyProperties(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error("加载我的房源失败");
      setMyProperties([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(property) {
    if (!property?.id) return;

    const ok = confirm(
      `确定要删除这条房源吗？\n\n标题：${property.title || "(无标题)"}\n\n此操作无法撤销。`
    );
    if (!ok) return;

    try {
      setDeletingId(property.id);

      // ✅ 安全：同时加上 user_id 条件，避免误删别人的
      const { error } = await supabase
        .from("properties")
        .delete()
        .eq("id", property.id)
        .eq("user_id", user.id);

      if (error) throw error;

      setMyProperties((prev) => prev.filter((p) => p.id !== property.id));
      toast.success("已删除房源");
    } catch (e) {
      console.error(e);
      toast.error("删除失败（请确认你有权限 / RLS 设置正确）");
    } finally {
      setDeletingId(null);
    }
  }

  if (!user) {
    return (
      <div className="p-4 max-w-6xl mx-auto">
        <div className="border rounded-2xl bg-white p-6">
          <h2 className="text-2xl font-bold mb-2">🏠 我的房源（卖家后台）</h2>
          <p className="text-gray-600 mb-4">请先登录后再查看你上传的房源。</p>
          <Button onClick={() => router.push("/login")}>去登录</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">🏠 我的房源（卖家后台）</h2>
          <p className="text-gray-600 text-sm mt-1">
            你目前共上传 <span className="font-semibold">{total}</span> 条房源
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchMyProperties} disabled={loading}>
            {loading ? "刷新中..." : "刷新"}
          </Button>

          <Button onClick={() => router.push("/upload-property")}>+ 上传新房源</Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border rounded-2xl bg-white p-4">
          <div className="text-xs text-gray-500">总房源</div>
          <div className="text-2xl font-bold mt-1">{total}</div>
        </div>

        <div className="border rounded-2xl bg-white p-4">
          <div className="text-xs text-gray-500">已发布</div>
          <div className="text-2xl font-bold mt-1">{stats.published}</div>
        </div>

        <div className="border rounded-2xl bg-white p-4">
          <div className="text-xs text-gray-500">草稿</div>
          <div className="text-2xl font-bold mt-1">{stats.draft}</div>
        </div>

        <div className="border rounded-2xl bg-white p-4">
          <div className="text-xs text-gray-500">最近时间</div>
          <div className="text-sm font-semibold mt-2 text-gray-800">
            {stats.latest ? new Date(stats.latest).toLocaleString() : "-"}
          </div>
        </div>
      </div>

      {/* Search & sort */}
      <div className="border rounded-2xl bg-white p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-700 mb-2">搜索</div>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="输入标题或地点..."
            className="w-full border rounded-xl px-3 py-2"
          />
        </div>

        <div className="min-w-[180px]">
          <div className="text-sm font-semibold text-gray-700 mb-2">排序</div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full border rounded-xl px-3 py-2 bg-white"
          >
            <option value="new">最新优先</option>
            <option value="old">最旧优先</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-4 text-gray-600">加载中...</div>
      ) : filtered.length === 0 ? (
        <div className="p-6 border rounded-2xl bg-white space-y-3">
          <div className="text-lg font-semibold">
            {myProperties.length === 0 ? "你还没有上传任何房源" : "没有匹配的结果"}
          </div>
          <div className="text-gray-600 text-sm">
            {myProperties.length === 0
              ? "点击右上角「上传新房源」，开始发布你的第一条房源。"
              : "换个关键词试试看，或清空搜索框。"}
          </div>
          <div className="flex gap-2">
            <Button onClick={() => router.push("/upload-property")}>去上传</Button>
            {myProperties.length !== 0 && (
              <Button variant="outline" onClick={() => setKeyword("")}>
                清空搜索
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((property) => (
            <div
              key={property.id}
              className="border rounded-2xl bg-white overflow-hidden shadow-sm"
            >
              {/* 你原本的展示卡片 */}
              <PropertyCard property={property} />

              {/* ✅ 管理按钮区（更像后台） */}
              <div className="p-3 pt-0">
                <div className="grid grid-cols-3 gap-2">
                  <Button asChild className="w-full" variant="outline">
  <Link href={`/property/${property.id}`}>查看</Link>
</Button>

<Button asChild className="w-full" variant="outline">
  <Link href={`/upload-property?edit=1&id=${property.id}`}>编辑</Link>
</Button>

                  <Button
                    className="w-full"
                    variant="destructive"
                    onClick={() => handleDelete(property)}
                    disabled={deletingId === property.id}
                  >
                    {deletingId === property.id ? "删除中..." : "删除"}
                  </Button>
                </div>

                <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                  <div>ID: {property.id}</div>
                  <div>
                    {property.created_at
                      ? new Date(property.created_at).toLocaleDateString()
                      : ""}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
