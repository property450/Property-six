// components/ImageUpload.js
import { useState } from "react";

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

// 把任意值转成数组，方便统一处理
function toArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return [val];
}

// 从 string / {label,value,name} 中取一个文本名
function getName(item) {
  if (!item) return "";
  if (typeof item === "string") return item;
  return item.label || item.value || item.name || "";
}

export default function ImageUpload({ config, images, setImages }) {
  const safeConfig = config || {};

  // 只在初始化时同步一次
  const [localImages, setLocalImages] = useState(
    () => normalizeImages(images)
  );

  // 🔁 上传
  const handleImageChange = (e, label) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newImages = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      isCover: false,
    }));

    const current = localImages[label] || [];
    const updated = {
      ...localImages,
      [label]: [...current, ...newImages],
    };

    setLocalImages(updated);
    setImages && setImages(updated);
  };

  // ❌ 删除
  const removeImage = (label, index) => {
    const current = localImages[label] || [];
    const updated = {
      ...localImages,
      [label]: current.filter((_, i) => i !== index),
    };
    setLocalImages(updated);
    setImages && setImages(updated);
  };

  // ⭐ 设置封面
  const setCover = (label, index) => {
    const current = localImages[label] || [];
    const updated = {
      ...localImages,
      [label]: current.map((img, i) => ({
        ...img,
        isCover: i === index,
      })),
    };

    setLocalImages(updated);
    setImages && setImages(updated);
  };

  // ⭐ 根据房型数据动态生成标签
  const generateLabels = () => {
    let labels = [];

    // -------------------------
    //  卧室
    // -------------------------
    if (safeConfig.bedrooms) {
      const raw = String(safeConfig.bedrooms).trim().toLowerCase();
      if (raw === "studio") {
        labels.push("Studio");
      } else {
        const num = toCount(safeConfig.bedrooms);
        for (let i = 1; i <= num; i++) {
          labels.push(`卧室${i}`);
        }
      }
    }

    // -------------------------
    //  浴室
    // -------------------------
    {
      const num = toCount(safeConfig.bathrooms);
      for (let i = 1; i <= num; i++) {
        labels.push(`浴室${i}`);
      }
    }

    // -------------------------
    //  厨房
    // -------------------------
    {
      const num = toCount(safeConfig.kitchens);
      for (let i = 1; i <= num; i++) labels.push(`厨房${i}`);
    }

    // -------------------------
    //  客厅
    // -------------------------
    {
      const num = toCount(safeConfig.livingRooms);
      for (let i = 1; i <= num; i++) labels.push(`客厅${i}`);
    }

    // -------------------------
    //  停车位（只要有值，就至少 1 个「停车位」）
    // -------------------------
    {
      const v = safeConfig.carpark;
      let added = false;

      if (v) {
        // single: "2" / 2
        if (typeof v === "number" || typeof v === "string") {
          const num = toCount(v);
          if (num > 0) {
            labels.push("停车位");
            added = true;
          }
        }

        // range: { min, max }
        if (!added && typeof v === "object" && !Array.isArray(v)) {
          const min = toCount(v.min);
          const max = toCount(v.max);
          if (min > 0 || max > 0) {
            labels.push("停车位");
            added = true;
          }
        }
      }

      // 如果有 carpark 值，但上面没识别出来，也补一个
      if (!added && v !== undefined && v !== null && v !== "") {
        labels.push("停车位");
      }
    }

    // -------------------------
    //  储藏室
    // -------------------------
    {
      const num = toCount(safeConfig.store);
      for (let i = 1; i <= num; i++) labels.push(`储藏室${i}`);
    }

    // -------------------------
    //  朝向（多选/单选都支持）
    // -------------------------
    {
      const arr = toArray(safeConfig.orientation);
      arr.forEach((item) => {
        const name = getName(item);
        if (name) labels.push(`朝向：${name}`);
      });
    }

    // -------------------------
    //  设施：每个设施一个上传框
    // -------------------------
    {
      const arr = toArray(safeConfig.facilities);
      arr.forEach((item) => {
        const name = getName(item);
        if (name) labels.push(`设施：${name}`);
      });
    }

    // -------------------------
    //  额外空间：带数量的，拆成多个上传框
    // -------------------------
    {
      const arr = toArray(safeConfig.extraSpaces);
      arr.forEach((extra) => {
        if (!extra) return;

        if (typeof extra === "string") {
          labels.push(`额外空间：${extra}`);
          return;
        }

        const name = getName(extra);
        if (!name) return;

        const c = toCount(extra.count || 1) || 1;
        if (c <= 1) {
          labels.push(`额外空间：${name}`);
        } else {
          for (let i = 1; i <= c; i++) {
            labels.push(`额外空间：${name}${i}`);
          }
        }
      });
    }

    // -------------------------
    //  家私：带数量的，拆成多个上传框
    // -------------------------
    {
      const arr = toArray(safeConfig.furniture);
      arr.forEach((item) => {
        if (!item) return;

        if (typeof item === "string") {
          labels.push(`家私：${item}`);
          return;
        }

        const name = getName(item);
        if (!name) return;

        const c = toCount(item.count || 1) || 1;
        if (c <= 1) {
          labels.push(`家私：${name}`);
        } else {
          for (let i = 1; i <= c; i++) {
            labels.push(`家私：${name}${i}`);
          }
        }
      });
    }

    // ❌ 不生成「公共交通 / 周边配套」上传框

    // 去重
    labels = [...new Set(labels)];

    // ⭐兜底：如果一个都没有，放一个「房源照片」
    if (!labels.length) labels.push("房源照片");

    return labels;
  };

  const labels = generateLabels();

  return (
    <div className="space-y-6">
      {labels.map((label) => (
        <div key={label} className="space-y-2 border rounded p-2">
          <p className="font-semibold">{label}</p>

          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleImageChange(e, label)}
          />

          {/* 简单 grid 展示，不用 ReactSortable，先保证不报错 */}
          <div className="grid grid-cols-3 gap-2">
            {(localImages[label] || []).map((img, index) => (
              <div key={img.url || index} className="relative">
                <img
                  src={img.url}
                  alt={`preview-${index}`}
                  className={`w-full h-32 object-cover rounded ${
                    img.isCover ? "border-4 border-green-500" : ""
                  }`}
                />
                <button
                  type="button"
                  className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1 rounded"
                  onClick={() => removeImage(label, index)}
                >
                  X
                </button>
                <button
                  type="button"
                  className="absolute bottom-1 left-1 bg-black text-white text-xs px-1 rounded"
                  onClick={() => setCover(label, index)}
                >
                  {img.isCover ? "封面" : "设为封面"}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
