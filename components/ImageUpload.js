// components/ImageUpload.js
import { useState } from "react";
import { ReactSortable } from "react-sortablejs";

export default function ImageUpload({ config, images, setImages }) {
  // 把不同房间类别的图片分开存储
  const handleImageChange = (category, e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setImages((prev) => ({
      ...prev,
      [category]: [...(prev[category] || []), ...newImages],
    }));
  };

  const removeImage = (category, index) => {
    setImages((prev) => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-6">
      {Object.entries(config).map(([key, count]) => {
        // 只针对数字型的配置生成上传框架
        if (typeof count !== "number" || count <= 0) return null;

        return (
          <div key={key}>
            <h3 className="font-semibold mb-2">{key}</h3>
            {[...Array(count)].map((_, i) => {
              const category = `${key}_${i + 1}`;
              return (
                <div key={category} className="mb-4 border rounded p-2">
                  <p className="text-sm font-medium mb-1">
                    {key} {i + 1}
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleImageChange(category, e)}
                  />
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {(images[category] || []).map((img, index) => (
                      <div key={index} className="relative">
                        <img
                          src={img.url}
                          alt={`preview-${index}`}
                          className="w-full h-32 object-cover rounded"
                        />
                        <button
                          type="button"
                          className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1 rounded"
                          onClick={() => removeImage(category, index)}
                        >
                          X
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
