import { useState } from 'react';

export default function ImageUpload({ images, setImages }) {
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <input type="file" multiple accept="image/*" onChange={handleImageChange} />
      <div className="grid grid-cols-3 gap-2">
        {images.map((img, index) => (
          <div key={index} className="relative">
            <img src={img.url} alt={`preview-${index}`} className="w-full h-32 object-cover rounded" />
            <button
              type="button"
              className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1 rounded"
              onClick={() => removeImage(index)}
            >
              X
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
