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
  const [radius, setRadius] = useState(5); // km
  const [allProperties, setAllProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(50_000_000);
  const [selectedType, setSelectedType] = useState("");
  const [center, setCenter] = useState(null);

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

  useEffect(() => {
  if (!center) return;
  
   const filtered = allProperties.filter((p) => {
  const lat = parseFloat(p.lat);
  const lng = parseFloat(p.lng);
  const price = parseFloat((p.price || "").toString().replace(/,/g, "")); // 防逗号

  const min = Number(minPrice);
  const max = Number(maxPrice);

  if (isNaN(lat) || isNaN(lng)) {
    console.warn("❌ 无效坐标被过滤:", p.title);
    return false;
  }

  const dist = haversineKm(center[0], center[1], lat, lng);
  const okRadius = dist <= radius;

  const matchPrice =
    (isNaN(min) && isNaN(max)) ||
    (!isNaN(min) && !isNaN(max) && price >= min && price <= max) ||
    (!isNaN(min) && isNaN(max) && price >= min) ||
    (isNaN(min) && !isNaN(max) && price <= max);

  const matchType =
    !selectedType ||
    (p.type || "").toLowerCase().includes(selectedType.toLowerCase());

  console.log(
    `🏠 ${p.title} | 距离=${dist.toFixed(2)}km | ✅距离=${okRadius}, ✅价格=${matchPrice}, ✅类型=${matchType}`
  );

  return okRadius && matchPrice && matchType;
});

  // ✅ 这里才是正确位置
  console.log("📊 传入 Map 的房源数量:", filtered.length);
  setFilteredProperties(filtered);
}, [center, radius, minPrice, maxPrice, selectedType, allProperties]);

  return (
  <div className="p-4">
    {/* 上方筛选器区块 */}
    <div className="flex flex-col md:flex-row gap-2 mb-4">
      <Input
        placeholder="Enter address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />
      <Input
        type="number"
        placeholder="Radius (km)"
        value={radius}
        onChange={(e) => setRadius(+e.target.value)}
      />
      <PriceRangeSelector
        minPrice={minPrice}
        maxPrice={maxPrice}
        setMinPrice={setMinPrice}
        setMaxPrice={setMaxPrice}
      />
      <TypeSelector
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        onChange={(value) => setSelectedType(value)}
      />
      <Button onClick={handleSearch}>Search</Button>
    </div>

    {/* 地图展示区块 */}
    <MapWithMarkersClient
      properties={filteredProperties}
      center={center}
      radius={radius}
    />
  </div>
); // ✅ 关闭 return
}   // ✅ 关闭 Home 函数
