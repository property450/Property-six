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

  const total = useMemo(() => myProperties?.length || 0, [myProperties]);

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

      // ✅ 前端即时移除（更像后台）
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
      <div className="p-4 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold mb-2">🏠 我的房源（卖家后台）</h2>
        <p className="text-gray-600 mb-4">请先登录后再查看你上传的房源。</p>
        <Button onClick={() => router.push("/login")}>去登录</Button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">🏠 我的房源（卖家后台）</h2>
          <p className="text-gray-600 text-sm mt-1">
            你目前共上传 <span className="font-semibold">{total}</span> 条房源
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchMyProperties}
            disabled={loading}
          >
            {loading ? "刷新中..." : "刷新"}
          </Button>

          <Button onClick={() => router.push("/upload-property")}>
            + 上传新房源
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="p-4 text-gray-600">加载中...</div>
      ) : myProperties.length === 0 ? (
        <div className="p-6 border rounded-lg bg-white space-y-3">
          <div className="text-lg font-semibold">你还没有上传任何房源</div>
          <div className="text-gray-600 text-sm">
            点击右上角「上传新房源」，开始发布你的第一条房源。
          </div>
          <div>
            <Button onClick={() => router.push("/upload-property")}>
              去上传
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {myProperties.map((property) => (
            <div key={property.id} className="border rounded-lg bg-white overflow-hidden">
              {/* 你原本的展示卡片 */}
              <PropertyCard property={property} />

              {/* ✅ 管理按钮区 */}
              <div className="p-3 pt-0">
                <div className="flex gap-2">
                  <Link href={`/property/${property.id}`} className="flex-1">
                    <Button className="w-full" variant="outline">
                      查看
                    </Button>
                  </Link>

                  <Link href={`/edit-property/${property.id}`} className="flex-1">
                    <Button className="w-full" variant="outline">
                      编辑
                    </Button>
                  </Link>

                  <Button
                    className="flex-1"
                    variant="destructive"
                    onClick={() => handleDelete(property)}
                    disabled={deletingId === property.id}
                  >
                    {deletingId === property.id ? "删除中..." : "删除"}
                  </Button>
                </div>

                <div className="text-xs text-gray-500 mt-2">
                  ID: {property.id}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
