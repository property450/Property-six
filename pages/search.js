import { useState } from "react";
import dynamic from "next/dynamic";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const MapWithMarkersClient = dynamic(
  () => import("@/components/MapWithMarkersClient"),
  { ssr: false }
);

export default function SearchPage() {
  const [address, setAddress] = useState("");
  const [searchLocation, setSearchLocation] = useState(null);

  const handleSearch = async () => {
    if (!address) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          address
        )}&format=json`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setSearchLocation({ lat, lng });
      } else {
        alert("Address not found");
      }
    } catch (error) {
      console.error("Error fetching location:", error);
      alert("Failed to fetch location.");
    }
  };

  return (
    <div className="p-4">
      <div className="flex gap-2 mb-4">
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter address to search"
          className="w-full"
        />
        <Button onClick={handleSearch}>Search</Button>
      </div>
      <MapWithMarkersClient searchLocation={searchLocation} radius={5} />
    </div>
  );
}
