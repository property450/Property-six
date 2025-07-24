// pages/search.js
import dynamic from "next/dynamic";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const MapWithMarkers = dynamic(() => import("@/components/MapWithMarkersClient"), {
  ssr: false,
});

export default function SearchPage() {
  const [address, setAddress] = useState("");
  const [center, setCenter] = useState(null);
  const [radius, setRadius] = useState(5); // in km

  const handleSearch = async () => {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address
      )}`
    );
    const data = await res.json();
    if (data && data[0]) {
      setCenter({
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      });
    } else {
      alert("Address not found");
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-2 items-center">
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter address"
        />
        <Input
          type="number"
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          className="w-24"
          min={1}
          max={50}
          placeholder="km"
        />
        <Button onClick={handleSearch}>Search</Button>
      </div>
      <MapWithMarkers center={center} radius={radius} />
    </div>
  );
}
