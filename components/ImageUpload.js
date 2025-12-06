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
  if (value === undefined || value === null || value === "") return 0;
  const num = Number(String(value).replace(/,/g, "").trim());
  if (!Number.isFinite(num) || num <= 0) return 0;
  return Math.floor(num);
}

const toArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return [val];
};

const getName = (item) => {
  if (!item) return "";
  if (typeof item === "string") return item;
  return item.label || item.value || item.name || "";
};

// ✅ 跟 UnitLayoutForm 同步的 label 生成逻辑
function getPhotoLabelsFromConfig(config) {
  const safe = config || {};
  let labels = [];

  // 卧室
  if (safe.bedrooms) {
    const raw = String(safe.bedrooms).trim().toLowerCase();
    if (raw === "studio") {
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
    const v = safe.carpark;
    if (v) {
      if (typeof v === "number" || typeof v === "string") {
        const num = toCount(v);
        if (num > 0) labels.push("停车位");
      }
      if (typeof v === "object" && !Array.isArray(v)) {
        const min = toCount(v.min);
        const max = toCount(v.max);
        if (min > 0 || max > 0) labels.push("停车位");
      }
    }
  }

  // 储藏室
  {
    const num = toCount(safe.store);
    for (let i = 1; i <= num; i++) labels.push(`储藏室${i}`);
  }

  // 朝向：前缀「朝向：」
  {
    const arr = toArray(safe.orientation);
    arr.forEach((item) => {
      const n = getName(item);
      if (!n) return;
      labels.push(`朝向：${n}`);
    });
  }

  // 设施：前缀「设施：」
  {
    const arr = toArray(safe.facilities);
    arr.forEach((item) => {
      const n = getName(item);
      if (!n) return;
      labels.push(`设施：${n}`);
    });
  }

  // 额外空间：前缀「额外空间：」，按 count 生成多个
  {
    const arr = toArray(safe.extraSpaces);
    arr.forEach((extra) => {
      if (!extra) return;
      const name = getName(extra);
      if (!name) return;

      const count = toCount(extra.count || 1) || 1;
      if (count <= 1) {
        labels.push(`额外空间：${name}`);
      } else {
        for (let i = 1; i <= count; i++) {
          labels.push(`额外空间：${name}${i}`);
        }
      }
    });
  }

  // 家私：前缀「家私：」，按 count 生成多个
  {
    const arr = toArray(safe.furniture);
    arr.forEach((item) => {
      if (!item) return;
      const name = getName(item);
      if (!name) return;

      const count = toCount(item.count || 1) || 1;
      if (count <= 1) {
        labels.push(`家私：${name}`);
      } else {
        for (let i = 1; i <= count; i++) {
          labels.push(`家私：${name}${i}`);
        }
      }
    });
  }

  // 去重
  labels = [...new Set(labels)];
  if (!labels.length) labels.push("房源照片");

  return labels;
}

export default function ImageUpload({ config, images, setImages }) {
  const safeConfig = config || {};
  const [localImages, setLocalImages] = useState(normalizeImages(images));

  // 外部 images 更新时同步
  useEffect(() => {
    setLocalImages(normalizeImages(images));
  }, [images]);

  const labels = getPhotoLabelsFromConfig(safeConfig);

  const handleFilesChange = (label, fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const newItems = files.map((file, idx) => ({
      id: `${label}-${Date.now()}-${idx}`,
      file,
      url: URL.createObjectURL(file),
    }));

    const current = localImages[label] || [];
    const updated = {
      ...localImages,
      [label]: [...current, ...newItems],
    };

    setLocalImages(updated);
    setImages && setImages(updated);
  };

  const handleSort = (label, newList) => {
    const updated = { ...localImages, [label]: newList };
    setLocalImages(updated);
    setImages && setImages(updated);
  };

  const handleRemove = (label, id) => {
    const current = localImages[label] || [];
    const updated = {
      ...localImages,
      [label]: current.filter((img) => img.id !== id),
    };
    setLocalImages(updated);
    setImages && setImages(updated);
  };

  return (
    <div className="space-y-4 mt-4">
      {labels.map((label) => {
        const list = localImages[label] || [];
        return (
          <div key={label} className="border rounded p-3 space-y-2">
            <p className="font-semibold">{label}</p>

            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFilesChange(label, e.target.files)}
            />

            {list.length > 0 && (
              <ReactSortable
                list={list}
                setList={(newList) => handleSort(label, newList)}
                className="grid grid-cols-3 gap-2 mt-2"
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
