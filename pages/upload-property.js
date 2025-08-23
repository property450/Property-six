// pages/upload-property.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { supabase } from "../supabaseClient";
import { toast } from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ImageUpload from "@/components/ImageUpload";
import TypeSelector from "@/components/TypeSelector";
import RoomCountSelector from "@/components/RoomCountSelector";
import { useUser } from "@supabase/auth-helpers-react";
import AreaSelector from "@/components/AreaSelector";
import CarparkPositionSelector from "@/components/CarparkLevelSelector";
import FacingSelector from "@/components/FacingSelector";
import PriceInput from "@/components/PriceInput";
import FacilitiesSelector from "@/components/FacilitiesSelector";
import BuildYearSelector from "@/components/BuildYearSelector";
import ExtraSpacesSelector from "@/components/ExtraSpacesSelector";
import CarparkCountSelector from "@/components/CarparkCountSelector";
import FurnitureSelector from "@/components/FurnitureSelector";
import FloorPlanSelector from "@/components/FloorPlanSelector";

const AddressSearchInput = dynamic(
  () => import("@/components/AddressSearchInput"),
  { ssr: false }
);

export default function UploadProperty() {
  const router = useRouter();
  const user = useUser();

  // ---------- mode ----------
  const [type, setType] = useState("");
  const mode =
    type === "New Project / Under Construction" ||
    type === "Completed Unit / Developer Unit"
      ? "range"
      : "single";

  // ---------- 状态 ----------
  const [price, setPrice] = useState("");
  const [carpark, setCarpark] = useState("");
  const [carparkPosition, setCarparkPosition] = useState("");
  const [customCarparkPosition, setCustomCarparkPosition] = useState("");

  // ✅ 监听 type 改变时，重置 price / carpark / carparkPosition 格式
  useEffect(() => {
    if (mode === "range") {
      if (typeof price !== "object") setPrice({ min: "", max: "" });
      if (typeof carpark !== "object") setCarpark({ min: "", max: "" });
      if (typeof carparkPosition !== "object")
        setCarparkPosition({ min: "", max: "" });
    } else {
      if (typeof price === "object") setPrice("");
      if (typeof carpark === "object") setCarpark("");
      if (typeof carparkPosition === "object") setCarparkPosition("");
    }
  }, [mode]);

  const handleCarparkPositionChange = (value) => {
    setCarparkPosition(value);
    if (value !== "其他（自定义）") {
      setCustomCarparkPosition("");
    }
  };

  // ---------- 提交时格式化 ----------
  const formatValue = (val) =>
    mode === "range" && typeof val === "object"
      ? `${val.min || ""}-${val.max || ""}`
      : val;

  // ---------- 渲染 ----------
  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-4">上传房源</h1>

      <TypeSelector value={type} onChange={setType} />

      {/* ✅ 价格输入框，自动切换 single / range */}
      <PriceInput
        value={price}
        onChange={setPrice}
        area={1000} // 假设面积
        mode={mode}
      />

      {/* ✅ 车位数量输入框，自动切换 single / range */}
      <CarparkCountSelector
        value={carpark}
        onChange={setCarpark}
        mode={mode}
      />

      {/* ✅ 车位位置输入框，自动切换 single / range */}
      <CarparkPositionSelector
        value={carparkPosition}
        onChange={handleCarparkPositionChange}
        customValue={customCarparkPosition}
        setCustomValue={setCustomCarparkPosition}
        mode={mode}
      />

      <Button>提交</Button>
    </div>
  );
}
