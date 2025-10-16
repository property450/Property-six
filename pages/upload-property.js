// pages/upload-property.js
"use client";
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
import PriceInput from "@/components/PriceInput";
import CarparkLevelSelector from "@/components/CarparkLevelSelector";
import BuildYearSelector from "@/components/BuildYearSelector";
import AdvancedAvailabilityCalendar from "@/components/AdvancedAvailabilityCalendar";

export default function UploadProperty() {
  const router = useRouter();

  const [singleFormData, setSingleFormData] = useState({
    title: "",
    description: "",
    address: "",
    price: "",
    size: "",
    bedrooms: 0,
    bathrooms: 0,
    kitchen: 0,
    livingroom: 0,
    carpark: 0,
    facilities: [],
    furniture: [],
    type: "",
    carparkPosition: "",
    buildYear: "",
    quarter: "",
    photos: [],          // ✅ 保证为数组
    layoutPhotos: [],    // ✅ 保证为数组
  });

  const [availability, setAvailability] = useState([]);
  const [sizeInSqft, setSizeInSqft] = useState("");

  const propertyStatus = singleFormData?.type || "";

  // ✅ 提交表单
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from("properties").insert([
        {
          title: singleFormData.title,
          description: singleFormData.description,
          address: singleFormData.address,
          price: singleFormData.price,
          size: singleFormData.size,
          bedrooms: singleFormData.bedrooms,
          bathrooms: singleFormData.bathrooms,
          kitchen: singleFormData.kitchen,
          livingroom: singleFormData.livingroom,
          carpark: singleFormData.carpark,
          type: singleFormData.type,
          carparkPosition: singleFormData.carparkPosition,
          buildYear: singleFormData.buildYear,
          quarter: singleFormData.quarter,
          photos: singleFormData.photos,
          layoutPhotos: singleFormData.layoutPhotos,
          facilities: JSON.stringify(singleFormData.facilities || []),  // ✅ 修复
          furniture: JSON.stringify(singleFormData.furniture || []),    // ✅ 修复
          availability: availability,
        },
      ]);

      if (error) throw error;

      toast.success("Property uploaded successfully!");
      router.push("/");
    } catch (err) {
      console.error(err);
      toast.error("Upload failed, please try again.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Upload Property</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block mb-1 font-medium">Title</label>
          <Input
            value={singleFormData.title}
            onChange={(e) =>
              setSingleFormData({ ...singleFormData, title: e.target.value })
            }
            placeholder="Property title"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block mb-1 font-medium">Description</label>
          <Input
            value={singleFormData.description}
            onChange={(e) =>
              setSingleFormData({ ...singleFormData, description: e.target.value })
            }
            placeholder="Property description"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block mb-1 font-medium">Address</label>
          <Input
            value={singleFormData.address}
            onChange={(e) =>
              setSingleFormData({ ...singleFormData, address: e.target.value })
            }
            placeholder="Property address"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block mb-1 font-medium">Property Type</label>
          <TypeSelector
            value={singleFormData.type}
            onChange={(val) =>
              setSingleFormData({ ...singleFormData, type: val })
            }
          />
        </div>

        {/* Price Input */}
        <div>
          <label className="block mb-1 font-medium">Price</label>
          <PriceInput
            value={singleFormData.price}
            onChange={(val) =>
              setSingleFormData({ ...singleFormData, price: val })
            }
            area={sizeInSqft}
            type={propertyStatus}   // ✅ 关键修复点
          />
        </div>

        {/* Size Input */}
        <div>
          <label className="block mb-1 font-medium">Size (sqft)</label>
          <Input
            type="number"
            value={singleFormData.size}
            onChange={(e) => {
              const val = e.target.value;
              setSingleFormData({ ...singleFormData, size: val });
              setSizeInSqft(val);
            }}
            placeholder="e.g. 1200"
          />
        </div>

        {/* Rooms Selector */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <RoomCountSelector
            label="Bedrooms"
            value={singleFormData.bedrooms}
            onChange={(val) =>
              setSingleFormData({ ...singleFormData, bedrooms: val })
            }
          />
          <RoomCountSelector
            label="Bathrooms"
            value={singleFormData.bathrooms}
            onChange={(val) =>
              setSingleFormData({ ...singleFormData, bathrooms: val })
            }
          />
          <RoomCountSelector
            label="Kitchen"
            value={singleFormData.kitchen}
            onChange={(val) =>
              setSingleFormData({ ...singleFormData, kitchen: val })
            }
          />
          <RoomCountSelector
            label="Living Room"
            value={singleFormData.livingroom}
            onChange={(val) =>
              setSingleFormData({ ...singleFormData, livingroom: val })
            }
          />
          <RoomCountSelector
            label="Carpark"
            value={singleFormData.carpark}
            onChange={(val) =>
              setSingleFormData({ ...singleFormData, carpark: val })
            }
          />
        </div>

        {/* 特殊类型：酒店/民宿 */}
        {(propertyStatus?.includes("Homestay") ||
          propertyStatus?.includes("Hotel")) && (
          <>
            <AdvancedAvailabilityCalendar
              value={availability}
              onChange={setAvailability}
            />

            <CarparkLevelSelector
              value={singleFormData.carparkPosition}
              onChange={(val) =>
                setSingleFormData({ ...singleFormData, carparkPosition: val })
              }
              mode={
                propertyStatus === "New Project / Under Construction" ||
                propertyStatus === "Completed Unit / Developer Unit"
                  ? "range"
                  : "single"
              }
            />

            <BuildYearSelector
              value={singleFormData.buildYear}
              onChange={(val) =>
                setSingleFormData({ ...singleFormData, buildYear: val })
              }
              quarter={singleFormData.quarter}
              onQuarterChange={(val) =>
                setSingleFormData({ ...singleFormData, quarter: val })
              }
              showQuarter={propertyStatus === "New Project / Under Construction"}
            />
          </>
        )}

        {/* Image Upload */}
        <div>
          <label className="block mb-1 font-medium">Photos</label>
          <ImageUpload
            images={singleFormData.photos || []}
            setImages={(updated) =>
              setSingleFormData({ ...singleFormData, photos: updated })
            }
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Layout Photos</label>
          <ImageUpload
            images={singleFormData.layoutPhotos || []}
            setImages={(updated) =>
              setSingleFormData({ ...singleFormData, layoutPhotos: updated })
            }
          />
        </div>

        <Button type="submit" className="w-full mt-6">
          Submit Property
        </Button>
      </form>
    </div>
  );
}
