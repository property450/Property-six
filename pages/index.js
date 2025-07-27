import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { supabase } from "../supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PriceRangeSelector from "@/components/PriceRangeSelector";
import TypeSelector from "@/components/TypeSelector";

const MapWithMarkersClient = dynamic(() => import("@/components/MapWithMarkersClient"), {
  ssr: false,
});

export default function Home() {
  const [address, setAddress] = useState("");
  const [radius, setRadius] = useState(5); // km
  const [properties, setProperties] = useState([]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(50000000);
  const [selectedType, setSelectedType] = useState("");
  const [center, setCenter] = useState(null);

  async function handleSearch() {
  if (!address) return;

  try {
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
    );
    const data = await geoRes.json();
    if (data.length === 0) {
      alert("Address not found.");
      return;
    }

    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);
    setCenter([lat, lng]);

    const { data: allProps, error } = await supabase.from("properties").select("*");
    if (error) {
      console.error("❌ Supabase error:", error);
      return;
    }

    console.log("📦 所有房源数据：", allProps); // ✅ 放到这里才对

    const filtered = allProps.filter((prop) => {
      const d = getDistance(lat, lng, Number(prop.lat), Number(prop.lng));
      const inRadius = d <= radius;
      const inPrice = prop.price >= minPrice && prop.price <= maxPrice;
      const inType = !selectedType || (prop.type && prop.type.includes(selectedType));
      return inRadius && inPrice && inType;
    });

    console.log("✅ 筛选后房源：", filtered); // 加一个调试点看看是否为空
    setProperties(filtered);
  } catch (err) {
    console.error("Search error:", err);
  }
}

  function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  return (
    <div className="p-4">
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
          onChange={(e) => setRadius(Number(e.target.value))}
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
        />
        <Button onClick={handleSearch}>Search</Button>
      </div>

      <MapWithMarkersClient
        properties={properties}
        center={center}
        radius={radius}
      />
    </div>
  );
}
