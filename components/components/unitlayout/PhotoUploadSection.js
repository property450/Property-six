// components/unitlayout/PhotoUploadSection.js
"use client";

export default function PhotoUploadSection({
  uploadLabels,
  photosByLabel,
  onPhotoChange,
  onRemovePhoto,
  onSetCover,
}) {
  return (
    <div className="mb-3">
      <label className="block mb-1 font-medium">上传此 Layout 的照片</label>
      <div className="space-y-4">
        {uploadLabels.map((label) => (
          <div key={label} className="space-y-2 border rounded p-2">
            <p className="font-semibold">{label}</p>

            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => onPhotoChange(e, label)}
            />

            <div className="grid grid-cols-3 gap-2">
              {(photosByLabel[label] || []).map((img, index) => (
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
                    onClick={() => onRemovePhoto(label, index)}
                  >
                    X
                  </button>

                  <button
                    type="button"
                    className="absolute bottom-1 left-1 bg-black text-white text-xs px-1 rounded"
                    onClick={() => onSetCover(label, index)}
                  >
                    {img.isCover ? "封面" : "设为封面"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
