import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { supabase } from "../supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PriceRangeSelector from "@/components/PriceRangeSelector";
import TypeSelector from "@/components/TypeSelector";

const MapWithMarkersClient = dynamic(() => import("@/components/MapWithMarkersClient"), { ssr: false });

export default function Home() {
  const [address, setAddress] = useState("");
  const [radius, setRadius] = useState(5);             // km
  const [allProperties, setAllProperties] = useState([]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(50_000_000);
  const [selectedType, setSelectedType] = useState("");
  const [center, setCenter] = useState(null);

  // 1️⃣  页面加载：拿到房源 & 设定中心（强制转数值）
  useEffect(() => {
    const fetchProperties = async () => {
      const { data, error } = await supabase.from("properties").select("*");
      if (error) {
        console.error("❌ Failed to load properties:", error);
      } else if (data.length) {
        setAllProperties(data);
        setCenter([Number(data[0].lat) || 3.139, Number(data[0].lng) || 101.6869]);
      }
    };
    fetchProperties();
  }, []);

  // 2️⃣  点击 Search 只更新 center
  async function handleSearch() {
    if (!address.trim()) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
      );
      const geo = await res.json();
      if (!geo.length) return alert("Address not found");

      setCenter([Number(geo[0].lat), Number(geo[0].lon)]);
    } catch (err) {
      console.error("Search error:", err);
    }
  }

  // 3️⃣  这里统一把 lat/lng 转成 Number，再计算距离
  function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  const filteredProperties = allProperties.filter((p) => {
  if (!center) return false;

  const lat = Number(p.lat);
  const lng = Number(p.lng);

  // ✅ 打印每个房源的原始数据
  console.log("📦 Property:", p.title, "| Lat:", p.lat, "| Lng:", p.lng, "| Price:", p.price, "| Type:", p.type);

  if (isNaN(lat) || isNaN(lng)) {
    console.warn("❌ 无效坐标被过滤:", p.title);
    return false;
  }

  const dist = haversineKm(center[0], center[1], lat, lng);
  const okRadius = dist <= radius;
  const okPrice = p.price >= minPrice && p.price <= maxPrice;
  const okType = !selectedType || p.type?.toLowerCase().includes(selectedType.toLowerCase());

  console.log("✅ 通过距离？", okRadius, "| 价格？", okPrice, "| 类型？", okType);

  return okRadius && okPrice && okType;
});

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <Input placeholder="Enter address" value={address} onChange={(e) => setAddress(e.target.value)} />
        <Input type="number" placeholder="Radius (km)" value={radius} onChange={(e) => setRadius(+e.target.value)} />
        <PriceRangeSelector minPrice={minPrice} maxPrice={maxPrice} setMinPrice={setMinPrice} setMaxPrice={setMaxPrice}/>
        <TypeSelector selectedType={selectedType} setSelectedType={setSelectedType} />
        <Button onClick={handleSearch}>Search</Button>
      </div>

      <MapWithMarkersClient properties={filteredProperties} center={center} radius={radius} />
    </div>
  );
}
