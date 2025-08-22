import { useState, useEffect } from "react";
import { ReactSortable } from "react-sortablejs";

export default function ImageUpload({ config, images, setImages }) {
  const [localImages, setLocalImages] = useState(images || {});

  useEffect(() => {
    setLocalImages(images || {});
  }, [images, config]);

  // 上传
  const handleImageChange = (e, label) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      isCover: false,
    }));

    const updated = {
      ...localImages,
      [label]: [...(localImages[label] || []), ...newImages],
    };

    setLocalImages(updated);
    setImages(updated);
  };

  // 删除
  const removeImage = (label, index) => {
    const updated = {
      ...localImages,
      [label]: localImages[label].filter((_, i) => i !== index),
    };
    setLocalImages(updated);
    setImages(updated);
  };

  // 设置封面
  const setCover = (label, index) => {
    const updated = {
      ...localImages,
      [label]: localImages[label].map((img, i) => ({
        ...img,
        isCover: i === index,
      })),
    };
    setLocalImages(updated);
    setImages(updated);
  };

  // 动态生成标签
  const generateLabels = () => {
    let labels = [];

    // 卧室
if (config.bedrooms) {
  const val = String(config.bedrooms).toLowerCase();
  if (val === "studio") {
    labels.push("Studio");
  } else {
    const num = Number(config.bedrooms);
    if (!isNaN(num) && num > 0) {
      for (let i = 1; i <= num; i++) {
        labels.push(`卧室${i}`);
      }
    }
  }
}

    // 浴室
    for (let i = 1; i <= (config.bathrooms || 0); i++) {
      labels.push(`浴室${i}`);
    }

    // 厨房
    for (let i = 1; i <= (config.kitchens || 0); i++) {
      labels.push(`厨房${i}`);
    }

    // 客厅
    for (let i = 1; i <= (config.livingRooms || 0); i++) {
      labels.push(`客厅${i}`);
    }

    // 停车位
    for (let i = 1; i <= (config.carpark || 0); i++) {
      labels.push(`停车位${i}`);
    }

    // 储藏室
    for (let i = 1; i <= (config.store || 0); i++) {
      labels.push(`储藏室${i}`);
    }

    // 朝向/风景
    if (config.facing) {
      labels.push("朝向/风景");
    }

    // 设施
    if (config.facilities?.length) {
      config.facilities.forEach((facility) => {
        if (typeof facility === "string") {
          labels.push(facility);
        } else if (facility?.name) {
          labels.push(facility.name);
        }
      });
    }

    // 额外空间（名字 + 数量）
if (config.extraSpaces?.length) {
  config.extraSpaces.forEach((extra) => {
    if (typeof extra === "string") {
      labels.push(extra);
    } else if (extra?.label) {
      const count = extra.count || 1;
      for (let i = 1; i <= count; i++) {
        labels.push(`${extra.label}${i}`);
      }
    }
  });
}

    return [...new Set(labels)];
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
              setImages(updated);
            }}
            className="grid grid-cols-3 gap-2"
          >
            {(localImages[label] || []).map((img, index) => (
              <div key={index} className="relative">
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
