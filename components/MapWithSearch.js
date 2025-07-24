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
import FilterPanel from "./FilterPanel";

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

export default function MapWithSearch({ properties, filters, setFilters }) {
  const [center, setCenter] = useState(null);
  const radius = (filters?.distance || 5) * 1000; // 单位 km -> m

  const handleSearch = async () => {
    if (!filters?.keyword) return;
    const provider = new OpenStreetMapProvider();
    const results = await provider.search({ query: filters.keyword });
    if (results.length > 0) {
      const { x, y } = results[0];
      const newCenter = [y, x];
      setCenter(newCenter);
      setFilters((prev) => ({
        ...prev,
        location: { lat: y, lng: x },
      }));
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
      <div className="p-4">
        {/* 筛选面板 */}
        <FilterPanel filters={filters} setFilters={setFilters} />

        <div className="flex gap-2 mt-2">
          <input
            type="text"
            placeholder="请输入地址 / Enter address"
            value={filters.keyword || ""}
            onChange={(e) =>
              setFilters((f) => ({ ...f, keyword: e.target.value }))
            }
            className="border px-2 py-1 rounded w-full"
          />
          <select
            value={filters.distance || 5}
            onChange={(e) =>
              setFilters((f) => ({ ...f, distance: Number(e.target.value) }))
            }
            className="border px-2 py-1 rounded"
          >
            <option value={1}>1km</option>
            <option value={3}>3km</option>
            <option value={5}>5km</option>
            <option value={10}>10km</option>
          </select>
          <button
            onClick={handleSearch}
            className="bg-blue-500 text-white px-4 py-1 rounded"
          >
            搜索
          </button>
        </div>
      </div>

      <MapContainer
        center={center || [3.139, 101.6869]} // Default to KL
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
              <Popup>搜索中心</Popup>
            </Marker>
            <Circle
              center={center}
              radius={radius}
              pathOptions={{ fillColor: "blue", fillOpacity: 0.2 }}
            />
          </>
        )}

        {propertiesWithinRadius.map((property, index) => (
          <Marker
            key={index}
            position={[property.lat, property.lng]}
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
