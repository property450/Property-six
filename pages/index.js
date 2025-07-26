// pages/index.js
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { supabase } from "../supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PriceRangeSelector from "@/components/PriceRangeSelector";
import TypeSelector from "@/components/TypeSelector";
import DistanceSelector from "@/components/DistanceSelector";
import { geocodeByAddress } from "@/utils/geocode";

const MapWithMarkersClient = dynamic(() => import("@/components/MapWithMarkersClient"), { ssr: false });

export default function HomePage() {
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState(null);
  const [properties, setProperties] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 5000000]);
  const [type, setType] = useState("");
  const [distance, setDistance] = useState(5); // ✅ 设置默认值为 5km

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    const { data, error } = await supabase.from("properties").select("*");
    if (!error) setProperties(data);
  };

  const handleSearch = async () => {
    if (!address) return;
    const result = await geocodeByAddress(address);
    if (result) setLocation(result);
  };

  return (
    <div className="flex">
      <div className="w-1/4 p-4">
        <Input
          type="text"
          placeholder="Enter address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <Button className="mt-2" onClick={handleSearch}>
          Search
        </Button>
        <DistanceSelector distance={distance} setDistance={setDistance} />
        <PriceRangeSelector priceRange={priceRange} setPriceRange={setPriceRange} />
        <TypeSelector type={type} setType={setType} />
      </div>
      <div className="w-3/4">
        <MapWithMarkersClient
          center={location || { lat: 3.139, lng: 101.6869 }}
          properties={properties}
          distance={distance}
        />
      </div>
    </div>
  );
}
