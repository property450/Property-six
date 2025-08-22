import { useState } from "react";
import { ReactSortable } from "react-sortablejs"; // 需要安装：npm install react-sortablejs

export default function ImageUpload({ label, images, setImages, coverIndex, setCoverIndex }) {
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newImages]);
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    if (coverIndex === index) setCoverIndex(null);
  };

  const setCover = (index) => {
    setCoverIndex(index);
  };

  return (
    <div className="space-y-2 border rounded p-2">
      <p className="font-semibold">{label}</p>
      <input type="file" multiple accept="image/*" onChange={handleImageChange} />
      <ReactSortable list={images} setList={setImages} className="grid grid-cols-3 gap-2">
        {images.map((img, index) => (
          <div key={index} className="relative">
            <img
              src={img.url}
              alt={`preview-${index}`}
              className={`w-full h-32 object-cover rounded ${
                coverIndex === index ? "border-4 border-green-500" : ""
              }`}
            />
            {/* 删除按钮 */}
            <button
              type="button"
              className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1 rounded"
              onClick={() => removeImage(index)}
            >
              X
            </button>
            {/* 封面按钮 */}
            <button
              type="button"
              className="absolute bottom-1 left-1 bg-black text-white text-xs px-1 rounded"
              onClick={() => setCover(index)}
            >
              {coverIndex === index ? "封面" : "设为封面"}
            </button>
          </div>
        ))}
      </ReactSortable>
    </div>
  );
}
