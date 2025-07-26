// pages/index.js
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { supabase } from "../supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PriceRangeSelector from "@/components/PriceRangeSelector";
import TypeSelector from "@/components/TypeSelector";

const MapWithMarkers = dynamic(() => import("@/components/MapWithMarkersClient"), {
  ssr: false,
});

export default function HomePage() {
  const [address, setAddress] = useState("");
  const [properties, setProperties] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 5000000]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [triggerSearch, setTriggerSearch] = useState(false);

  useEffect(() => {
    const fetchProperties = async () => {
      const { data, error } = await supabase.from("properties").select("*");
      if (error) {
        console.error("Failed to fetch properties:", error.message);
      } else {
        setProperties(data);
      }
    };
    fetchProperties();
  }, []);

  const handleSearch = () => {
    setTriggerSearch(!triggerSearch); // toggle to re-trigger Map update
  };

  return (
    <div className="p-4">
      <div className="grid gap-2 md:grid-cols-4 mb-4">
        <Input
          type="text"
          placeholder="Enter address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <PriceRangeSelector value={priceRange} onChange={setPriceRange} />
        <TypeSelector value={selectedTypes} onChange={setSelectedTypes} />
        <Button onClick={handleSearch}>Search</Button>
      </div>

      <MapWithMarkers
        address={address}
        properties={properties}
        priceRange={priceRange}
        selectedTypes={selectedTypes}
        triggerSearch={triggerSearch}
      />
    </div>
  );
}
