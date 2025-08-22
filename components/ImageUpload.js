// components/ImageUpload.js
import { useState } from "react";
import { supabase } from "../supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";

export default function ImageUpload({ label, value = [], onChange }) {
  const [uploading, setUploading] = useState(false);

  // 上传文件
  const uploadFile = async (event) => {
    try {
      setUploading(true);

      const file = event.target.files[0];
      if (!file) return;

      // bucket 内路径：使用 label 中文名称
      const filePath = `${label}/${Date.now()}-${file.name}`;

      let { error } = await supabase.storage
        .from("property-images")
        .upload(filePath, file);

      if (error) {
        throw error;
      }

      const { data } = supabase.storage
        .from("property-images")
        .getPublicUrl(filePath);

      if (data?.publicUrl) {
        onChange([...value, data.publicUrl]);
        toast.success(`${label} 照片上传成功`);
      }
    } catch (error) {
      console.error("上传错误:", error.message);
      toast.error("上传失败: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  // 删除已上传图片
  const removeImage = async (url) => {
    try {
      const path = url.split("/").pop();
      await supabase.storage.from("property-images").remove([`${label}/${path}`]);
      onChange(value.filter((img) => img !== url));
      toast.success("删除成功");
    } catch (error) {
      console.error("删除失败:", error.message);
      toast.error("删除失败: " + error.message);
    }
  };

  return (
    <div className="p-4 border rounded-2xl shadow-sm bg-white mb-4">
      <h3 className="text-lg font-semibold mb-2">{label} 照片</h3>
      <Input type="file" accept="image/*" onChange={uploadFile} disabled={uploading} />

      <div className="grid grid-cols-3 gap-3 mt-3">
        {value.map((url, idx) => (
          <div key={idx} className="relative group">
            <img
              src={url}
              alt={`${label}-${idx}`}
              className="w-full h-24 object-cover rounded-lg border"
            />
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="absolute top-1 right-1 opacity-80"
              onClick={() => removeImage(url)}
            >
              删除
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
