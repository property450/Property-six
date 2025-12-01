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

// 把传进来的值，统一变成「数组」方便处理
function toArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  // 单个字符串 / 单个对象，包一层
  return [value];
}

export default function ImageUpload({ config, images, setImages }) {
  // 避免 props 上没传 config 时每次生成新的 {} 导致无限循环
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
    //  朝向 / 风景（可以是字符串，也可以是数组）
    // -------------------------
    {
      const oriArr = toArray(safeConfig.orientation);
      if (oriArr.length > 0) {
        labels.push("朝向/风景");
      }
    }

    // -------------------------
    //  设施
    // -------------------------
    {
      const before = labels.length;
      const facilitiesArr = toArray(safeConfig.facilities);

      facilitiesArr.forEach((facility) => {
        if (!facility) return;
        if (typeof facility === "string") {
          labels.push(facility);
        } else if (facility?.name) {
          labels.push(facility.name);
        } else if (facility?.label) {
          labels.push(facility.label);
        }
      });

      // 如果传进来有东西，但一个名字都没推成功，给一个通用的
      if (!facilitiesArr.length && safeConfig.facilities) {
        labels.push("设施照片");
      } else if (facilitiesArr.length && labels.length === before) {
        labels.push("设施照片");
      }
    }

    // -------------------------
    //  额外空间
    // -------------------------
    {
      const before = labels.length;
      const extraArr = toArray(safeConfig.extraSpaces);

      extraArr.forEach((extra) => {
        if (!extra) return;
        if (typeof extra === "string") {
          labels.push(extra);
        } else if (extra?.label) {
          const count = toCount(extra.count || 1) || 1;
          for (let i = 1; i <= count; i++) {
            labels.push(`${extra.label}${i}`);
          }
        }
      });

      if (!extraArr.length && safeConfig.extraSpaces) {
        labels.push("额外空间照片");
      } else if (extraArr.length && labels.length === before) {
        labels.push("额外空间照片");
      }
    }

    // -------------------------
    //  家私
    // -------------------------
    {
      const before = labels.length;
      const furnArr = toArray(safeConfig.furniture);

      furnArr.forEach((item) => {
        if (!item) return;
        if (typeof item === "string") {
          labels.push(item);
        } else if (item?.label) {
          const count = toCount(item.count || 1) || 1;
          for (let i = 1; i <= count; i++) {
            labels.push(`${item.label}${i}`);
          }
        }
      });

      if (!furnArr.length && safeConfig.furniture) {
        labels.push("家私照片");
      } else if (furnArr.length && labels.length === before) {
        labels.push("家私照片");
      }
    }

    // -------------------------
    //  平面图
    // -------------------------
    {
      const num = toCount(safeConfig.floorPlans);
      for (let i = 1; i <= num; i++) labels.push(`平面图${i}`);
    }

    // -------------------------
    //  公共交通（如果有传 transit，可以加一个）
    // -------------------------
    if (safeConfig.transit) {
      labels.push("公共交通 / 周边配套");
    }

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
