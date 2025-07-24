import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { supabase } from "@/supabaseClient";

// Fix: Leaflet icon bug in Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});

const defaultCenter = { lat: 3.139, lng: 101.6869 }; // Kuala Lumpur

export default function MapWithMarkersClient({ searchLocation, radius = 5 }) {
  const [properties, setProperties] = useState([]);

  const center = searchLocation || defaultCenter;

  useEffect(() => {
    const fetchProperties = async () => {
      const { data, error } = await supabase.from("properties").select("*");
      if (error) {
        console.error("Error fetching properties:", error);
      } else {
        setProperties(data);
      }
    };

    fetchProperties();
  }, []);

  const isWithinRadius = (property) => {
    if (!property.latitude || !property.longitude) return false;

    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371;

    const dLat = toRad(property.latitude - center.lat);
    const dLng = toRad(property.longitude - center.lng);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(center.lat)) *
        Math.cos(toRad(property.latitude)) *
        Math.sin(dLng / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance <= radius;
  };

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      scrollWheelZoom={true}
      style={{ height: "80vh", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://osm.org">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {searchLocation && (
        <Circle
          center={[center.lat, center.lng]}
          radius={radius * 1000}
          pathOptions={{
            fillColor: "blue",
            fillOpacity: 0.2,
            color: "blue",
          }}
        />
      )}

      {properties
        .filter((p) => isWithinRadius(p))
        .map((property) => (
          <Marker
            key={property.id}
            position={[property.latitude, property.longitude]}
          >
            <Popup>
              <strong>{property.title}</strong>
              <br />
              {property.address}
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}
