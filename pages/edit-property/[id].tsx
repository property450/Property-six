"use client";

import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient";
import { useUser } from "@supabase/auth-helpers-react";
import dynamic from "next/dynamic";
import TypeSelector from "../../components/TypeSelector";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import Link from "next/link";

const MapPicker = dynamic(() => import("../../components/MapPicker"), {
  ssr: false,
});

type TypeValue = {
  category: string;
  group?: string;
  type?: string;
};

export default function EditProperty() {
  const router = useRouter();
  const { id } = router.query;
  const user = useUser();

  const [property, setProperty] = useState<any>(null);
  const [images, setImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [updating, setUpdating] = useState(false);

  function parseTypeString(str?: string): TypeValue {
    const parts = (str || "").split(" > ");
    return {
      category: parts[0] || "",
      group: parts[1] || "",
      type: parts[2] || "",
    };
  }

  function buildTypeString(obj: TypeValue) {
    return [obj.category, obj.group, obj.type].filter(Boolean).join(" > ");
  }

  useEffect(() => {
    if (id) fetchProperty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchProperty() {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      alert("无法加载房源：" + error.message);
      return;
    }

    if (data) {
      setProperty(data);
      setImages(Array.isArray(data.image_urls) ? data.image_urls : []);
    } else {
      alert("无法加载房源");
    }
  }

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setProperty((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: any) => {
    const files = Array.from(e.target.files || []) as File[];
    setNewImages(files);
  };

  const getStoragePathFromUrl = (url: string) => {
    const parts = url.split("/");
    const index = parts.findIndex((p) => p === "property-images");
    return index === -1 ? "" : parts.slice(index + 1).join("/");
  };

  const removeImage = async (index: number) => {
    const confirmDelete = confirm("确定要删除这张图片吗？此操作将永久移除");
    if (!confirmDelete) return;

    const imgUrl = images[index];
    const path = getStoragePathFromUrl(imgUrl);

    // 若拿不到 path，就只从列表移除（避免卡死）
    if (!path) {
      setImages((prev) => prev.filter((_, i) => i !== index));
      return;
    }

    const { error: deleteError } = await supabase.storage
      .from("property-images")
      .remove([path]);

    if (deleteError) {
      alert("删除失败：" + deleteError.message);
      return;
    }

    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const reordered = [...images];
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setImages(reordered);
  };

  const setCoverImage = (index: number) => {
    setImages((prev) => [prev[index], ...prev.filter((_, i) => i !== index)]);
  };

  const handleUpdate = async (e: any) => {
    e.preventDefault();
    if (!property) return;

    setUpdating(true);

    try {
      const updatedImageUrls = [...images];

      for (const file of newImages) {
        const ext = file.name.split(".").pop() || "jpg";
        const safeRand = Math.random().toString(16).slice(2);
        const fileName = `${Date.now()}-${safeRand}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("property-images")
          .upload(fileName, file);

        if (uploadError) {
          alert("上传失败：" + uploadError.message);
          setUpdating(false);
          return;
        }

        const url = supabase.storage
          .from("property-images")
          .getPublicUrl(fileName).data.publicUrl;

        updatedImageUrls.push(url);
      }

      const { error: updateError } = await supabase
        .from("properties")
        .update({
          ...property,
          price: property.price === "" ? null : Number(property.price),
          bedrooms: property.bedrooms === "" ? null : Number(property.bedrooms),
          bathrooms:
            property.bathrooms === "" ? null : Number(property.bathrooms),
          carparks: property.carparks === "" ? null : Number(property.carparks),
          storerooms:
            property.storerooms === "" ? null : Number(property.storerooms),
          image_urls: updatedImageUrls,
        })
        .eq("id", id);

      if (updateError) {
        alert("更新失败：" + updateError.message);
      } else {
        alert("房源已更新");
        router.push("/my-profile");
      }
    } finally {
      setUpdating(false);
    }
  };

  // ✅ 更友好的加载/权限提示
  if (!user) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="border rounded-xl bg-white p-5">
          <div className="text-xl font-bold mb-2">请先登录</div>
          <div className="text-gray-600 mb-4">登录后才可以编辑你的房源。</div>
          <Link href="/login" className="inline-block">
            <button className="px-4 py-2 rounded-lg bg-black text-white">
              去登录
            </button>
          </Link>
        </div>
      </div>
    );
  }

  if (!property) {
    return <div className="p-6 max-w-3xl mx-auto text-gray-600">加载中...</div>;
  }

  if (user.id !== property.user_id) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="border rounded-xl bg-white p-5 text-red-600 font-semibold">
          你没有权限编辑此房源
        </div>
      </div>
    );
  }

  const typeValue = useMemo(
    () => parseTypeString(property.type),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [property?.type]
  );

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">编辑房源</h1>
          <p className="text-sm text-gray-600 mt-1">
            你可以修改文字、价格、类型、地图定位以及图片排序/封面。
          </p>
        </div>

        <div className="flex gap-2">
          <Link href={`/property/${property.id}`}>
            <button className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50">
              查看详情
            </button>
          </Link>
          <Link href="/my-profile">
            <button className="px-4 py-2 rounded-lg bg-black text-white">
              返回后台
            </button>
          </Link>
        </div>
      </div>

      <form onSubmit={handleUpdate} className="space-y-4">
        <div className="border rounded-xl bg-white p-4 space-y-3">
          <div className="text-sm font-semibold text-gray-700">基础信息</div>

          <input
            name="title"
            value={property.title || ""}
            onChange={handleChange}
            className="border p-2 w-full rounded-lg"
            placeholder="房产标题"
          />

          <textarea
            name="description"
            value={property.description || ""}
            onChange={handleChange}
            className="border p-2 w-full rounded-lg min-h-[120px]"
            placeholder="描述"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              name="price"
              value={property.price ?? ""}
              onChange={handleChange}
              type="number"
              className="border p-2 w-full rounded-lg"
              placeholder="价格"
            />

            <input
              name="location"
              value={property.location || ""}
              onChange={handleChange}
              className="border p-2 w-full rounded-lg"
              placeholder="地点"
            />
          </div>

          <div className="pt-2">
            <div className="text-sm font-semibold text-gray-700 mb-2">
              房源类型
            </div>
            <TypeSelector
              value={typeValue}
              onChange={(val: any) =>
                setProperty((p: any) => ({ ...p, type: buildTypeString(val) }))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <input
              name="bedrooms"
              value={property.bedrooms ?? ""}
              onChange={handleChange}
              type="number"
              className="border p-2 rounded-lg"
              placeholder="房间数"
            />
            <input
              name="bathrooms"
              value={property.bathrooms ?? ""}
              onChange={handleChange}
              type="number"
              className="border p-2 rounded-lg"
              placeholder="浴室数"
            />
            <input
              name="carparks"
              value={property.carparks ?? ""}
              onChange={handleChange}
              type="number"
              className="border p-2 rounded-lg"
              placeholder="车位数"
            />
            <input
              name="storerooms"
              value={property.storerooms ?? ""}
              onChange={handleChange}
              type="number"
              className="border p-2 rounded-lg"
              placeholder="储藏室数"
            />
          </div>
        </div>

        <div className="border rounded-xl bg-white p-4 space-y-3">
          <div className="text-sm font-semibold text-gray-700">地图定位</div>
          <MapPicker
            lat={property.lat}
            lng={property.lng}
            onPick={(lat: number, lng: number) =>
              setProperty((p: any) => ({ ...p, lat, lng }))
            }
          />
        </div>

        <div className="border rounded-xl bg-white p-4 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-sm font-semibold text-gray-700">
                图片管理（拖拽排序 / 设封面 / 删除）
              </div>
              <div className="text-xs text-gray-500 mt-1">
                第一张会作为封面显示
              </div>
            </div>

            <label className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 cursor-pointer">
              + 上传新图片
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>

          {images.length === 0 ? (
            <div className="text-sm text-gray-600">目前没有图片。</div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="images">
                {(provided) => (
                  <div
                    className="grid grid-cols-2 sm:grid-cols-3 gap-2"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {images.map((url, i) => (
                      <Draggable key={url} draggableId={url} index={i}>
                        {(provided) => (
                          <div
                            className="relative group"
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <img
                              loading="lazy"
                              src={url}
                              className="w-full h-32 object-cover rounded-lg border"
                              alt=""
                            />

                            {/* 封面标识 */}
                            {i === 0 && (
                              <div className="absolute top-2 left-2 text-xs bg-black text-white px-2 py-1 rounded">
                                封面
                              </div>
                            )}

                            {/* 操作按钮 */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition flex items-end justify-between p-2">
                              <button
                                type="button"
                                onClick={() => setCoverImage(i)}
                                className="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600"
                                title="设为封面"
                              >
                                设封面
                              </button>

                              <button
                                type="button"
                                onClick={() => removeImage(i)}
                                className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                                title="删除图片"
                              >
                                删除
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>

        <button
          type="submit"
          disabled={updating}
          className="bg-blue-600 text-white px-4 py-3 w-full rounded-xl hover:bg-blue-700 disabled:opacity-60"
        >
          {updating ? "更新中..." : "保存更改"}
        </button>
      </form>
    </div>
  );
}
