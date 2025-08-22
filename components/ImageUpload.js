"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function ImageUpload({ rooms = {}, onImagesChange }) {
  const [images, setImages] = useState({});

  // 上传文件
  const handleFileChange = (e, category) => {
    const files = Array.from(e.target.files);
    const newImages = { ...images, [category]: files };
    setImages(newImages);
    if (onImagesChange) onImagesChange(newImages);
  };

  // 删除某个图片
  const removeImage = (category, index) => {
    const updated = { ...images };
    updated[category].splice(index, 1);
    setImages(updated);
    if (onImagesChange) onImagesChange(updated);
  };

  // 渲染上传框
  const renderUploadBox = (label, category, count) => {
    if (!count || count <= 0) return null;

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">{label} 照片</h3>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFileChange(e, category)}
          className="mb-3"
        />
        <div className="grid grid-cols-3 gap-2">
          {images[category]?.map((file, index) => (
            <div key={index} className="relative">
              <img
                src={URL.createObjectURL(file)}
                alt={`${label}-${index}`}
                className="w-full h-32 object-cover rounded"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-1 right-1"
                onClick={() => removeImage(category, index)}
              >
                X
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      {renderUploadBox("卧室", "bedrooms", rooms.bedrooms)}
      {renderUploadBox("浴室", "bathrooms", rooms.bathrooms)}
      {renderUploadBox("车位", "carparks", rooms.carparks)}
      {renderUploadBox("储藏室", "storerooms", rooms.storerooms)}
    </div>
  );
}
