import { useState, useEffect } from "react";
import { ReactSortable } from "react-sortablejs"; // npm install react-sortablejs

export default function ImageUpload({ config, images, setImages }) {
  // 确保 images 是对象
  const [localImages, setLocalImages] = useState(images || {});
  const [customExtras, setCustomExtras] = useState([]); // { name: "瑜伽室", count: 2 }
  const [customFacilities, setCustomFacilities] = useState([]); // ["电影院"]

  // 输入框状态
  const [extraName, setExtraName] = useState("");
  const [extraCount, setExtraCount] = useState(1);
  const [facilityName, setFacilityName] = useState("");

  // 当 config 或 images 变化时，保持同步
  useEffect(() => {
    setLocalImages(images || {});
  }, [images, config]);

  // 处理上传
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

  // 删除图片
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

  // 添加自定义额外空间
  const addCustomExtra = () => {
    if (!extraName.trim() || extraCount < 1) return;
    setCustomExtras((prev) => [...prev, { name: extraName.trim(), count: extraCount }]);
    setExtraName("");
    setExtraCount(1);
  };

  // 添加自定义设施
  const addCustomFacility = () => {
    if (!facilityName.trim()) return;
    setCustomFacilities((prev) => [...prev, facilityName.trim()]);
    setFacilityName("");
  };

  // 生成要渲染的区块
  const generateLabels = () => {
    let labels = [];

    // 卧室
    for (let i = 1; i <= (config.bedrooms || 0); i++) {
      labels.push(`卧室${i}`);
    }

    // 浴室
    for (let i = 1; i <= (config.bathrooms || 0); i++) {
      labels.push(`浴室${i}`);
    }

    // 停车位
    for (let i = 1; i <= (config.parking || 0); i++) {
      labels.push(`停车位${i}`);
    }

    // 储藏室
    for (let i = 1; i <= (config.storage || 0); i++) {
      labels.push(`储藏室${i}`);
    }

    // 朝向/风景
    if (config.orientation) {
      labels.push("朝向/风景");
    }

    // ✅ 手动输入的设施
    if (customFacilities.length) {
      customFacilities.forEach((facility) => labels.push(facility));
    }

    // ✅ 手动输入的额外空间
    if (customExtras.length) {
      customExtras.forEach((extra) => {
        for (let i = 1; i <= extra.count; i++) {
          labels.push(`${extra.name}${i}`);
        }
      });
    }

    // 去重
    return [...new Set(labels)];
  };

  const labels = generateLabels();

  return (
    <div className="space-y-6">
      {/* 添加自定义额外空间 */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="额外空间名称，如 瑜伽室"
          value={extraName}
          onChange={(e) => setExtraName(e.target.value)}
          className="border rounded px-2 py-1 flex-1"
        />
        <input
          type="number"
          min="1"
          value={extraCount}
          onChange={(e) => setExtraCount(Number(e.target.value))}
          className="border rounded px-2 py-1 w-20"
        />
        <button
          type="button"
          onClick={addCustomExtra}
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          添加额外空间
        </button>
      </div>

      {/* 添加自定义设施 */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="设施名称，如 电影院"
          value={facilityName}
          onChange={(e) => setFacilityName(e.target.value)}
          className="border rounded px-2 py-1 flex-1"
        />
        <button
          type="button"
          onClick={addCustomFacility}
          className="bg-green-500 text-white px-3 py-1 rounded"
        >
          添加设施
        </button>
      </div>

      {/* 动态生成的上传框 */}
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
                {/* 删除按钮 */}
                <button
                  type="button"
                  className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1 rounded"
                  onClick={() => removeImage(label, index)}
                >
                  X
                </button>
                {/* 封面按钮 */}
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
