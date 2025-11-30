// components/ImageUpload.js
import { useState } from "react";
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

export default function ImageUpload({ config, images, setImages }) {
  // 避免 props 上没传 config 时每次生成新的 {} 导致无限循环
  const safeConfig = config || {};

  // 只在初次渲染时，用父组件传进来的 images 初始化一次
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

  // 动态生成标签
  const generateLabels = () => {
    let labels = [];

    // 卧室
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

    // 浴室
    {
      const num = toCount(safeConfig.bathrooms);
      for (let i = 1; i <= num; i++) {
        labels.push(`浴室${i}`);
      }
    }

    // 厨房
    {
      const num = toCount(safeConfig.kitchens);
      for (let i = 1; i <= num; i++) {
        labels.push(`厨房${i}`);
      }
    }

    // 客厅
    {
      const num = toCount(safeConfig.livingRooms);
      for (let i = 1; i <= num; i++) {
        labels.push(`客厅${i}`);
      }
    }

    // 停车位 —— 你说 new project 不要，所以我们只靠 config.carpark 来决定
    // subsale 那边如果你还传 carpark，这里仍然会正常生成
    {
      const num = toCount(safeConfig.carpark);
      for (let i = 1; i <= num; i++) {
        labels.push(`停车位${i}`);
      }
    }

    // 储藏室
    {
      const num = toCount(safeConfig.store);
      for (let i = 1; i <= num; i++) {
        labels.push(`储藏室${i}`);
      }
    }

    // 朝向/风景
    if (safeConfig.orientation) {
      labels.push("朝向/风景");
    }

    // 设施
    if (safeConfig.facilities?.length) {
      safeConfig.facilities.forEach((facility) => {
        if (typeof facility === "string") {
          labels.push(facility);
        } else if (facility?.name) {
          labels.push(facility.name);
        }
      });
    }

    // 额外空间（名字 + 数量）
    if (safeConfig.extraSpaces?.length) {
      safeConfig.extraSpaces.forEach((extra) => {
        if (typeof extra === "string") {
          labels.push(extra);
        } else if (extra?.label) {
          const count = toCount(extra.count || 1) || 1;
          for (let i = 1; i <= count; i++) {
            labels.push(`${extra.label}${i}`);
          }
        }
      });
    }

    // 家私（名字 + 数量）
    if (safeConfig.furniture?.length) {
      safeConfig.furniture.forEach((extra) => {
        if (typeof extra === "string") {
          labels.push(extra);
        } else if (extra?.label) {
          const count = toCount(extra.count || 1) || 1;
          for (let i = 1; i <= count; i++) {
            labels.push(`${extra.label}${i}`);
          }
        }
      });
    }

    // 平面图
    {
      const num = toCount(safeConfig.floorPlans);
      for (let i = 1; i <= num; i++) {
        labels.push(`平面图${i}`);
      }
    }

    // 去重
    labels = [...new Set(labels)];

    // ⭐ 兜底：如果一个 label 都没有，至少给一个“房源照片”
    if (!labels.length) {
      labels.push("房源照片");
    }

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

          <ReactSortable
            list={localImages[label] || []}
            setList={(newList) => {
              const updated = { ...localImages, [label]: newList };
              setLocalImages(updated);
              setImages && setImages(updated);
            }}
            className="grid grid-cols-3 gap-2"
          >
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
          </ReactSortable>
        </div>
      ))}
    </div>
  );
}
