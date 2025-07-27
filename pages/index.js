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
  const [allProperties, setAllProperties] = useState([]); // ✅ 原始房源
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(50000000);
  const [selectedType, setSelectedType] = useState("");
  const [center, setCenter] = useState(null);

  useEffect(() => {
    const fetchProperties = async () => {
      const { data, error } = await supabase.from("properties").select("*");
      if (error) {
        console.error("❌ Failed to load properties:", error);
      } else {
        setAllProperties(data);
        setCenter([data[0]?.lat || 3.139, data[0]?.lng || 101.6869]);
      }
    };
    fetchProperties();
  }, []);

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
      setCenter([lat, lng]); // ✅ 只改 center，不处理房源
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

  const filteredProperties = allProperties.filter((property) => {
    if (!center) return false;

    const distance = getDistance(center[0], center[1], property.lat, property.lng);
    const inRadius = distance <= radius;
    const inPrice = property.price >= minPrice && property.price <= maxPrice;
    const inType = !selectedType || property.type?.toLowerCase().includes(selectedType.toLowerCase());

    return inRadius && inPrice && inType;
  });

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
        properties={filteredProperties} // ✅ 正确传递
        center={center}
        radius={radius}
        minPrice={minPrice}
        maxPrice={maxPrice}
        selectedType={selectedType}
      />
    </div>
  );
}
