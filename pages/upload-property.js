// pages/upload-property.js
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { supabase } from "../supabaseClient";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";

import TypeSelector from "@/components/TypeSelector";
import UnitTypeSelector from "@/components/UnitTypeSelector";
import UnitLayoutForm from "@/components/UnitLayoutForm";
import AreaSelector from "@/components/AreaSelector";
import PriceInput from "@/components/PriceInput";
import RoomCountSelector from "@/components/RoomCountSelector";
import CarparkCountSelector from "@/components/CarparkCountSelector";
import ExtraSpacesSelector from "@/components/ExtraSpacesSelector";
import FacingSelector from "@/components/FacingSelector";
import CarparkLevelSelector from "@/components/CarparkLevelSelector";
import FacilitiesSelector from "@/components/FacilitiesSelector";
import FurnitureSelector from "@/components/FurnitureSelector";
import BuildYearSelector from "@/components/BuildYearSelector";
import ImageUpload from "@/components/ImageUpload";
import TransitSelector from "@/components/TransitSelector";
import AdvancedAvailabilityCalendar from "@/components/AdvancedAvailabilityCalendar";

import { useUser } from "@supabase/auth-helpers-react";

const AddressSearchInput = dynamic(
  () => import("@/components/AddressSearchInput"),
  { ssr: false }
);

export default function UploadProperty() {
  const router = useRouter();
  const user = useUser();
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user === null) router.push("/login");
  }, [user, router]);

  if (!user) return <div>正在检查登录状态...</div>;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [type, setType] = useState("");
  const [propertyStatus, setPropertyStatus] = useState("");
  const [unitLayouts, setUnitLayouts] = useState([]);
  const [singleFormData, setSingleFormData] = useState({
    price: "",
    buildUp: "",
    bedrooms: "",
    bathrooms: "",
    kitchens: "",
    livingRooms: "",
    carpark: "",
    store: "",
    facilities: [],
    furniture: [],
    extraSpaces: [],
    facing: "",
    photos: [],
    layoutPhotos: [],
    buildYear: "",
    quarter: "",
  });

  const [areaData, setAreaData] = useState({
    types: ["buildUp"],
    units: { buildUp: "square feet", land: "square feet" },
    values: { buildUp: "", land: "" },
  });

  const [availability, setAvailability] = useState({});
  const [transitInfo, setTransitInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  // 公用面积换算
  const convertToSqft = (val, unit) => {
    const num = parseFloat(String(val || "").replace(/,/g, ""));
    if (isNaN(num) || num <= 0) return 0;
    const u = (unit || "").toString().toLowerCase();
    if (u.includes("square meter") || u.includes("sq m") || u.includes("square metres")) {
      return num * 10.7639;
    }
    if (u.includes("acre")) return num * 43560;
    if (u.includes("hectare")) return num * 107639;
    return num; // assume sqft
  };

  const handleAreaChange = (data) => {
    setAreaData(data);
  };

  const handleLocationSelect = ({ lat, lng, address }) => {
    setLatitude(lat);
    setLongitude(lng);
    setAddress(address);
  };

  const handleLayoutUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newPhotos = [...(singleFormData.layoutPhotos || []), ...files];
    setSingleFormData({ ...singleFormData, layoutPhotos: newPhotos });
  };

  // ✅ 这里计算：New Project / Completed Unit 总体的「每平方尺 RM x ~ RM y」
  const projectPricePerSqftText = (() => {
    if (
      propertyStatus !== "New Project / Under Construction" &&
      propertyStatus !== "Completed Unit / Developer Unit"
    ) {
      return "";
    }

    if (!Array.isArray(unitLayouts) || unitLayouts.length === 0) return "";

    // 从 layout.buildUp（AreaSelector 返回的对象）里算出面积 sqft
    const getAreaSqftFromLayout = (layout) => {
      const b = layout.buildUp;
      if (!b || typeof b !== "object") return 0;

      // 兼容 AreaSelector 的结构 { values, units }
      const values = b.values || {};
      const units = b.units || {};

      const buildUpVal = values.buildUp ?? 0;
      const landVal = values.land ?? 0;
      const buildUpUnit = units.buildUp || "square feet";
      const landUnit = units.land || "square feet";

      const buildUpSqft = convertToSqft(buildUpVal, buildUpUnit);
      const landSqft = convertToSqft(landVal, landUnit);

      return buildUpSqft + landSqft;
    };

    let totalArea = 0;
    let totalMin = 0;
    let totalMax = 0;

    unitLayouts.forEach((l) => {
      const areaSqft = getAreaSqftFromLayout(l);
      totalArea += areaSqft;

      // 价格字符串例如 "500000-800000"
      if (typeof l.price === "string" && l.price.includes("-")) {
        const [minStr, maxStr] = l.price.split("-");
        const minP = Number(String(minStr).replace(/,/g, "")) || 0;
        const maxP = Number(String(maxStr).replace(/,/g, "")) || 0;
        totalMin += minP;
        totalMax += maxP;
      }
    });

    if (totalArea <= 0 || (totalMin <= 0 && totalMax <= 0)) return "";

    const minPsf = totalMin / totalArea;
    const maxPsf = totalMax / totalArea;

    return `每平方英尺: RM ${minPsf.toFixed(2)} ~ RM ${maxPsf.toFixed(2)}`;
  })();

  const handleSubmit = async () => {
    if (!title || !address || !latitude || !longitude) {
      toast.error("请填写完整信息");
      return;
    }

    setLoading(true);
    try {
      const { data: propertyData, error } = await supabase
        .from("properties")
        .insert([
          {
            title,
            description,
            unit_layouts: JSON.stringify(unitLayouts.length > 0 ? unitLayouts : [singleFormData]),
            price: singleFormData.price || undefined,
            address,
            lat: latitude,
            lng: longitude,
            user_id: user.id,
            type,
            build_year: singleFormData.buildYear,
            bedrooms: single
