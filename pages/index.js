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

const MapWithMarkersClient = dynamic(() => import("@/components/MapWithMarkersClient"), {
  ssr: false,
});

const DEFAULT_LOCATION = { lat: 3.139, lng: 101.6869 }; // 吉隆坡

export default function HomePage() {
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [properties, setProperties] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 5000000]);
  const [type, setType] = useState("");
  const [distance, setDistance] = useState(5); // 默认5km

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    const { data, error } = await supabase.from("properties").select("*");
    if (!error) setProperties(data);
    else console.error("Error fetching properties:", error);
  };

  const handleSearch = async () => {
    if (!address) return;
    try {
      const result = await geocodeByAddress(address);
      if (result && result.lat && result.lng) {
        setLocation(result);
      } else {
        console.warn("Geocoding failed or returned invalid result, using default location");
        setLocation(DEFAULT_LOCATION);
      }
    } catch (err) {
      console.error("Geocoding error:", err);
      setLocation(DEFAULT_LOCATION);
    }
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
          center={location}
          properties={properties}
          distance={Number(distance)} // 强制为数字
          priceRange={priceRange}
          type={type}
        />
      </div>
    </div>
  );
}
