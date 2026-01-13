// components/ImageUpload.js
"use client";

import { useState, useEffect } from "react";
import { ReactSortable } from "react-sortablejs";

// 只接受「对象」作为图片结构，其它一律当成空对象
function normalizeImages(images) {
  if (images && typeof images === "object" && !Array.isArray(images)) {
    return images;
  }
  return {};
}

// 把各种类型（字符串 / 数字）统一转成正整数
function toCount(value) {
  const n = Number(String(value ?? "").replace(/[^\d]/g, ""));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

// 安全取数组
function toArr(val) {
  return Array.isArray(val) ? val : [];
}

// 从 config（整份表单数据）里生成你要的分组 label
function getPhotoLabelsFromConfig(config) {
  const safe = config || {};
  const labels = [];

  // 卧室（Studio 特殊）
  if (safe.bedrooms !== undefined && safe.bedrooms !== null) {
    const b = String(safe.bedrooms);
    if (b.toLowerCase().includes("studio")) {
      labels.push("Studio");
    } else {
      const num = toCount(safe.bedrooms);
      for (let i = 1; i <= num; i++) labels.push(`卧室${i}`);
    }
  }

  // 浴室
  {
    const num = toCount(safe.bathrooms);
    for (let i = 1; i <= num; i++) labels.push(`浴室${i}`);
  }

  // 厨房
  {
    const num = toCount(safe.kitchens);
    for (let i = 1; i <= num; i++) labels.push(`厨房${i}`);
  }

  // 客厅
  {
    const num = toCount(safe.livingRooms);
    for (let i = 1; i <= num; i++) labels.push(`客厅${i}`);
  }

  // 停车位
  {
    const num = toCount(safe.carparks);
    if (num > 0) labels.push("停车位");
  }

  // 储藏室
  {
    const num = toCount(safe.storerooms);
    for (let i = 1; i <= num; i++) labels.push(`储藏室${i}`);
  }

  // 朝向 / 风景（多选）
  toArr(safe.facing).forEach((f) => {
    if (f) labels.push(String(f));
  });

  // 额外空间 / 家私 / 设施（多选）
  toArr(safe.extraSpaces).forEach((x) => x && labels.push(String(x)));
  toArr(safe.furniture).forEach((x) => x && labels.push(String(x)));
  toArr(safe.facilities).forEach((x) => x && labels.push(String(x)));

  // 如果啥都没有，就给一个默认
  if (!labels.length) labels.push("房源照片");

  return labels;
}

export default function ImageUpload({ config, images, setImages, value, onChange }) {
  // ✅ 兼容两种用法：
  // 1) 旧版：<ImageUpload config={...} images={...} setImages={...} />
  // 2) 新版：<ImageUpload value={...} onChange={setValue} />
  const effectiveConfig = value ?? config ?? {};
  const effectiveImages = images ?? (value && (value.photos ?? value.images)) ?? {};
  const writeBackKey =
    value && typeof value === "object"
      ? ("photos" in value ? "photos" : ("images" in value ? "images" : "photos"))
      : "photos";
  const effectiveSetImages =
    setImages ||
    (onChange
      ? (updated) => {
          const next = { ...(value || {}) };
          next[writeBackKey] = updated;
          onChange(next);
        }
      : null);

  const safeConfig = effectiveConfig || {};
  const [localImages, setLocalImages] = useState(normalizeImages(effectiveImages));

  // 外部 images 更新时同步
  useEffect(() => {
    setLocalImages(normalizeImages(effectiveImages));
  }, [effectiveImages]);

  const labels = getPhotoLabelsFromConfig(safeConfig);

  const handleAdd = async (label, files) => {
    if (!files || !files.length) return;

    const updated = { ...normalizeImages(localImages) };
    const list = Array.isArray(updated[label]) ? [...updated[label]] : [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const url = URL.createObjectURL(file);

      list.push({
        id,
        url,
        file,
      });
    }

    updated[label] = list;
    setLocalImages(updated);
    effectiveSetImages && effectiveSetImages(updated);
  };

  const handleRemove = (label, id) => {
    const updated = { ...normalizeImages(localImages) };
    const list = Array.isArray(updated[label]) ? [...updated[label]] : [];
    updated[label] = list.filter((x) => x.id !== id);
    setLocalImages(updated);
    effectiveSetImages && effectiveSetImages(updated);
  };

  const handleReorder = (label, newList) => {
    const updated = { ...normalizeImages(localImages) };
    updated[label] = Array.isArray(newList) ? newList : [];
    setLocalImages(updated);
    effectiveSetImages && effectiveSetImages(updated);
  };

  return (
    <div className="space-y-6">
      {labels.map((label) => {
        const list = Array.isArray(localImages[label]) ? localImages[label] : [];

        return (
          <div key={label} className="border rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">{label}</div>
              <label className="text-sm text-blue-600 cursor-pointer">
                上传照片
                <input
                  type="file"
                  multiple
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    handleAdd(label, files);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>

            {list.length === 0 ? (
              <div className="text-sm text-gray-500">暂无照片</div>
            ) : (
              <ReactSortable
                list={list}
                setList={(newList) => handleReorder(label, newList)}
                className="grid grid-cols-3 gap-3"
              >
                {list.map((img) => (
                  <div key={img.id} className="relative">
                    <img
                      src={img.url}
                      alt=""
                      className="w-full h-24 object-cover rounded"
                    />
                    <button
                      type="button"
                      className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1 rounded"
                      onClick={() => handleRemove(label, img.id)}
                    >
                      X
                    </button>
                  </div>
                ))}
              </ReactSortable>
            )}
          </div>
        );
      })}
    </div>
  );
}
