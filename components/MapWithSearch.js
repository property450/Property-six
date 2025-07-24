import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { OpenStreetMapProvider } from "leaflet-geosearch";

// 自定义图标（解决默认图标不显示问题）
const customIcon = new L.Icon({
  iconUrl: "/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function FlyToLocation({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 13);
  }, [position]);
  return null;
}

export default function MapWithSearch({ properties }) {
  const [address, setAddress] = useState("");
  const [center, setCenter] = useState(null);
  const [radius, setRadius] = useState(5000); // 默认 5km

  const handleSearch = async () => {
    const provider = new OpenStreetMapProvider();
    const results = await provider.search({ query: address });
    if (results.length > 0) {
      const { x, y } = results[0];
      setCenter([y, x]);
    }
  };

  const propertiesWithinRadius = center
    ? properties.filter((prop) => {
        const dist = getDistanceFromLatLonInKm(
          center[0],
          center[1],
          prop.latitude,
          prop.longitude
        );
        return dist * 1000 <= radius;
      })
    : properties;

  return (
    <div>
      <div className="flex gap-2 p-2">
        <input
          type="text"
          placeholder="Enter address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="border px-2 py-1 rounded w-full"
        />
        <select
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          className="border px-2 py-1 rounded"
        >
          <option value={1000}>1km</option>
          <option value={3000}>3km</option>
          <option value={5000}>5km</option>
          <option value={10000}>10km</option>
        </select>
        <button onClick={handleSearch} className="bg-blue-500 text-white px-4 py-1 rounded">
          搜索
        </button>
      </div>

      <MapContainer
        center={center || [3.139, 101.6869]} // Default: KL
        zoom={13}
        style={{ height: "500px", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {center && (
          <>
            <FlyToLocation position={center} />
            <Marker position={center} icon={customIcon}>
              <Popup>中心点</Popup>
            </Marker>
            <Circle center={center} radius={radius} pathOptions={{ fillColor: "blue", fillOpacity: 0.2 }} />
          </>
        )}

        {propertiesWithinRadius.map((property, index) => (
          <Marker
            key={index}
            position={[property.latitude, property.longitude]}
            icon={customIcon}
          >
            <Popup>
              <strong>{property.title}</strong>
              <br />
              {property.price} RM
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

// 工具函数：计算两点之间的距离（单位：km）
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const deg2rad = (deg) => deg * (Math.PI / 180);
  const R = 6371; // 地球半径 (km)
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
